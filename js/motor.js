// Motor de regras. Não conhece nenhum golpe: só lê os dados de js/regras.js
// (sinais e regras) e procura os sinais no texto colado. Tudo roda no aparelho.
//
// SINAIS — pedaços de texto que, sozinhos, não provam nada:
//   "numero-novo": {
//     nome: "Diz que trocou de número",
//     padroes: ["\\btroquei de numero\\b", ...],  // expressões regulares, sem
//                                                  // acento e em minúsculas: o
//                                                  // texto colado é normalizado igual
//     exceto: ["\\bnunca informe\\b"],             // opcional: se casar, o sinal
//   }                                              // não conta
//
// REGRAS — combinações de sinais que formam um golpe:
//   {
//     id: "falso-parente-numero-novo",
//     golpe: "Falso parente",           // nome mostrado no nível forte
//     familia: "falso-parente",         // opcional: agrupa regras do mesmo assunto
//     nivel: "forte" | "atencao",
//     quando: [["numero-novo", "pedido-dinheiro"], ...], // basta UMA combinação
//                                                         // com TODOS os sinais dela
//     exceto: ["contexto-banco"],                         // opcional: a regra não vale
//                                                         // se algum destes sinais aparecer
//     peso: 1 a 5,                                         // ordena os alertas
//     alerta: "texto do sinal de alerta",
//     oQueFazer: ["passo 1", ...],
//   }
//
// Quando uma família tem alerta forte, os alertas de "atenção" da mesma
// família não aparecem (seriam repetição). Sem "familia", vale o "golpe".

export const PESO_MINIMO = 1;
export const PESO_MAXIMO = 5;
export const NIVEIS = ["forte", "atencao"];

/** Minúsculas, sem acento e com espaços simples: é assim que os padrões são escritos. */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function confereExpressao(onde, padrao) {
  if (typeof padrao !== "string" || !padrao)
    throw new Error(`${onde}: padrão vazio`);
  if (padrao !== normalizar(padrao))
    throw new Error(`${onde}: escreva o padrão "${padrao}" sem acento e em minúsculas`);
  try {
    new RegExp(padrao);
  } catch {
    throw new Error(`${onde}: o padrão "${padrao}" não é uma expressão válida`);
  }
}

