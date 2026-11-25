// Linha digitável do boleto: confere os números, sem enviar nada.
//
// Regras (pesquisa-v0.1, seção 1, fontes primárias):
// - Boleto de cobrança, 47 dígitos: Banco do Brasil, "Especificações Técnicas
//   para Confecção de Boleto de Cobrança" (Anexos IV, V e VI) e Santander,
//   "Código de barras" v36 (abr/2025).
// - Arrecadação/convênio, 48 dígitos: Febraban, "Layout Padrão de
//   Arrecadação/Recebimento com Utilização do Código de Barras", versão 08.
//
// O que a linha NÃO diz: quem recebe o dinheiro. Uma linha com todos os
// números certos pode ser de golpista. Por isso o resultado sempre termina
// mandando conferir o nome do beneficiário no aplicativo do banco.

import { BANCOS } from "./dados/bancos.js";

/** Só os dígitos do que foi colado (tira espaços, pontos e traços). */
export function soDigitos(texto) {
  return String(texto ?? "").replace(/\D/g, "");
}

// ---- dígitos verificadores ------------------------------------------------

/** Módulo 10: pesos 2, 1, 2, 1… da direita; produto > 9 soma os algarismos. */
export function modulo10(numero) {
  let soma = 0;
  let peso = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    const produto = Number(numero[i]) * peso;
    soma += Math.floor(produto / 10) + (produto % 10);
    peso = peso === 2 ? 1 : 2;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

function somaModulo11(numero) {
  let soma = 0;
  let peso = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    soma += Number(numero[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  return soma;
}

/** DV geral do boleto de cobrança: 11 − resto; se der 0, 10 ou 11, o DV é 1 (BB, Anexo VI). */
export function modulo11Cobranca(numero) {
  const dv = 11 - (somaModulo11(numero) % 11);
  return dv === 0 || dv === 10 || dv === 11 ? 1 : dv;
}

/** Módulo 11 da arrecadação: resto 0 ou 1 → 0; resto 10 → 1 (Febraban v8, seção 9). */
export function modulo11Arrecadacao(numero) {
  const resto = somaModulo11(numero) % 11;
  if (resto === 0 || resto === 1) return 0;
  if (resto === 10) return 1;
  return 11 - resto;
}

// ---- vencimento -------------------------------------------------------------

const DIA = 24 * 60 * 60 * 1000;
// Regra antiga: dias desde 07/10/1997 (fator 1000 = 03/07/2000; 9999 = 21/02/2025).
const BASE_CICLO_1 = Date.UTC(1997, 9, 7);
// Regra nova: "a partir de 22.02.2025, o fator retorna para 1000" (BB, Anexo IV),
// o que equivale a contar dias desde 29/05/2022.
const BASE_CICLO_2 = Date.UTC(2022, 4, 29);

function dataUTC(ms) {
  const d = new Date(ms);
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate(), ms };
}

export function formatarData({ dia, mes, ano }) {
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

/**
 * As duas datas possíveis de um fator de vencimento (1000 a 9999) e a mais
 * provável: a mais próxima de hoje. ATENÇÃO: escolher a mais próxima de hoje
 * NÃO é regra oficial; é estimativa, e o site diz isso.
 */
export function vencimentoDoFator(fator, hoje = new Date()) {
  if (!Number.isInteger(fator) || fator < 1000 || fator > 9999) return null;
  const c1 = dataUTC(BASE_CICLO_1 + fator * DIA);
  const c2 = dataUTC(BASE_CICLO_2 + fator * DIA);
  const agora = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const [provavel, outra] = Math.abs(c1.ms - agora) <= Math.abs(c2.ms - agora) ? [c1, c2] : [c2, c1];
  return { provavel, outra };
}

// ---- valor --------------------------------------------------------------------

function formatarMilhar(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function reais(centavos) {
  return `R$ ${formatarMilhar(Math.floor(centavos / 100))},${String(centavos % 100).padStart(2, "0")}`;
}

// ---- leitura da linha ------------------------------------------------------------

const SEGMENTOS = {
  1: "Prefeituras",
  2: "Saneamento",
  3: "Energia elétrica e gás",
  4: "Telecomunicações",
  5: "Órgãos governamentais",
  6: "Carnês e assemelhados",
  7: "Multas de trânsito",
  9: "Uso exclusivo do banco",
};

function lerCobranca(d, hoje) {
  const campos = [
    { numero: d.slice(0, 9), dv: Number(d[9]) },
    { numero: d.slice(10, 20), dv: Number(d[20]) },
    { numero: d.slice(21, 31), dv: Number(d[31]) },
  ];
  const camposOk = campos.map((c) => modulo10(c.numero) === c.dv);
  const banco = d.slice(0, 3);
  const fatorValor = d.slice(33, 47);
  const codigoSemDv = d.slice(0, 4) + fatorValor + d.slice(4, 9) + d.slice(10, 20) + d.slice(21, 31);
  const dvGeralOk = modulo11Cobranca(codigoSemDv) === Number(d[32]);
  const fator = Number(fatorValor.slice(0, 4));
  const centavos = Number(fatorValor.slice(4));
  return {
    tipo: "cobranca",
    camposOk,
    dvGeralOk,
    numerosOk: camposOk.every(Boolean) && dvGeralOk,
    banco: { codigo: banco, nome: BANCOS[banco] ?? null },
    valorCentavos: centavos > 0 ? centavos : null,
    vencimento: vencimentoDoFator(fator, hoje),
    fator,
  };
}

function lerArrecadacao(d) {
  const blocos = [0, 1, 2, 3].map((i) => ({ numero: d.slice(i * 12, i * 12 + 11), dv: Number(d[i * 12 + 11]) }));
  const codigo = blocos.map((b) => b.numero).join(""); // código de barras, 44 posições
  const identificador = codigo[2];
  const mod = identificador === "6" || identificador === "7" ? modulo10 : identificador === "8" || identificador === "9" ? modulo11Arrecadacao : null;
  const camposOk = blocos.map((b) => (mod ? mod(b.numero) === b.dv : false));
  const dvGeralOk = mod ? mod(codigo.slice(0, 3) + codigo.slice(4)) === Number(codigo[3]) : false;
  const emReais = identificador === "6" || identificador === "8";
  return {
    tipo: "arrecadacao",
    identificadorValido: Boolean(mod),
    camposOk,
    dvGeralOk,
    numerosOk: Boolean(mod) && camposOk.every(Boolean) && dvGeralOk,
    segmento: SEGMENTOS[codigo[1]] ?? null,
    valorCentavos: emReais ? Number(codigo.slice(4, 15)) || null : null,
    valorEmReferencia: !emReais,
  };
}

/**
 * Lê a linha digitável.
 * status: "vazio" | "tamanho-invalido" | "lida"
 */
export function conferirLinha(texto, hoje = new Date()) {
  const digitos = soDigitos(texto);
  if (!digitos) return { status: "vazio", digitos };
  if (digitos.length === 47) return { status: "lida", digitos, ...lerCobranca(digitos, hoje) };
  if (digitos.length === 48 && digitos[0] === "8") return { status: "lida", digitos, ...lerArrecadacao(digitos) };
  return { status: "tamanho-invalido", digitos };
}

// ---- texto do resultado -----------------------------------------------------------

export const AVISO_BENEFICIARIO =
  "Antes de pagar, confira no aplicativo do seu banco o NOME de quem vai receber (o beneficiário). Se não for a empresa que cobra, não pague.";
export const AVISO_LINHA_VALIDA =
  "Números corretos não garantem que o boleto seja da empresa: golpistas também geram boletos com números corretos.";
// Na cobrança, a parte do vencimento e do valor (o último bloco) só é protegida
// pelo dígito geral, e a própria regra da Febraban deixa passar algumas trocas
// de um número ali. Por isso: comparar com o que está impresso.
export const AVISO_COMPARAR =
  "Compare o valor e o vencimento mostrados aqui com os que estão impressos no boleto. Se forem diferentes, não pague: um número trocado nessa parte nem sempre é percebido pela conferência.";
export const AVISO_COMPARAR_VALOR =
  "Compare o valor mostrado aqui com o que está impresso na conta. Se for diferente, não pague.";
export const ALERTA_NUMEROS =
  "Os números não conferem — o boleto pode ter sido adulterado ou digitado errado. Confira número por número; se continuar assim, não pague.";

/** { alertas: [...], informacoes: [...], oQueFazer: [...] } para mostrar na tela. */
export function explicar(r) {
  const alertas = [];
  const informacoes = [];
  const oQueFazer = [AVISO_BENEFICIARIO];

  if (r.status === "tamanho-invalido") {
    alertas.push(
      `A linha tem ${r.digitos.length} números. Um boleto tem 47 números (cobrança) ou 48 (contas de consumo e tributos, começando com 8). Confira se copiou a linha inteira.`,
    );
    return { alertas, informacoes, oQueFazer };
  }

  if (!r.numerosOk) alertas.push(ALERTA_NUMEROS);

  if (r.tipo === "cobranca") {
    if (r.banco.nome) informacoes.push(`Banco: ${r.banco.codigo} — ${r.banco.nome}`);
    else
      alertas.push(
        `O código de banco ${r.banco.codigo} não está na lista oficial do Banco Central. Não pague antes de confirmar com a empresa.`,
      );
    informacoes.push(r.valorCentavos ? `Valor: ${reais(r.valorCentavos)}` : "Valor: não vem na linha (você digita na hora de pagar).");
    if (r.vencimento) {
      informacoes.push(
        `Vencimento provável: ${formatarData(r.vencimento.provavel)}. É uma estimativa: o mesmo número também corresponde a ${formatarData(r.vencimento.outra)}. Compare com a data impressa no boleto.`,
      );
    } else {
      informacoes.push("Vencimento: não foi possível ler a data na linha.");
    }
  } else {
    informacoes.push("Tipo: conta de consumo, tributo ou convênio (começa com 8).");
    if (r.segmento) informacoes.push(`Segmento: ${r.segmento}`);
    if (r.valorCentavos) informacoes.push(`Valor: ${reais(r.valorCentavos)}`);
    else if (r.valorEmReferencia) informacoes.push("Valor: a linha traz uma referência, não o valor em reais.");
  }

  oQueFazer.push(r.tipo === "cobranca" ? AVISO_COMPARAR : AVISO_COMPARAR_VALOR, AVISO_LINHA_VALIDA);
  return { alertas, informacoes, oQueFazer };
}

export { reais as formatarValor };
