// Conferir um link (endereço de site), 100% no aparelho: nada é aberto,
// buscado nem enviado. Só compara o texto do endereço com listas embarcadas
// (js/dados/lojas.js). Não diz nunca que um site é de confiança: no máximo,
// que não encontrou sinais.

import { CONFERIDO_EM, ENCURTADORES, LOJAS, SUFIXOS_DUPLOS, TERMINACOES_INCOMUNS } from "./dados/lojas.js";

// Palavras que golpistas juntam ao nome da loja (magalu-ofertas, americanasblack…)
const PALAVRAS_EXTRA = [
  "oficial", "oficiais", "promo", "promocao", "promocoes", "black", "friday", "blackfriday",
  "outlet", "desconto", "descontos", "loja", "lojas", "oferta", "ofertas", "br", "brasil",
  "store", "shop", "online", "site", "app", "vendas", "liquida", "liquidacao", "saldao",
  "cupom", "cupons", "premio", "premios", "sale", "off", "www", "pay", "pagamento", "pedido",
  "rastreio", "entrega", "frete", "seguro", "secure", "login", "conta", "cliente", "clientes",
];

// palavras que fingem "loja oficial" quando vêm grudadas num nome fora da lista
const PALAVRAS_ISCA = ["oficial", "outlet", "blackfriday", "queima", "liquida", "saldao"];

// letras de outros alfabetos que parecem latinas (as mais usadas para imitar)
const PARECIDAS = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j",
  "ѕ": "s", "ԁ": "d", "ɡ": "g", "һ": "h", "ӏ": "l", "ո": "n", "ս": "u", "ν": "v", "ο": "o",
  "α": "a", "ρ": "p", "κ": "k", "τ": "t", "ı": "i",
};

export const TEXTOS_LINK = {
  parecido: (m, oficial) =>
    `O endereço imita o da loja ${m}, mas não é um dos endereços da loja que conferimos (${oficial}). Golpistas copiam o nome da loja trocando, tirando ou juntando letras e palavras.`,
  subdominio: (m, reg) =>
    `O nome ${m} aparece no começo, mas o site de verdade é ${reg}. O que vale é o final do endereço, logo antes da primeira barra.`,
  outraTerminacao: (m, oficial) =>
    `Tem o nome ${m}, mas termina diferente do endereço da loja que conferimos (${oficial}).`,
  punycode: "O endereço tem letras especiais ou de outro alfabeto, que podem imitar letras comuns.",
  encurtador: "É um link encurtado: não dá para ver para onde ele leva.",
  terminacao: (tld) =>
    `O endereço termina em .${tld}, terminação pouco comum para loja brasileira. Há lojas de verdade assim: sozinho, isso não quer dizer golpe.`,
  arroba: (host) =>
    `O endereço tem um @. O site de verdade é o que vem depois dele: ${host}. O que vem antes do @ é só para enganar.`,
  ip: "O endereço é só um número (IP), sem nome de site. Loja de verdade não manda link assim.",
  isca: (palavra) =>
    `O endereço tem a palavra "${palavra}" grudada no nome. Golpistas usam palavras assim para parecer loja oficial.`,
  daLista: (m, reg) => `O endereço termina em ${reg}, que está na nossa lista de endereços da loja ${m} (conferida em ${CONFERIDO_EM}).`,
};

export const SEM_SINAL_LINK =
  "Não encontramos sinais de alerta, mas isso não garante nada — entre pelo app ou digitando o endereço da loja.";

