// Nenhum texto do site pode dar garantia de que algo é confiável. Um "pode
// confiar" errado faz alguém pagar o golpe. Este teste lê TODOS os arquivos
// do site (páginas, código, estilos, documentação), fora a pasta tests/.
import { test } from "node:test";
import assert from "node:assert/strict";

import { arquivosDoSite } from "./arquivos.mjs";
import { normalizar } from "../js/motor.js";
import * as T from "../js/textos.js";

// escritas já normalizadas (sem acento, minúsculas)
const PROIBIDAS = [
  /\be seguro\b/,
  /\bnao e golpe\b/,
  /\bpode confiar\b/,
  /\bpode pagar\b/,
  /\bsem risco\b/,
  /\b100% (seguro|confiavel)\b/,
  /\bgarantimos\b/,
  /\be confiavel\b/,
  /\be verdadeir[oa]\b/,
];

test("nenhum arquivo do site usa frase que dá garantia", () => {
  const achados = [];
  for (const { caminho, texto } of arquivosDoSite()) {
    const t = normalizar(texto);
    for (const frase of PROIBIDAS) {
      const m = t.match(frase);
      if (m) achados.push(`${caminho}: "${m[0]}"`);
    }
  }
  assert.deepEqual(achados, []);
});

test("o teste pega a frase proibida, com e sem acento", () => {
  for (const amostra of ["Pode Confiar!", "isso NÃO É GOLPE", "o link é seguro"]) {
    assert.ok(PROIBIDAS.some((f) => f.test(normalizar(amostra))), amostra);
  }
});

test("sem sinal, o máximo que o site diz é a frase combinada", () => {
  assert.equal(
    T.SEM_SINAL,
    "Nenhum sinal de alerta encontrado — mesmo assim, confirme por outro canal.",
  );
});
