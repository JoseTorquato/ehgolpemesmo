// Linha digitável: exemplos oficiais (Febraban v8, Santander v36) e as linhas
// FICTÍCIAS da pesquisa-v0.1 (seção 1.5). Não pagar nenhuma delas.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ALERTA_NUMEROS,
  AVISO_BENEFICIARIO,
  AVISO_COMPARAR,
  AVISO_COMPARAR_VALOR,
  AVISO_LINHA_VALIDA,
  conferirLinha,
  explicar,
  formatarData,
  modulo10,
  modulo11Arrecadacao,
  modulo11Cobranca,
  soDigitos,
  vencimentoDoFator,
} from "../js/boleto.js";
import { BANCOS, FONTE_BANCOS } from "../js/dados/bancos.js";

const HOJE = new Date(2026, 10, 25); // 25/11/2026, fixo para o teste não mudar com o tempo
const ler = (linha) => conferirLinha(linha, HOJE);
const data = (r, qual = "provavel") => formatarData(r.vencimento[qual]);

// Febraban, Layout de Arrecadação v8, seções 8 a 10 (exemplos do próprio manual)
const FEBRABAN_SEQ = "01230067896";
const FEBRABAN_43 = "8220000215048200974123220154098290108605940";

test("Febraban v8: exemplo do módulo 10 (DAC 3) e do módulo 11 (DAC 0)", () => {
  assert.equal(modulo10(FEBRABAN_SEQ), 3);
  assert.equal(modulo11Arrecadacao(FEBRABAN_SEQ), 0); // resto 0 → 0
});

test("Febraban v8: DV geral das 43 posições, módulo 10 (1) e módulo 11 (0, resto 1)", () => {
  assert.equal(modulo10(FEBRABAN_43), 1);
  assert.equal(modulo11Arrecadacao(FEBRABAN_43), 0);
});

test("exceções diferentes: cobrança 0/10/11 → 1; arrecadação resto 0/1 → 0 e resto 10 → 1", () => {
  // cobrança nunca tem DV geral 0
  for (const n of ["0", "00000000000", "5", "1234567890123", "8220000215048200974123220154098290108605940"]) {
    assert.notEqual(modulo11Cobranca(n), 0, n);
  }
  // "5": soma 10, resto 10 → arrecadação 1; cobrança 11 − 10 = 1
  assert.equal(modulo11Arrecadacao("5"), 1);
  // resto 0 → cobrança 1 (11 → 1), arrecadação 0
  assert.equal(modulo11Cobranca(FEBRABAN_SEQ), 1);
  assert.equal(modulo11Arrecadacao(FEBRABAN_SEQ), 0);
});

test("Santander v36: exemplo oficial completo", () => {
  const r = ler("03399.02827 03356.661243 57800.201014 8 20460000027371");
  assert.equal(r.status, "lida");
  assert.equal(r.tipo, "cobranca");
  assert.deepEqual(r.camposOk, [true, true, true]);
  assert.equal(r.dvGeralOk, true);
  assert.equal(r.banco.codigo, "033");
  assert.equal(r.banco.nome, BANCOS["033"]);
  assert.equal(r.valorCentavos, 27371);
  assert.equal(r.fator, 2046);
  // as duas datas do fator 2046; a "provável" é a mais próxima de hoje (estimativa)
  assert.deepEqual([data(r, "outra"), data(r)], ["15/05/2003", "04/01/2028"]);
});

test("linhas fictícias da pesquisa: cobrança", () => {
  const bb = ler("00190.00009 01234.567897 01234.567178 9 16610000015000");
  assert.equal(bb.numerosOk, true);
  assert.equal(bb.banco.codigo, "001");
  assert.equal(bb.valorCentavos, 15000);
  assert.equal(data(bb), "15/12/2026");

  const bradesco = ler("23791.23405 00000.000984 76543.000012 8 16870000089990");
  assert.equal(bradesco.numerosOk, true);
  assert.equal(bradesco.banco.codigo, "237");
  assert.equal(bradesco.valorCentavos, 89990);
  assert.equal(data(bradesco), "10/01/2027");
});

test("valor alterado em 1 centavo: DV geral errado vira alerta", () => {
  const r = ler("23791.23405 00000.000984 76543.000012 8 16870000089991");
  assert.deepEqual(r.camposOk, [true, true, true]);
  assert.equal(r.dvGeralOk, false);
  assert.equal(r.numerosOk, false);
  assert.ok(explicar(r).alertas.includes(ALERTA_NUMEROS));
});

test("um dígito trocado num campo também é pego", () => {
  const r = ler("00190.00009 01234.567897 01234.567178 9 16610000015000".replace("01234.567897", "01234.567887"));
  assert.equal(r.numerosOk, false);
});

test("banco 999: DVs certos, mas fora da lista do Banco Central", () => {
  const r = ler("99990.00004 00000.000000 00000.000000 6 16660000050000");
  assert.equal(r.numerosOk, true);
  assert.equal(r.banco.nome, null);
  assert.ok(explicar(r).alertas.some((a) => a.includes("999") && a.includes("Banco Central")));
});

