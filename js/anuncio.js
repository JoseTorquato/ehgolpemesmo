// Conferir o TEXTO de um anúncio ou oferta (Black Friday), 100% no aparelho.
// Usa o mesmo motor das mensagens (js/motor.js), com sinais e regras próprios.
//
// Base (pesquisa-black-friday.md): CERT.br e NIC.br (oferta muito vantajosa,
// pressa), Procon de Vitória da Conquista ("só Pix ou boleto com descontos
// extras"), Serasa Experian (anúncios e perfis falsos, a maior parte das
// ameaças na semana da Black Friday de 2025). Desconto no Pix, sozinho, é
// comum em loja de verdade (CERT.br) e não é sinal.

import { analisar, normalizar, validar } from "./motor.js";
import { analisarComLink, conferirEndereco, extrairEnderecos, FAZER_LINK } from "./link.js";
import { LOJAS } from "./dados/lojas.js";

export const SINAIS_ANUNCIO = {
  "preco-bom-demais": {
    nome: "Preço bom demais",
    padroes: [
      "(?<!\\bate )\\b([6-9]\\d)% ?(off|de desconto|desconto|mais barato)\\b",
      "\\b(desconto|off) de ([6-9]\\d)%",
      "\\b(preco de custo|abaixo do custo|queima total|liquidacao total)\\b",
      "\\b(de graca|quase de graca|gratis) (so|apenas|e so) (pagar|paga) o frete\\b",
    ],
  },
  "so-pix": {
    nome: "Só aceita Pix",
    padroes: [
      "\\b(so|somente|apenas|exclusiv\\w*) (no|pelo|via|para|por|em) pix\\b",
      "\\bpagamento (so|somente|apenas|exclusiv\\w*) (no |pelo |via |por |em )?pix\\b",
      "\\b(aceito|aceitamos|aceita) (so|somente|apenas) pix\\b",
      "\\b(so|somente|apenas) (aceito|aceitamos|aceita|recebo|recebemos) (no |via |por )?pix\\b",
      "\\bnao (aceito|aceitamos|aceita|trabalhamos com) cartao\\b",
    ],
  },
  "urgencia-oferta": {
    nome: "Pressa",
    padroes: [
      "\\bso hoje\\b",
      "\\bultimas horas\\b",
      "\\b(acaba|termina|encerra)\\w* (hoje|amanha|em \\d|a meia-?noite)",
      "\\bpor tempo limitado\\b",
      "\\bcontagem regressiva\\b",
      "\\b(nos proximos|so mais|apenas) \\d+ minutos\\b",
      "\\bultima chance\\b",
      "\\bultimo dia\\b",
      // prazo curto em minutos ou horas
      "\\b(em|nas proximas|nos proximos|so por|apenas|durante|valid[oa] por|so mais|por mais) \\d+ ?(minutos|min|horas|hs|h)\\b",
      "\\bcorr(e|am)\\b(?:[^.!?]){0,15}\\b(antes|que acaba|que vai acabar)\\b",
    ],
  },
  "ultimas-unidades": {
    nome: "Últimas unidades",
    padroes: [
      "\\bultimas (unidades|pecas)\\b",
      "\\b(restam|resta|sobraram|apenas|so|ultimas) \\d+ (unidades|unidade|pecas|peca)\\b",
      "\\bestoque (limitado|acabando)\\b",
      "\\bpoucas unidades\\b",
      // escassez com número: "restam 3", "só 2 em estoque", "últimas 5"
      "\\b(restam|resta|sobraram|sobrou) (so |apenas )?\\d+\\b",
      "\\b(so|apenas) \\d+ (em estoque|no estoque|disponiveis|disponivel)\\b",
      "\\bultim[oa]s \\d+\\b(?! ?(horas?|hs?|minutos?|min|dias?|semanas?)\\b)",
    ],
  },
  "perfil-novo": {
    nome: "Perfil ou página nova",
    padroes: [
      "\\b(perfil|conta|pagina|insta|instagram|loja) nov[oa]\\b",
      "\\bnov[oa] (perfil|conta|pagina|insta|instagram)\\b",
      "\\b(perdemos|perdi) (a|o|nossa|nosso|minha|meu) (conta|perfil|pagina|insta|instagram)\\b",
      "\\b(conta|perfil|pagina|insta|instagram) (antig[oa] |oficial )?(foi )?(hackead|bloquead|derrubad|desativad|clonad)\\w*",
      // "criado há 2 semanas", "loja aberta há 10 dias"
      "\\b(criad[oa]|abert[oa]|comecamos|comecou|inaugurad[oa]) ha (so |apenas )?\\d+ (dias?|semanas?)\\b",
    ],
  },
  "link-fora": {
    nome: "Compra fora da loja",
    padroes: [
      "\\b(chama|chame|chamar|compre|comprar|pedido|pedidos|fale|falar|finalize|finalizar)\\w* (no|pelo|via|na|pela) (whatsapp|zap|direct|dm|inbox|privado|conversa)\\b",
      "\\blink na bio\\b",
      "\\bwa\\.me\\/",
    ],
  },
  "pagamento-antecipado": {
    nome: "Pagamento antecipado para reservar",
    padroes: [
      "\\b(pagamento|pix|deposito|sinal|transferencia) (antecipad|adiantad)\\w*",
      "\\b(antecipad|adiantad)\\w* (via|no|pelo|por|em) pix\\b",
      "\\b(pague|pagar|paga|faca o pix|faz o pix|mande o pix|pix|sinal|deposito)\\b(?:[^.!?]){0,25}\\b(para|pra) (reservar|garantir|segurar)\\b",
    ],
  },
  // sinal posto só por código: o link do anúncio imita o endereço de uma loja
  "link-imita": {
    nome: "Link imita loja conhecida",
    padroes: ["(?!)"],
  },
};

