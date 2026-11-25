// Para quem tem dificuldade de leitura: letra grande, contraste AA, alvos
// grandes, rótulos e aviso ao leitor de tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./arquivos.mjs";
import { soDigitos, conferirLinha } from "../js/boleto.js";

const ler = (...p) => readFileSync(join(RAIZ, ...p), "utf8");
const css = ler("css", "estilo.css");
const index = ler("index.html");

function cor(nome) {
  const m = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `variável --${nome} não encontrada`);
  return m[1];
}

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [texto, fundo]: todo par usado no CSS
const PARES = [
  ["texto", "fundo"],
  ["texto-suave", "fundo"],
  ["primario-texto", "primario"],
  ["secundario-texto", "secundario-fundo"],
  ["alerta-texto", "alerta-fundo"],
  ["whatsapp-texto", "whatsapp"],
  ["primario", "fundo"], // links
];

test("contraste AA (4,5:1) em todos os pares de cor", () => {
  for (const [texto, fundo] of PARES) {
    const c = contraste(cor(texto), cor(fundo));
    assert.ok(c >= 4.5, `--${texto} sobre --${fundo}: ${c.toFixed(2)}:1`);
  }
});

test("letra base de pelo menos 18px, em unidade que respeita o aparelho", () => {
  const m = css.match(/html\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)%/);
  assert.ok(m, "font-size do html em %");
  assert.ok(Number(m[1]) >= 112.5, `base de ${(16 * m[1]) / 100}px`);
});

test("botões com pelo menos 44px de altura", () => {
  const m = css.match(/button,\s*\.botao-link\s*\{[^}]*min-height:\s*(\d+(?:\.\d+)?)rem/);
  assert.ok(m, "min-height dos botões em rem");
  assert.ok(Number(m[1]) * 16 >= 44);
});

test("página pronta para celular e leitor de tela", () => {
  assert.match(index, /<html lang="pt-BR">/);
  assert.match(index, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(index, /id="resultado"[^>]*aria-live="polite"/);
  assert.match(index, /class="pular" href="#principal"/);
  assert.match(index, />Colar mensagem</);
  assert.match(index, />Colar linha do boleto</);
  for (const id of ["mensagem", "boleto"]) {
    assert.match(index, new RegExp(`<label for="${id}">[^<]+</label>`), `campo ${id} sem rótulo`);
  }
  // sem bloqueio de zoom
  assert.doesNotMatch(index, /user-scalable=no|maximum-scale=1\b/);
});

test("a página Já caí existe e não tem prazo inventado", () => {
  const pagina = ler("ja-cai.html");
  assert.match(pagina, /<h1>Já caí, e agora\?<\/h1>/);
  assert.doesNotMatch(pagina, /\d+\s*(horas?|dias?|minutos?)\b/i, "prazo só com fonte oficial");
});

test("boleto: por enquanto só limpa os dígitos e diz que ainda não confere", () => {
  assert.equal(soDigitos("12345.67890 1"), "12345678901");
  assert.deepEqual(conferirLinha("  "), { status: "vazio", digitos: "" });
  assert.equal(conferirLinha("123").status, "indisponivel");
});