test("linhas fictícias da pesquisa: arrecadação, módulo 10 e módulo 11", () => {
  const agua = ler("82600000000-8 89900000202-7 61215000000-0 00012345678-2");
  assert.equal(agua.tipo, "arrecadacao");
  assert.equal(agua.numerosOk, true);
  assert.equal(agua.segmento, "Saneamento");
  assert.equal(agua.valorCentavos, 8990);

  const orgao = ler("85850000012-6 34560000202-0 61220000000-6 00098765432-2");
  assert.equal(orgao.numerosOk, true);
  assert.equal(orgao.segmento, "Órgãos governamentais");
  assert.equal(orgao.valorCentavos, 123456);

  const adulterada = ler("82600000000-8 89900000202-7 61215000000-0 00012345679-2");
  assert.equal(adulterada.numerosOk, false);
});

test("fator de vencimento: regra antiga, virada de 22/02/2025 e estimativa", () => {
  const v1000 = vencimentoDoFator(1000, HOJE);
  assert.deepEqual([formatarData(v1000.provavel), formatarData(v1000.outra)], ["22/02/2025", "03/07/2000"]);
  const v9999 = vencimentoDoFator(9999, new Date(2025, 1, 1));
  assert.equal(formatarData(v9999.provavel), "21/02/2025");
  assert.equal(vencimentoDoFator(0, HOJE), null);
  assert.equal(vencimentoDoFator(999, HOJE), null);
});

test("o resultado sempre manda conferir o beneficiário e diz que número certo não basta", () => {
  for (const linha of [
    "00190.00009 01234.567897 01234.567178 9 16610000015000",
    "82600000000-8 89900000202-7 61215000000-0 00012345678-2",
    "23791.23405 00000.000984 76543.000012 8 16870000089991",
  ]) {
    const e = explicar(ler(linha));
    assert.equal(e.oQueFazer[0], AVISO_BENEFICIARIO, linha);
    assert.ok(e.oQueFazer.includes(AVISO_LINHA_VALIDA), linha);
    const comparar = linha.startsWith("8") ? AVISO_COMPARAR_VALOR : AVISO_COMPARAR;
    assert.ok(e.oQueFazer.includes(comparar), linha);
    if (linha.startsWith("8")) assert.doesNotMatch(e.oQueFazer.join(" "), /vencimento/, "arrecadação não traz vencimento");
  }
  const vencimento = explicar(ler("00190.00009 01234.567897 01234.567178 9 16610000015000")).informacoes.join(" ");
  assert.match(vencimento, /estimativa/);
});

test("tamanho errado e vazio", () => {
  assert.equal(ler("").status, "vazio");
  const curta = ler("0019000009 0123456789");
  assert.equal(curta.status, "tamanho-invalido");
  assert.match(explicar(curta).alertas[0], /47 números/);
  assert.equal(ler("1".repeat(48)).status, "tamanho-invalido", "48 dígitos só se começar com 8");
  assert.equal(soDigitos("12345.67890 1-2"), "123456789012");
});

test("lista de bancos embarcada, com fonte e data", () => {
  assert.equal(Object.keys(BANCOS).length, 463);
  assert.ok(Object.keys(BANCOS).every((c) => /^\d{3}$/.test(c)));
  assert.equal(FONTE_BANCOS.baixadoEm, "24/11/2026");
  assert.match(FONTE_BANCOS.url, /bcb\.gov\.br/);
});

test("destaque do nome de quem recebe em todo boleto lido, no alto do resultado", async () => {
  const { DESTAQUE_NOME } = await import("../js/boleto.js");
  assert.equal(
    DESTAQUE_NOME,
    "Antes de confirmar, o app do banco mostra o NOME de quem vai receber. Se não for a empresa que você esperava, ou se alguém pediu para você pagar por ele, pare.",
  );
  for (const linha of [
    "03399.02827 03356.661243 57800.201014 8 20460000027371",
    "00190.00009 01234.567897 01234.567178 9 16610000015000",
    "23791.23405 00000.000984 76543.000012 8 16870000089991",
    "99990.00004 00000.000000 00000.000000 6 16660000050000",
    "82600000000-8 89900000202-7 61215000000-0 00012345678-2",
    "85850000012-6 34560000202-0 61220000000-6 00098765432-2",
  ]) {
    assert.equal(explicar(ler(linha)).destaque, DESTAQUE_NOME, linha);
  }
});

test("'Alguém te pediu para pagar este boleto por ele?' — Sim mostra o alerta do falso parente", async () => {
  const { ALERTA_PAGAR_POR_MIM } = await import("../js/boleto.js");
  const linha = "00190.00009 01234.567897 01234.567178 9 16610000015000";
  const nao = explicar(ler(linha));
  assert.equal(nao.golpe, null, "sem resposta ou Não: fluxo de sempre");
  assert.equal(explicar(ler(linha), { pediramParaPagar: false }).golpe, null);
  const sim = explicar(ler(linha), { pediramParaPagar: true });
  assert.equal(sim.golpe, ALERTA_PAGAR_POR_MIM);
  assert.equal(sim.golpe.golpe, "Falso parente ou amigo pedindo dinheiro");
  assert.match(sim.oQueFazer[0], /número que você já conhecia, ou fale com ela pessoalmente/);
  assert.ok(sim.oQueFazer.some((p) => /nome de quem vai receber/.test(p)));
});
