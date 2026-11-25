import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, normalizar, validarRegras } from "../js/motor.js";
import { REGRAS } from "../js/regras.js";

// Regras de mentira, só para testar o motor. As regras de verdade vêm da pesquisa.
const EXEMPLO = [
  {
    id: "exemplo-forte",
    golpe: "Golpe de exemplo A",
    sinais: ["palavra-a", "palavra-b"],
    minimo: 2,
    peso: 5,
    alerta: "alerta A",
    oQueFazer: ["passo comum", "passo A"],
  },
  {
    id: "exemplo-fraco",
    golpe: "Golpe de exemplo B",
    sinais: ["codigo (de )?verificacao"],
    peso: 2,
    alerta: "alerta B",
    oQueFazer: ["passo comum", "passo B"],
  },
];

test("normalizar tira acento, maiúsculas e espaços repetidos", () => {
  assert.equal(normalizar("  Código   de\nVERIFICAÇÃO "), "codigo de verificacao");
  assert.equal(normalizar(null), "");
});

test("as regras do site têm o formato certo", () => {
  assert.doesNotThrow(() => validarRegras(REGRAS));
});

test("as regras de exemplo têm o formato certo", () => {
  assert.doesNotThrow(() => validarRegras(EXEMPLO));
});

test("validarRegras recusa regra mal escrita, dizendo qual", () => {
  const base = EXEMPLO[1];
  const casos = [
    [{ ...base, id: "Com Espaco" }, /id/],
    [{ ...base, sinais: ["Código"] }, /sem acento/],
    [{ ...base, sinais: ["(aberto"] }, /expressão válida/],
    [{ ...base, sinais: [] }, /pelo menos um sinal/],
    [{ ...base, peso: 9 }, /peso/],
    [{ ...base, minimo: 3 }, /minimo/],
    [{ ...base, alerta: " " }, /alerta/],
    [{ ...base, oQueFazer: [] }, /oQueFazer/],
  ];
  for (const [regra, erro] of casos) {
    assert.throws(() => validarRegras([regra]), erro, JSON.stringify(regra));
  }
  assert.throws(() => validarRegras([base, base]), /id repetido/);
});

test("sem nenhum sinal, a lista vem vazia", () => {
  const r = analisar("Oi, tudo bem? Chego às 19h.", EXEMPLO);
  assert.deepEqual(r, { encontrados: [], oQueFazer: [] });
  assert.deepEqual(analisar("   ", EXEMPLO), { encontrados: [], oQueFazer: [] });
});

test("acha o sinal com acento e maiúsculas no texto colado", () => {
  const r = analisar("Me passa o CÓDIGO DE VERIFICAÇÃO que chegou", EXEMPLO);
  assert.deepEqual(r.encontrados.map((e) => e.id), ["exemplo-fraco"]);
  assert.equal(r.encontrados[0].alerta, "alerta B");
});

test("respeita o mínimo de sinais da regra", () => {
  assert.equal(analisar("só palavra-a aqui", EXEMPLO).encontrados.length, 0);
  assert.equal(analisar("palavra-a e palavra-b", EXEMPLO).encontrados.length, 1);
});

test("ordena do sinal mais forte para o mais fraco e não repete passos", () => {
  const r = analisar("palavra-a, palavra-b e o codigo de verificacao", EXEMPLO);
  assert.deepEqual(r.encontrados.map((e) => e.id), ["exemplo-forte", "exemplo-fraco"]);
  assert.deepEqual(r.oQueFazer, ["passo comum", "passo A", "passo B"]);
});
