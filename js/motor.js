// Motor de regras. Não conhece nenhum golpe: só lê as regras (js/regras.js)
// e procura os sinais delas no texto colado. Tudo roda no aparelho.
//
// Formato de uma regra:
//   {
//     id: "falso-parente-pix",            // único, minúsculas e hífens
//     golpe: "Falso parente pedindo Pix", // nome do golpe, para quem lê
//     sinais: [                            // padrões (expressões regulares)
//       "numero novo",                     //   escritos sem acento e em
//       "pix (agora|urgente)",             //   minúsculas: o texto colado
//     ],                                   //   é normalizado igual
//     minimo: 1,                           // quantos sinais precisam aparecer
//     peso: 3,                             // 1 (fraco) a 5 (forte): ordena
//     alerta: "texto do sinal de alerta",  // o que aparece para a pessoa
//     oQueFazer: ["passo 1", "passo 2"],   // o que fazer agora
//   }

export const PESO_MINIMO = 1;
export const PESO_MAXIMO = 5;

/** Minúsculas, sem acento e com espaços simples: é assim que os padrões são escritos. */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Confere o formato das regras. Lança um erro dizendo qual regra está errada. */
export function validarRegras(regras) {
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
    if (!Array.isArray(r.sinais) || r.sinais.length === 0)
      throw new Error(`${onde}: precisa de pelo menos um sinal`);
    for (const s of r.sinais) {
      if (typeof s !== "string" || !s) throw new Error(`${onde}: sinal vazio`);
      if (s !== normalizar(s))
        throw new Error(`${onde}: escreva o sinal "${s}" sem acento e em minúsculas`);
      try {
        new RegExp(s);
      } catch {
        throw new Error(`${onde}: o sinal "${s}" não é uma expressão válida`);
      }
    }
    const minimo = r.minimo ?? 1;
    if (!Number.isInteger(minimo) || minimo < 1 || minimo > r.sinais.length)
      throw new Error(`${onde}: "minimo" precisa estar entre 1 e o número de sinais`);
    if (!Number.isInteger(r.peso) || r.peso < PESO_MINIMO || r.peso > PESO_MAXIMO)
      throw new Error(`${onde}: peso precisa ser inteiro de ${PESO_MINIMO} a ${PESO_MAXIMO}`);
    if (!Array.isArray(r.oQueFazer) || r.oQueFazer.length === 0)
      throw new Error(`${onde}: precisa de pelo menos um passo em "oQueFazer"`);
    for (const passo of r.oQueFazer)
      if (typeof passo !== "string" || !passo.trim())
        throw new Error(`${onde}: passo vazio em "oQueFazer"`);
  }
  return regras;
}

/**
 * Procura os sinais das regras no texto.
 * Devolve { encontrados: [{id, golpe, alerta, peso}], oQueFazer: [...] },
 * do sinal mais forte para o mais fraco, sem passos repetidos.
 * Lista vazia quer dizer "nenhum sinal encontrado", nunca "tudo certo".
 */
export function analisar(texto, regras) {
  const t = normalizar(texto);
  if (!t) return { encontrados: [], oQueFazer: [] };
  const encontrados = [];
  for (const r of regras) {
    const batidos = r.sinais.filter((s) => new RegExp(s).test(t)).length;
    if (batidos >= (r.minimo ?? 1)) {
      encontrados.push({ id: r.id, golpe: r.golpe, alerta: r.alerta, peso: r.peso, oQueFazer: r.oQueFazer });
    }
  }
  encontrados.sort((a, b) => b.peso - a.peso || a.id.localeCompare(b.id));
  const oQueFazer = [];
  for (const e of encontrados)
    for (const passo of e.oQueFazer) if (!oQueFazer.includes(passo)) oQueFazer.push(passo);
  return {
    encontrados: encontrados.map(({ oQueFazer: _, ...resto }) => resto),
    oQueFazer,
  };
}