export const FAZER_LINK = [
  "Não clique. Entre pelo aplicativo da loja ou digite você mesmo o endereço que já conhece.",
  "Confira o endereço letra por letra.",
  "O cadeado no navegador não prova nada sobre a loja: site de golpe também tem cadeado.",
  "Na hora de pagar, confira se o nome e o CNPJ de quem recebe são os da loja. Se não forem, não pague.",
];

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Distância de Damerau-Levenshtein (troca, falta, sobra ou inversão de letras). */
export function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Decodifica um rótulo "xn--…" (Punycode, RFC 3492). Devolve null se for inválido. */
export function decodificarPunycode(rotulo) {
  if (!rotulo.startsWith("xn--")) return rotulo;
  const entrada = rotulo.slice(4);
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  let n = 128, i = 0, bias = 72;
  const fim = entrada.lastIndexOf("-");
  const saida = fim > 0 ? [...entrada.slice(0, fim)] : [];
  const digito = (c) => {
    const k = c.charCodeAt(0);
    if (k >= 48 && k <= 57) return k - 22;
    if (k >= 97 && k <= 122) return k - 97;
    return -1;
  };
  const adaptar = (delta, total, primeira) => {
    delta = primeira ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / total);
    let k = 0;
    while (delta > ((base - tMin) * tMax) >> 1) {
      delta = Math.floor(delta / (base - tMin));
      k += base;
    }
    return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
  };
  for (let p = fim > 0 ? fim + 1 : 0; p < entrada.length; ) {
    const antigo = i;
    for (let w = 1, k = base; ; k += base) {
      if (p >= entrada.length) return null;
      const dg = digito(entrada[p++]);
      if (dg < 0) return null;
      i += dg * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (dg < t) break;
      w *= base - t;
    }
    bias = adaptar(i - antigo, saida.length + 1, antigo === 0);
    n += Math.floor(i / (saida.length + 1));
    i %= saida.length + 1;
    saida.splice(i++, 0, String.fromCodePoint(n));
  }
  return saida.join("");
}

/** Troca letras parecidas de outros alfabetos e tira acentos: "аmazon" → "amazon". */
export function simplificar(texto) {
  return semAcento([...texto.toLowerCase()].map((c) => PARECIDAS[c] ?? c).join(""));
}

// terminações que, no fim da parte antes do "@", mostram que ela imita um site
// (e não é o nome de um e-mail, como "joao.silva@...")
const PARECE_SITE = /(^|\.)(com|br|net|org|gov|shop|store|online|site|app|io|co|info|biz|xyz|top)$/i;

/**
 * Lê o endereço como o navegador lê (new URL): o site é o que vem depois de
 * um "@" que esteja antes da primeira barra. Devolve {host, usuario} ou null.
 */
