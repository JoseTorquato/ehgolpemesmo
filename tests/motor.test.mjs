import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, normalizar, validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";

// Dados de mentira, só para testar o motor. Os de verdade estão em js/regras.js.
const S = {
  "sinal-a": { nome: "A", padroes: ["palavra-a"] },
  "sinal-b": { nome: "B", padroes: ["palavra-b"] },
  "sinal-c": { nome: "C", padroes: ["codigo (de )?verificacao"], exceto: ["nao passe o codigo"] },
};
const R = [
  {
    id: "exemplo-forte",
    golpe: "Golpe A",
    nivel: "forte",
    quando: [["sinal-a", "sinal-b"]],
    peso: 5,
    alerta: "alerta forte A",
    oQueFazer: ["passo comum", "passo A"],
  },
  {
    id: "exemplo-atencao-a",
    golpe: "Golpe A",
    nivel: "atencao",
    quando: [["sinal-a"]],
    peso: 2,
    alerta: "atenção A",
    oQueFazer: ["passo comum"],
  },
  {
    id: "exemplo-c",
    golpe: "Golpe C",
    nivel: "atencao",
    quando: [["sinal-c"]],
    peso: 3,
    alerta: "atenção C",
    oQueFazer: ["passo comum", "passo C"],
  },
];
const BASE = validar(S, R);

test("normalizar tira acento, maiúsculas e espaços repetidos", () => {
  assert.equal(normalizar("  Código   de\nVERIFICAÇÃO "), "codigo de verificacao");
  assert.equal(normalizar(null), "");
});

test("os dados de verdade e os de exemplo têm o formato certo", () => {
  assert.doesNotThrow(() => validar(SINAIS, REGRAS));
  assert.doesNotThrow(() => validar(S, R));
});

test("validar recusa dado mal escrito, dizendo onde", () => {
  const regra = R[2];
  const casos = [
    [S, [{ ...regra, id: "Com Espaco" }], /id/],
    [S, [{ ...regra, quando: [["nao-existe"]] }], /sinal desconhecido/],
    [S, [{ ...regra, quando: [] }], /quando/],
    [S, [{ ...regra, nivel: "medio" }], /nivel/],
    [S, [{ ...regra, peso: 9 }], /peso/],
    [S, [{ ...regra, alerta: " " }], /alerta/],
    [S, [{ ...regra, oQueFazer: [] }], /oQueFazer/],
    [S, [regra, regra], /id repetido/],
    [{ ...S, x: { nome: "x", padroes: ["Código"] } }, R, /sem acento/],
    [{ ...S, x: { nome: "x", padroes: ["(aberto"] } }, R, /expressão válida/],
    [{ ...S, x: { nome: "x", padroes: [] } }, R, /pelo menos um padrão/],
  ];
  for (const [sinais, regras, erro] of casos) {
    assert.throws(() => validar(sinais, regras), erro);
  }
});

test("sem nenhum sinal, nível nenhum e listas vazias", () => {
  for (const texto of ["Oi, tudo bem? Chego às 19h.", "   ", ""]) {
    const r = analisar(texto, BASE);
    assert.equal(r.nivel, "nenhum");
    assert.deepEqual(r.encontrados, []);
    assert.deepEqual(r.oQueFazer, []);
  }
});

test("um sinal sozinho dá só atenção; a combinação dá alerta forte", () => {
  assert.equal(analisar("tem palavra-a", BASE).nivel, "atencao");
  const r = analisar("palavra-a e palavra-b", BASE);
  assert.equal(r.nivel, "forte");
  // a atenção do mesmo golpe some quando há alerta forte
  assert.deepEqual(r.encontrados.map((e) => e.id), ["exemplo-forte"]);
});

test("acha o sinal com acento e maiúsculas, e respeita o 'exceto'", () => {
  assert.deepEqual(analisar("Me passa o CÓDIGO DE VERIFICAÇÃO", BASE).sinais, ["sinal-c"]);
  assert.equal(analisar("Não passe o código de verificação a ninguém", BASE).nivel, "nenhum");
});

test("ordena forte antes de atenção e não repete passos", () => {
  const r = analisar("palavra-a, palavra-b e codigo de verificacao", BASE);
  assert.deepEqual(r.encontrados.map((e) => [e.id, e.nivel]), [
    ["exemplo-forte", "forte"],
    ["exemplo-c", "atencao"],
  ]);
  assert.deepEqual(r.oQueFazer, ["passo comum", "passo A", "passo C"]);
});