const FAMILIA = "anuncio";

const FAZER_ANUNCIO = [
  "Não compre pelo link do anúncio. Abra o aplicativo da loja ou digite o endereço que você já conhece e procure o produto lá.",
  "Compare o preço com o da mesma coisa no site da loja.",
  FAZER_LINK.find((p) => p.includes("CNPJ")), // o mesmo passo do link, para não repetir
];

export const REGRAS_ANUNCIO = [
  {
    id: "anuncio-link-imita",
    golpe: "Loja falsa",
    familia: FAMILIA,
    nivel: "forte",
    quando: [["link-imita"]],
    peso: 5,
    alerta: "O link do anúncio imita o endereço de uma loja conhecida.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-falso",
    golpe: "Anúncio falso",
    familia: FAMILIA,
    nivel: "forte",
    quando: [
      ["preco-bom-demais", "so-pix"],
      ["preco-bom-demais", "perfil-novo"],
      ["preco-bom-demais", "link-fora"],
      ["perfil-novo", "so-pix"],
      ["perfil-novo", "link-fora"],
      ["so-pix", "link-fora"],
      ["preco-bom-demais", "urgencia-oferta"],
      ["preco-bom-demais", "ultimas-unidades"],
      ["pagamento-antecipado", "urgencia-oferta"],
      ["pagamento-antecipado", "so-pix"],
      ["pagamento-antecipado", "preco-bom-demais"],
      ["pagamento-antecipado", "perfil-novo"],
      ["pagamento-antecipado", "link-fora"],
    ],
    peso: 4,
    alerta:
      "O anúncio junta mais de um sinal do golpe do anúncio falso: preço bom demais, perfil novo, pagamento só no Pix ou adiantado, ou compra fora da loja.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-preco",
    golpe: "Preço bom demais",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["preco-bom-demais"]],
    peso: 3,
    alerta: "O preço parece bom demais. Compare com o preço da mesma coisa no site da loja.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-so-pix",
    golpe: "Só Pix",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["so-pix"]],
    peso: 3,
    alerta: "Aceita só Pix. Desconto no Pix é comum, mas aceitar só Pix, numa loja que você não conhece, é sinal de alerta.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-perfil-novo",
    golpe: "Perfil novo",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["perfil-novo"]],
    peso: 3,
    alerta: "Diz que é um perfil ou página nova, ou que perdeu a conta antiga. Golpistas criam perfis novos o tempo todo.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-link-fora",
    golpe: "Compra fora da loja",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["link-fora"]],
    peso: 2,
    alerta: "O anúncio leva a compra para fora do site ou do aplicativo da loja (outro link, WhatsApp ou mensagem privada).",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-antecipado",
    golpe: "Pagamento antecipado",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["pagamento-antecipado"]],
    peso: 3,
    alerta: "Pede para pagar antes, para \"reservar\" ou \"garantir\". Loja de verdade cobra na hora da compra, dentro do site ou do aplicativo.",
    oQueFazer: FAZER_ANUNCIO,
  },
  {
    id: "anuncio-pressa",
    golpe: "Pressa",
    familia: FAMILIA,
    nivel: "atencao",
    quando: [["urgencia-oferta", "ultimas-unidades"]],
    peso: 1,
    alerta: "Pressa e \"últimas unidades\" servem para você não parar para pensar. Calma: confira antes de pagar.",
    oQueFazer: FAZER_ANUNCIO,
  },
];

const BASE = validar(SINAIS_ANUNCIO, REGRAS_ANUNCIO);

/** "1.299,90" → 1299.9 */
function numero(txt) {
  return Number(txt.replace(/\./g, "").replace(",", "."));
}