export function lerEndereco(trecho) {
  const limpo = String(trecho ?? "").trim().replace(/^[("'«<\[]+/, "").replace(/[)"'»>\].,;:!?]+$/, "");
  if (!limpo) return null;
  const temEsquema = /^https?:[/]{2}/i.test(limpo);
  if (!temEsquema) {
    if (/^(mailto|tel|sms|javascript|data|file|ftp|whatsapp|intent):/i.test(limpo)) return null;
    const antesDaBarra = limpo.split(/[/?#\\]/)[0];
    // javascript:, mailto: e afins (mas "usuario:senha@site" é link)
    if (!antesDaBarra.includes("@") && /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(limpo)) return null;
    // e-mail comum (nome@site) não é link; "loja.com.br@golpe.shop" é
    const email = limpo.match(/^([^@/?#\\\s]+)@[^@/?#\\\s]+$/);
    if (email && !PARECE_SITE.test(email[1]) && !/[:%]|^www\./i.test(email[1])) return null;
  }
  let u;
  try {
    u = new URL(temEsquema ? limpo : `https://${limpo}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  const ehIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (!ehIp && !/\.[\p{L}]{2,}$/u.test(host) && !/\.xn--[a-z0-9-]+$/.test(host)) return null;
  return { host, usuario: Boolean(u.username || u.password), ehIp };
}

/** Todos os endereços de site no texto colado, na ordem. */
export function extrairEnderecos(texto) {
  return String(texto ?? "")
    .split(/\s+/)
    .filter((p) => /[.]/.test(p) && lerEndereco(p))
    .map((p) => p.replace(/^[("'«<\[]+/, "").replace(/[)"'»>\].,;:!?]+$/, ""));
}

/** O primeiro endereço de site no texto colado (ou null). */
export function extrairEndereco(texto) {
  return extrairEnderecos(texto)[0] ?? null;
}

/** Domínio registrável ("loja.com.br" em "ofertas.loja.com.br"). */
export function dominioRegistravel(host) {
  const partes = host.split(".");
  const ultimos2 = partes.slice(-2).join(".");
  const n = SUFIXOS_DUPLOS.includes(ultimos2) ? 3 : 2;
  return partes.slice(-n).join(".");
}

const TODOS_OFICIAIS = new Map(LOJAS.flatMap((l) => l.dominios.map((d) => [d, l])));

function tolerancia(nome) {
  if (nome.length >= 10) return 2;
  if (nome.length >= 7) return 1;
  return 0;
}

/** A palavra imita o nome da loja? "exato" (mesmo nome) ou "parecido". */
function compararNome(palavra, nome) {
  if (!palavra) return null;
  if (palavra === nome) return "exato";
  if (nome.length >= 5 && (palavra.startsWith(nome) || palavra.endsWith(nome))) {
    const resto = palavra.startsWith(nome) ? palavra.slice(nome.length) : palavra.slice(0, -nome.length);
    if (/^\d+$/.test(resto) || PALAVRAS_EXTRA.includes(resto)) return "parecido";
  }
  const tol = tolerancia(nome);
  if (tol && Math.abs(palavra.length - nome.length) <= tol && distancia(palavra, nome) <= tol) return "parecido";
  // nome de 6 letras: só uma letra trocada, sem sobra nem falta
  // ("amazom" sim; "natural" e "amazonas" não, que são palavras comuns)
  if (nome.length === 6 && palavra.length === 6 && distancia(palavra, nome) === 1) return "parecido";
  return null;
}

/** Procura a loja que o rótulo (sem o sufixo) imita. */
function lojaImitada(rotulo) {
  const pedacos = rotulo.split("-").filter(Boolean);
  const semExtras = pedacos.filter((p) => !PALAVRAS_EXTRA.includes(p) && !/^\d+$/.test(p));
  const candidatos = [...new Set([rotulo.replace(/-/g, ""), semExtras.join(""), ...pedacos])];
  // o rótulo é exatamente o nome de uma loja (inclusive outra grafia da mesma
  // empresa, como "mercadolibre"): é a loja com outra terminação, não imitação
  const exata = LOJAS.find((l) => l.nomes.includes(rotulo));
  if (exata) return { loja: exata, tipo: "exato" };
  let melhor = null;
  for (const loja of LOJAS) {
    for (const nome of loja.nomes) {
      // palavra comum ("extra"): só o domínio inteiro, com ou sem palavras de golpe
      const lista = loja.nomeComum ? [rotulo.replace(/-/g, ""), semExtras.join("")] : candidatos;
      for (const c of lista) {
        const r = compararNome(c, nome);
        if (r === "parecido" || (r === "exato" && c !== rotulo)) return { loja, tipo: "parecido" };
        if (r === "exato") melhor = { loja, tipo: "exato" };
      }
    }
  }
  return melhor;
}

/** A marca aparece em algum pedaço do host fora do domínio registrável? */
function marcaNoComeco(host, registravel) {
  const antes = host.slice(0, -registravel.length).replace(/\.$/, "");
  if (!antes) return null;
  const pedacos = antes.split(/[.-]/).filter(Boolean);
  for (const loja of LOJAS) {
    if (loja.nomeComum) continue;
    for (const nome of loja.nomes) {
      if (pedacos.some((p) => p === nome || (nome.length >= 5 && compararNome(p, nome)))) return loja;
    }
  }
  return null;
}

/**
 * Confere o endereço. Devolve:
 *   { status: "vazio" | "sem-endereco" | "lido", host, registravel,
 *     nivel: "forte" | "atencao" | "nenhum", alertas: [{id, nivel, texto}],
 *     informacoes: [texto] }
 */
export function conferirEndereco(texto) {
  if (!String(texto ?? "").trim()) return { status: "vazio" };
  const endereco = extrairEndereco(texto);
  const lido = endereco && lerEndereco(endereco);
  if (!lido) return { status: "sem-endereco" };
  const { host } = lido;

  const alertas = [];
  const informacoes = [];
  const add = (id, nivel, txt) => alertas.push({ id, nivel, texto: txt });

  // "@" antes do site: o que vem antes dele é enfeite, o navegador abre o que vem depois
  if (lido.usuario) add("arroba", "forte", TEXTOS_LINK.arroba(host));
  if (lido.ehIp) {
    add("ip", lido.usuario ? "forte" : "atencao", TEXTOS_LINK.ip);
    const nivel = alertas.some((a) => a.nivel === "forte") ? "forte" : "atencao";
    return { status: "lido", host, registravel: host, nivel, alertas, informacoes };
  }

  const registravel = dominioRegistravel(host);
  const tld = host.split(".").pop();
  const rotulos = registravel.split(".");
  const qtdSufixo = SUFIXOS_DUPLOS.includes(rotulos.slice(-2).join(".")) ? 2 : 1;
  const rotuloPrincipal = rotulos.slice(0, -qtdSufixo).join(".");

  // o navegador já converte letras especiais do endereço para "xn--…"
  const temEspecial = host.split(".").some((r) => r.startsWith("xn--"));
  const decodificado = simplificar(rotuloPrincipal.split(".").map((r) => decodificarPunycode(r) ?? r).join("."));

  const oficial = TODOS_OFICIAIS.get(registravel);
  if (oficial) {
    if (!lido.usuario) informacoes.push(TEXTOS_LINK.daLista(oficial.marca, registravel));
  } else if (ENCURTADORES.includes(registravel) || ENCURTADORES.includes(host)) {
    add("encurtador", "atencao", TEXTOS_LINK.encurtador);
  } else {
    const imitada = lojaImitada(decodificado);
    if (imitada) {
      const doms = imitada.loja.dominios[0];
      const incomum = TERMINACOES_INCOMUNS.includes(tld);
      if (imitada.tipo === "parecido" || temEspecial || incomum) add("parecido", "forte", TEXTOS_LINK.parecido(imitada.loja.marca, doms));
      else add("outra-terminacao", "atencao", TEXTOS_LINK.outraTerminacao(imitada.loja.marca, doms));
    }
    const noComeco = marcaNoComeco(host, registravel);
    if (noComeco && !imitada) add("marca-subdominio", "forte", TEXTOS_LINK.subdominio(noComeco.marca, registravel));
    if (temEspecial) add("punycode", alertas.some((a) => a.nivel === "forte") ? "forte" : "atencao", TEXTOS_LINK.punycode);
    if (TERMINACOES_INCOMUNS.includes(tld)) add("terminacao", "atencao", TEXTOS_LINK.terminacao(tld));
    // marca que não está na lista + "oficial", "outlet"…: isca comum
    const isca = !imitada && !noComeco && PALAVRAS_ISCA.find((p) => decodificado.replace(/-/g, "").includes(p));
    if (isca) add("isca", TERMINACOES_INCOMUNS.includes(tld) ? "forte" : "atencao", TEXTOS_LINK.isca(isca));
  }

  const nivel = alertas.some((a) => a.nivel === "forte") ? "forte" : alertas.length ? "atencao" : "nenhum";
  return { status: "lido", host, registravel, nivel, alertas, informacoes };
}

/**
 * Mensagem com link: as regras da mensagem (js/motor.js) mais os sinais do
 * endereço. Um link de golpe colado sozinho não pode cair em "nenhum sinal"
 * só porque o texto não tem as frases do golpe.
 */
export function analisarComLink(texto, base, analisar) {
  const r = analisar(texto, base);
  const doLink = [];
  for (const endereco of extrairEnderecos(texto)) {
    const l = conferirEndereco(endereco);
    if (l.status !== "lido") continue;
    for (const a of l.alertas) {
      if (doLink.some((d) => d.alerta === a.texto)) continue;
      doLink.push({ id: `link-${a.id}`, golpe: "Link suspeito", nivel: a.nivel, alerta: a.texto, peso: a.nivel === "forte" ? 5 : 2 });
    }
  }
  if (!doLink.length) return r;
  const encontrados = [...r.encontrados, ...doLink].sort((a, b) => (a.nivel === b.nivel ? b.peso - a.peso : a.nivel === "forte" ? -1 : 1));
  const oQueFazer = [...r.oQueFazer];
  for (const p of FAZER_LINK) if (!oQueFazer.includes(p)) oQueFazer.push(p);
  const nivel = encontrados.some((e) => e.nivel === "forte") ? "forte" : "atencao";
  return { ...r, nivel, encontrados, oQueFazer };
}
