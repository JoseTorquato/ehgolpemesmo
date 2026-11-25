// Catálogo de golpes (golpes.html): estrutura fixa dos cards, fonte em cada
// card e número só com fonte e data no próprio card.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./arquivos.mjs";

const pagina = readFileSync(join(RAIZ, "golpes.html"), "utf8");
const index = readFileSync(join(RAIZ, "index.html"), "utf8");
const cards = pagina.split('<section class="card').slice(1).map((s) => s.split("</section>")[0]);
const golpes = cards.filter((c) => !c.startsWith(" dica"));
const dicas = cards.filter((c) => c.startsWith(" dica"));
const semTags = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const GOLPES = [
  "falso-parente", "whatsapp-clonado", "falsa-central", "pix-errado", "mao-fantasma",
  "falso-emprego", "falsa-entrega", "loja-falsa", "anuncio-falso", "golpe-do-amor", "falso-aluguel",
];

test("os 11 golpes, na ordem, cada um com como funciona / sinais / o que fazer e fonte", () => {
  assert.deepEqual(golpes.map((c) => c.match(/<h2 id="([a-z-]+)">/)[1]), GOLPES);
  for (const c of golpes) {
    const id = c.match(/<h2 id="([a-z-]+)">/)[1];
    assert.deepEqual([...c.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]), ["Como funciona", "Sinais", "O que fazer"], id);
    assert.match(c, /<ul>\s*<li>/, `${id}: lista de sinais`);
    assert.match(c, /<ol>\s*<li>/, `${id}: passos`);
    assert.match(c, /<p class="fonte">Fontes?: [^<]*<a href="https:\/\//, `${id}: fonte com link`);
  }
  // o índice aponta para todos
  for (const id of [...GOLPES, "dicas"]) assert.match(pagina, new RegExp(`<a href="#${id}">`), id);
});

test("as 4 dicas para a família, cada uma com fonte", () => {
  assert.match(pagina, /<h2 id="dicas"[^>]*>Dicas para a família<\/h2>/);
  const titulos = dicas.map((d) => d.match(/<h3 id="[a-z-]+">([^<]+)<\/h3>/)[1]);
  assert.deepEqual(titulos, [
    "1. Combinem uma palavra-secreta",
    "2. Ligue no número antigo",
    "3. Nunca passe o código do SMS",
    "4. Limite de Pix à noite",
  ]);
  for (const d of dicas) assert.match(d, /<p class="fonte">Fontes?: /);
});

// Números que podem aparecer no texto dos cards (fora da linha de fonte).
// Cada um foi conferido na pesquisa-catalogo.md (marcado C).
const NUMEROS_CONFERIDOS = new Set([
  "73 mil", "139 mil", "195,7%", "174 mil", "604", "147%", "625", "R$ 1.000",
  "20h", "6h", "24 a 48 horas", "6 números", "1º semestre de 2025", "2º golpe",
  "23 a 29/11/2025", "11/11/2025", "0 no lugar de o", "regra de 2021",
]);

test("todo número do texto é conferido, e o card dele mostra a fonte com data", () => {
  for (const c of cards) {
    const corpo = semTags(c.replace(/<p class="fonte">[\s\S]*?<\/p>/g, "").replace(/<h3[^>]*>[\s\S]*?<\/h3>/g, ""));
    let resto = corpo;
    for (const n of [...NUMEROS_CONFERIDOS].sort((a, b) => b.length - a.length)) resto = resto.split(n).join(" ");
    assert.doesNotMatch(resto, /\d/, `número sem conferência: ${resto.match(/.{0,30}\d.{0,30}/)?.[0]}`);
    if (/\d/.test(corpo)) {
      const fonte = c.match(/<p class="fonte">([\s\S]*?)<\/p>/)[1];
      assert.match(semTags(fonte), /\d{2}\/\d{2}\/\d{4}|\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}/, "fonte sem data no card com número");
    }
  }
  // as estatísticas ficam em destaque e dizem a fonte e a data na mesma frase
  for (const p of pagina.matchAll(/<p class="numero">([^<]+)<\/p>/g)) {
    assert.match(p[1], /\((Febraban, \d{2}\/\d{2}\/\d{4}|Serasa Experian, [^)]+)\)\.$/, p[1]);
  }
});

test("o que a pesquisa marcou como não confirmado fica de fora", () => {
  const texto = semTags(pagina).toLowerCase();
  assert.doesNotMatch(texto, /\bkit\b/, "o \"kit\" do falso emprego não foi confirmado");
  assert.doesNotMatch(texto, /resolu[cç][aã]o/, "o número da resolução do Pix noturno não foi confirmado");
  assert.doesNotMatch(texto, /(mudar|alterar|ajustar) o (in[ií]cio do )?hor[aá]rio/, "ajuste do horário noturno não foi confirmado");
  assert.doesNotMatch(texto, /oi m[aã]e, troquei de n[uú]mero/, "frase literal sem fonte");
});

test("a página tem link no conferidor", () => {
  assert.match(index, /<a class="botao-link" href="golpes\.html">/);
});
