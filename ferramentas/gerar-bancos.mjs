// Gera js/dados/bancos.js a partir da lista oficial do Banco Central.
//
//   node ferramentas/gerar-bancos.mjs
//
// Fonte: BCB, "Participantes do STR" (ParticipantesSTR.csv),
//   https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv
// O arquivo fica em dados/ParticipantesSTR.csv, como foi baixado. Para
// atualizar: baixe de novo, troque o arquivo, ajuste BAIXADO_EM e rode este
// script. O site nunca baixa nada sozinho.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BAIXADO_EM = "24/11/2026";
const FONTE = "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const csv = readFileSync(`${raiz}dados/ParticipantesSTR.csv`, "utf8").replace(/^﻿/, "");

function linhasCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some((x) => x !== "")) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const [cabecalho, ...dados] = linhasCsv(csv);
const col = (nome) => {
  const i = cabecalho.indexOf(nome);
  if (i < 0) throw new Error(`coluna ${nome} não encontrada: ${cabecalho}`);
  return i;
};
const iCodigo = col("Número_Código");
const iExtenso = col("Nome_Extenso");
const iReduzido = col("Nome_Reduzido");

const bancos = {};
let semCodigo = 0;
for (const l of dados) {
  const codigo = (l[iCodigo] || "").trim();
  if (!/^\d{3}$/.test(codigo)) { semCodigo++; continue; }
  if (bancos[codigo]) throw new Error(`código repetido na lista: ${codigo}`);
  bancos[codigo] = (l[iExtenso] || l[iReduzido]).trim();
}

const ordenados = Object.fromEntries(Object.entries(bancos).sort(([a], [b]) => a.localeCompare(b)));
const saida = `// GERADO por ferramentas/gerar-bancos.mjs — não edite à mão.
// Fonte: Banco Central do Brasil, Participantes do STR (${FONTE}),
// baixado em ${BAIXADO_EM}. ${Object.keys(ordenados).length} instituições com código; ${semCodigo} sem código ficaram de fora.

export const FONTE_BANCOS = ${JSON.stringify({ nome: "Banco Central do Brasil — Participantes do STR", url: FONTE, baixadoEm: BAIXADO_EM })};

export const BANCOS = ${JSON.stringify(ordenados, null, 1)};
`;
writeFileSync(`${raiz}js/dados/bancos.js`, saida, "utf8");
console.log(`${Object.keys(ordenados).length} códigos, ${semCodigo} linhas sem código`);
