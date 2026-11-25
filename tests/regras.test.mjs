// Regras de verdade contra mensagens de golpe e mensagens normais.
//
// Mensagens de golpe: a do item 1 é citação literal da Polícia Civil de Goiás
// (pesquisa-v0.1, 2.1); as outras são FICTÍCIAS, montadas com o roteiro
// descrito nas fontes oficiais. Mensagens normais: as 6 de família da
// pesquisa (FICTÍCIAS) e outras comuns, para medir falso alarme.
import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";

const BASE = validar(SINAIS, REGRAS);
const rodar = (texto) => analisar(texto, BASE);

const GOLPES_FALSO_PARENTE = [
  // Polícia Civil de Goiás (citação literal do roteiro)
  "estou aqui precisando de um guincho no meio da estrada, precisando fazer um exame, meu cartão estourou o limite, te pago logo amanhã, mas me deposita rapidamente",
  "Oi mãe, troquei de número, salva esse. Preciso que você me faça um Pix agora",
  "Pai, meu novo número é este. Consegue transferir 800 reais pra mim? Te devolvo amanhã",
  "Mãe, o app do banco travou e preciso pagar uma conta, faz um pix pra mim?",
  "A ligação tá ruim, não consigo falar agora. Me faz um pix de 1.500?",
  "É urgente vó, manda pra conta de um amigo meu, a chave tá aqui",
  "Não conta pro pai, mas preciso que você me empreste 2 mil no pix",
  "Tia, mudei de número, o antigo foi roubado. Paga esse boleto pra mim?",
];

const NORMAIS_FAMILIA = [
  // as 6 mensagens normais da pesquisa (2.1), com o resultado esperado
  ["Mãe, troquei de número, o antigo vai ser desligado. Salva esse aqui. Beijo", "atencao"],
  ["Pai, me faz um pix de 50 pro gás? Te devolvo sexta", "nenhum"],
  ["Vó, a mãe pediu pra te avisar que o almoço é às 13h, não precisa levar nada", "nenhum"],
  ["Tô sem bateria, vou desligar, te ligo depois", "nenhum"],
  ["Mãe, paga esse boleto da faculdade pra mim? Tá no meu nome, vence hoje", "atencao"],
  ["Pode transferir pro Zé da oficina, a chave é o celular dele, ele já arrumou o carro", "atencao"],
];

const OUTRAS_NORMAIS = [
  "Compra de R$ 89,90 aprovada no cartão final 1234.", // SMS de banco que não pede ação
  "Seu código de verificação é 123456. Não compartilhe esse código com ninguém.",
  "Bom dia! Chego no domingo pro almoço, levo a sobremesa.",
  "Nunca informe sua senha por telefone. Seu banco.",
  "A fatura do cartão fecha amanhã, já paguei pelo app.",
  "Oi, o boleto do condomínio chegou por e-mail, vence dia 10.",
];

test("os dados das regras têm o formato certo", () => {
    for (const s of ["numero-novo", "pedido-dinheiro", "urgencia", "impedimento", "promessa-devolucao", "conta-terceiro", "evita-ligacao", "sigilo", "pedido-codigo"]) {
    assert.ok(SINAIS[s], `falta o sinal ${s}`);
  }
});

test("mensagens de golpe do falso parente dão alerta forte", () => {
  for (const msg of GOLPES_FALSO_PARENTE) {
    const r = rodar(msg);
    assert.equal(r.nivel, "forte", `${msg}\n→ ${JSON.stringify(r.sinais)}`);
    assert.ok(r.encontrados.some((e) => e.golpe.startsWith("Falso parente")), msg);
    assert.ok(r.oQueFazer.some((p) => p.includes("número ANTIGO")), msg);
    assert.ok(r.oQueFazer.some((p) => p.includes("pergunta que só ele saberia")), msg);
    assert.ok(r.oQueFazer.some((p) => p.includes("conta de outra pessoa")), msg);
  }
});

