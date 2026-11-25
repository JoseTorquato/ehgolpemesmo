// Regressão: número com ponto de milhar não é endereço IP ("R$ 1.250" virava
// "https://1.250", que o navegador lê como IP). IP de verdade continua com sinal.
import { test } from "node:test";
import assert from "node:assert/strict";

import { conferirEndereco, extrairEnderecos } from "../js/link.js";
import { analisarMensagem, conferirAnuncio } from "../js/anuncio.js";
import { validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";

const BASE = validar(SINAIS, REGRAS);
const temIp = (r) => r.encontrados.some((e) => e.id === "link-ip");

test("valores com ponto de milhar, no campo de mensagem, não são IP", () => {
  for (const m of ["o aluguel ficou R$ 1.250", "deu 2.300 reais", "R$ 2.299", "de 3.999 por 3.299", "Black Friday 11.11"]) {
    const r = analisarMensagem(m, BASE);
    assert.ok(!temIp(r), m);
    assert.equal(r.nivel, "nenhum", m);
    assert.deepEqual(extrairEnderecos(m), [], m);
  }
});

test("IP de verdade continua com sinal: com esquema, seguido de / ou :, ou sozinho no campo", () => {
  for (const l of ["http://203.0.113.7/x", "https://203.0.113.7", "acesse 203.0.113.7/login", "entre em 203.0.113.7:8080 agora"]) {
    assert.ok(temIp(analisarMensagem(l, BASE)), l);
  }
  assert.deepEqual(conferirEndereco("203.0.113.7").alertas.map((a) => a.id), ["ip"]);
  // quatro grupos no meio do texto, sem / nem :, não é tratado como endereço
  assert.deepEqual(extrairEnderecos("versão 1.2.3.4 do app"), []);
});

test("venda de particular com só Pix e pressa: mesmo nível no campo de mensagem e na aba", () => {
  for (const t of [
    "Vendo meu celular seminovo, só aceito Pix adiantado, tem que ser hoje",
    "Vendo bicicleta, pagamento só no Pix, quem pagar primeiro leva hoje",
  ]) {
    assert.equal(analisarMensagem(t, BASE).nivel, conferirAnuncio(t).nivel, t);
    assert.notEqual(analisarMensagem(t, BASE).nivel, "nenhum", t);
  }
});