/** "de R$ 3.000 por R$ 900": o preço novo é 40% ou menos do antigo? */
export function precoCaiDemais(textoNormalizado) {
  const re = /\bde (?:r\$ ?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\b(?:[^.!?\d]){0,12}?\bpor (?:apenas |so )?(?:r\$ ?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\b/g;
  for (const m of textoNormalizado.matchAll(re)) {
    const [de, por] = [numero(m[1]), numero(m[2])];
    if (de > 0 && por > 0 && por < de && por / de <= 0.4) return true;
  }
  return false;
}

// Produto caro anunciado por até R$ 1.000, sem o "de X por Y". Lista curta e
// conservadora (heurística nossa, sem fonte de preço): só o que, novo, custa
// bem mais do que isso.
const PRODUTO_CARO =
  /\b(iphone 1[1-9]|iphone (pro|max)|macbook|playstation 5|ps5|xbox series|(smart )?tv (de )?(5[0-9]|[6-9][0-9]) ?("|pol)|geladeira (frost free|side by side|inverse))/;

/** "iPhone 15 por R$ 899": produto caro a preço muito baixo. */
export function precoAbsurdo(textoNormalizado) {
  if (!PRODUTO_CARO.test(textoNormalizado)) return false;
  for (const m of textoNormalizado.matchAll(/\br\$ ?(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?(?![\d.,]*\d)/g)) {
    if (/\d ?x (de )?$/.test(textoNormalizado.slice(0, m.index))) continue; // parcela
    const valor = numero(m[1]);
    if (valor > 0 && valor <= 1000) return true;
  }
  return false;
}

/** Links do anúncio: algum imita loja, ou leva para fora da loja citada? */
function sinaisDosLinks(texto, textoNormalizado) {
  const extras = new Set();
  const marcasCitadas = LOJAS.filter((l) => l.nomes.some((n) => !l.nomeComum && textoNormalizado.replace(/\s/g, "").includes(n)));
  for (const endereco of extrairEnderecos(texto)) {
    // só o que parece mesmo endereço (não "loja.Compre", por exemplo)
    if (!/[/:@]|www\.|\.(com|br|net|org|shop|store|online|site|xyz|top|ly|gd|co|to|io|app)\b/i.test(endereco)) continue;
    const r = conferirEndereco(endereco);
    if (r.status !== "lido") continue;
    if (r.alertas.some((a) => ["parecido", "marca-subdominio", "arroba"].includes(a.id))) extras.add("link-imita");
    else if (r.alertas.length) extras.add("link-fora");
    else if (marcasCitadas.length && !marcasCitadas.some((l) => l.dominios.includes(r.registravel))) extras.add("link-fora");
  }
  return extras;
}

/** Confere o texto do anúncio. Mesmo formato de analisar() em js/motor.js. */
export function conferirAnuncio(texto) {
  const t = normalizar(texto);
  const extras = sinaisDosLinks(String(texto ?? ""), t);
  if (precoCaiDemais(t) || precoAbsurdo(t)) extras.add("preco-bom-demais");
  return analisar(texto, BASE, [...extras]);
}

/**
 * Campo de MENSAGEM: regras da mensagem, sinais dos links e regras de
 * anúncio, juntos. Um anúncio colado ali não pode ficar sem as regras dele.
 */
export function analisarMensagem(texto, base) {
  const r = analisarComLink(texto, base, analisar);
  const a = conferirAnuncio(texto);
  if (a.nivel === "nenhum") return r;
  // conversa de família ("me manda o pix pra reservar a mesa") não é anúncio:
  // sinal fraco de anúncio só conta se o texto tem cara de oferta
  // venda de particular também conta ("vendo", "à venda", "seminovo"…)
  const pareceOferta =
    /\br\$ ?\d|\d ?% ?(off|de desconto)|\b(promo\w*|oferta|desconto|black friday|vendo|vende-se|vendemos|a venda|seminov[oa]|lacrad[oa]|frete|estoque|anuncio)\b/.test(
      normalizar(texto),
    );
  const doAnuncio = a.encontrados.filter((e) => e.nivel === "forte" || pareceOferta);
  if (!doAnuncio.length) return r;
  const encontrados = [...r.encontrados];
  for (const e of doAnuncio) if (!encontrados.some((x) => x.alerta === e.alerta)) encontrados.push(e);
  encontrados.sort((x, y) => (x.nivel === y.nivel ? y.peso - x.peso : x.nivel === "forte" ? -1 : 1));
  const oQueFazer = [...r.oQueFazer];
  for (const p of doAnuncio.length ? a.oQueFazer : []) if (!oQueFazer.includes(p)) oQueFazer.push(p);
  const nivel = encontrados.some((e) => e.nivel === "forte") ? "forte" : "atencao";
  return { ...r, nivel, encontrados, oQueFazer, sinais: [...new Set([...r.sinais, ...a.sinais])].sort() };
}