/** Confere sinais e regras. Lança um erro dizendo onde está o problema. */
export function validar(sinais, regras) {
  if (!sinais || typeof sinais !== "object" || Array.isArray(sinais))
    throw new Error("os sinais precisam ser um objeto id → sinal");
  for (const [id, s] of Object.entries(sinais)) {
    const onde = `sinal ${id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new Error(`${onde}: id precisa ser minúsculas e hífens`);
    if (typeof s?.nome !== "string" || !s.nome.trim()) throw new Error(`${onde}: falta o nome`);
    if (!Array.isArray(s.padroes) || s.padroes.length === 0)
      throw new Error(`${onde}: precisa de pelo menos um padrão`);
    for (const p of s.padroes) confereExpressao(onde, p);
    for (const p of s.exceto ?? []) confereExpressao(`${onde} (exceto)`, p);
  }

  if (!Array.isArray(regras)) throw new Error("as regras precisam ser uma lista");
  const ids = new Set();
  for (const [i, r] of regras.entries()) {
    const onde = `regra ${i} (${r?.id ?? "sem id"})`;
    if (!r || typeof r !== "object") throw new Error(`${onde}: não é um objeto`);
    if (typeof r.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id))
      throw new Error(`${onde}: id precisa ser minúsculas e hífens`);
    if (ids.has(r.id)) throw new Error(`${onde}: id repetido`);
    ids.add(r.id);
    for (const campo of ["golpe", "alerta"])
      if (typeof r[campo] !== "string" || !r[campo].trim())
        throw new Error(`${onde}: falta o texto "${campo}"`);
    if (r.familia !== undefined && (typeof r.familia !== "string" || !r.familia.trim()))
      throw new Error(`${onde}: familia precisa ser um texto`);
    if (!NIVEIS.includes(r.nivel)) throw new Error(`${onde}: nivel precisa ser ${NIVEIS.join(" ou ")}`);
    if (!Array.isArray(r.quando) || r.quando.length === 0)
      throw new Error(`${onde}: precisa de pelo menos uma combinação em "quando"`);
    for (const combinacao of r.quando) {
      if (!Array.isArray(combinacao) || combinacao.length === 0)
        throw new Error(`${onde}: combinação vazia em "quando"`);
      for (const sinal of combinacao)
        if (!(sinal in sinais)) throw new Error(`${onde}: sinal desconhecido "${sinal}"`);
    }
    if (r.exceto !== undefined) {
      if (!Array.isArray(r.exceto)) throw new Error(`${onde}: "exceto" precisa ser uma lista de sinais`);
      for (const sinal of r.exceto)
        if (!(sinal in sinais)) throw new Error(`${onde}: sinal desconhecido "${sinal}" em "exceto"`);
    }
    if (!Number.isInteger(r.peso) || r.peso < PESO_MINIMO || r.peso > PESO_MAXIMO)
      throw new Error(`${onde}: peso precisa ser inteiro de ${PESO_MINIMO} a ${PESO_MAXIMO}`);
    if (!Array.isArray(r.oQueFazer) || r.oQueFazer.length === 0)
      throw new Error(`${onde}: precisa de pelo menos um passo em "oQueFazer"`);
    for (const passo of r.oQueFazer)
      if (typeof passo !== "string" || !passo.trim())
        throw new Error(`${onde}: passo vazio em "oQueFazer"`);
  }
  return { sinais, regras };
}

/** Ids dos sinais presentes no texto (já normalizado). */
export function sinaisPresentes(textoNormalizado, sinais) {
  const presentes = new Set();
  for (const [id, s] of Object.entries(sinais)) {
    if ((s.exceto ?? []).some((p) => new RegExp(p).test(textoNormalizado))) continue;
    if (s.padroes.some((p) => new RegExp(p).test(textoNormalizado))) presentes.add(id);
  }
  return presentes;
}

/**
 * Procura os golpes no texto.
 * Devolve { nivel: "forte" | "atencao" | "nenhum", encontrados: [{id, golpe,
 * nivel, alerta, peso}], oQueFazer: [...], sinais: [ids] }.
 * "nenhum" quer dizer "nenhum sinal encontrado", nunca "tudo certo".
 * `extras`: ids de sinais achados por código, fora das expressões (ex.: a
 * conta "de R$ X por R$ Y" do anúncio). Precisam existir em `sinais`.
 */
export function analisar(texto, { sinais, regras }, extras = []) {
  const t = normalizar(texto);
  const vazio = { nivel: "nenhum", encontrados: [], oQueFazer: [], sinais: [] };
  if (!t) return vazio;
  const presentes = sinaisPresentes(t, sinais);
  for (const id of extras) {
    if (!(id in sinais)) throw new Error(`sinal desconhecido "${id}" em extras`);
    presentes.add(id);
  }
  let achados = regras.filter(
    (r) =>
      r.quando.some((comb) => comb.every((s) => presentes.has(s))) &&
      !(r.exceto ?? []).some((s) => presentes.has(s)),
  );

  const familia = (r) => r.familia ?? r.golpe;
  const familiasFortes = new Set(achados.filter((r) => r.nivel === "forte").map(familia));
  achados = achados.filter((r) => r.nivel === "forte" || !familiasFortes.has(familia(r)));

  const ordemNivel = (r) => (r.nivel === "forte" ? 0 : 1);
  achados.sort((a, b) => ordemNivel(a) - ordemNivel(b) || b.peso - a.peso || a.id.localeCompare(b.id));

  const oQueFazer = [];
  for (const r of achados) for (const passo of r.oQueFazer) if (!oQueFazer.includes(passo)) oQueFazer.push(passo);

  return {
    nivel: achados.length === 0 ? "nenhum" : ordemNivel(achados[0]) === 0 ? "forte" : "atencao",
    encontrados: achados.map(({ id, golpe, nivel, alerta, peso }) => ({ id, golpe, nivel, alerta, peso })),
    oQueFazer,
    sinais: [...presentes].sort(),
  };
}