test("as 6 mensagens normais de família não dão alerta forte", () => {
  for (const [msg, esperado] of NORMAIS_FAMILIA) {
    const r = rodar(msg);
    assert.equal(r.nivel, esperado, `${msg}\n→ ${JSON.stringify(r)}`);
  }
});

test("mensagem de troca de número sem pedido sugere ligar no número antigo", () => {
  const r = rodar(NORMAIS_FAMILIA[0][0]);
  assert.ok(r.oQueFazer[0].includes("número ANTIGO"));
});

test("um sinal sozinho não dá alerta forte (exceto pedido de código)", () => {
  for (const [id, s] of Object.entries(SINAIS)) {
    const forte = REGRAS.filter((r) => r.nivel === "forte").some((r) => r.quando.some((c) => c.length === 1 && c[0] === id));
    const isolados = ["pedido-codigo", "conta-segura", "acesso-remoto", "pedido-senha", "motoboy"];
    if (forte) assert.ok(isolados.includes(id), `sinal ${id} (${s.nome}) dá alerta forte sozinho`);
  }
});

test("outras mensagens normais não dão alerta forte", () => {
  for (const msg of OUTRAS_NORMAIS) {
    assert.notEqual(rodar(msg).nivel, "forte", msg);
  }
});

test("pedido de código dá alerta forte sozinho, aviso do próprio WhatsApp não", () => {
  assert.equal(rodar("Oi! Te mandei um código por engano, me passa o código que chegou por SMS?").nivel, "forte");
  assert.equal(rodar("Seu código de verificação é 123456. Não compartilhe esse código.").nivel, "nenhum");
});

test("falsa central: conta segura, aplicativo, senha e motoboy", () => {
  const casos = [
    "Aqui é da central de segurança do banco. Detectamos uma compra suspeita, transfira seu saldo para uma conta segura.",
    "Para cancelar a compra, baixe o aplicativo AnyDesk e me passe o número que aparecer.",
    "Confirme sua senha e o token para bloquear o novo dispositivo.",
    "Um motoboy vai buscar o seu cartão para perícia.",
    "Vamos fazer um teste do Pix para validar sua conta.",
  ];
  for (const msg of casos) {
    const r = rodar(msg);
    assert.equal(r.nivel, "forte", msg);
    assert.ok(r.encontrados.some((e) => e.golpe === "Falsa central do banco"), msg);
  }
});

test("Pix por engano com devolução em outra chave", () => {
  const r = rodar("Oi, fiz um pix errado pra você de 300 reais, devolve pra essa outra chave por favor");
  assert.equal(r.nivel, "forte");
  assert.ok(r.oQueFazer.some((p) => p.includes("função de devolver o próprio Pix")));
  assert.equal(rodar("Mandei por engano um pix pra sua conta, pode conferir?").nivel, "atencao");
});

test("empréstimo com taxa antecipada", () => {
  assert.equal(rodar("Seu empréstimo de R$ 5.000 foi aprovado! Para liberar, pague a taxa de liberação de R$ 250.").nivel, "forte");
  assert.equal(rodar("Crédito aprovado: é só depositar o IOF antes da liberação.").nivel, "forte");
  assert.notEqual(rodar("Paguei a parcela do empréstimo ontem.").nivel, "forte");
});

test("cobrança falsa com link", () => {
  const casos = [
    "Correios: sua encomenda está retida. Pague a taxa em https://rastreio-entrega.xyz/pagar",
    "Última notificação: regularize sua pendência em www.receita-regularize.com.br ou seu CPF será cancelado.",
  ];
  for (const msg of casos) assert.equal(rodar(msg).nivel, "forte", msg);
  assert.equal(rodar("Olha a foto da festa: https://exemplo.com/foto").nivel, "nenhum");
});

test("alertas fortes aparecem antes e escondem as atenções do mesmo golpe", () => {
  const r = rodar("Oi mãe, troquei de número, salva esse. Preciso que você me faça um Pix agora");
  assert.equal(r.encontrados[0].nivel, "forte");
  assert.ok(!r.encontrados.some((e) => e.nivel === "atencao" && e.golpe.startsWith("Falso parente")));
});
