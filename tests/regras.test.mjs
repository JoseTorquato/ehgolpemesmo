// Regras de verdade contra mensagens de golpe e mensagens normais.
//
// A primeira mensagem de golpe é citação literal da Polícia Civil de Goiás
// (pesquisa-v0.1, 2.1). Todas as outras são FICTÍCIAS, escritas aqui para
// cada CLASSE de erro apontada por QA e Revisor: para cada classe, golpes que
// devem disparar e mensagens normais parecidas que não podem disparar.
import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";
import { analisarMensagem } from "../js/anuncio.js";

const BASE = validar(SINAIS, REGRAS);
const rodar = (texto) => analisar(texto, BASE);
const nivel = (texto) => rodar(texto).nivel;

const ORDEM = { nenhum: 0, atencao: 1, forte: 2 };

function esperar(casos, esperado) {
  for (const msg of casos) {
    const r = rodar(msg);
    assert.equal(r.nivel, esperado, `${msg}\n→ sinais ${JSON.stringify(r.sinais)} · ${r.encontrados.map((e) => e.id)}`);
    // a página roda também os links e as regras de anúncio no campo de
    // mensagem: isso nunca pode baixar o nível, nem pôr alerta forte onde
    // as regras da mensagem não acharam nada
    const pagina = analisarMensagem(msg, BASE);
    assert.ok(ORDEM[pagina.nivel] >= ORDEM[esperado], `campo de mensagem baixou o nível: ${msg}`);
    if (esperado === "nenhum") assert.notEqual(pagina.nivel, "forte", `alerta forte no campo de mensagem: ${msg}`);
  }
}

// ---- falso parente ------------------------------------------------------------

test("os 9 sinais do falso parente existem", () => {
  for (const s of ["numero-novo", "pedido-dinheiro", "urgencia", "impedimento", "promessa-devolucao", "conta-terceiro", "evita-ligacao", "sigilo", "pedido-codigo"]) {
    assert.ok(SINAIS[s], `falta o sinal ${s}`);
  }
});

test("mensagens de golpe do falso parente dão alerta forte, com os passos certos", () => {
  const golpes = [
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
  esperar(golpes, "forte");
  for (const msg of golpes) {
    const passos = rodar(msg).oQueFazer.join(" ");
    assert.match(passos, /número ANTIGO/, msg);
    assert.match(passos, /pergunta que só ele saberia/, msg);
    assert.match(passos, /conta de outra pessoa/, msg);
  }
});

test("classe 1 — número novo em outras formas", () => {
  esperar([
    "Oi mãe, troquei de chip. Consegue me ajudar com 300 reais?",
    "Pai, perdi meu celular, esse é um número temporário. Preciso de 500 reais pra hoje",
    "Vó, meu celular caiu na água, tô usando o do meu amigo. Me ajuda com 400?",
    "Prezada, informo meu novo número de contato. Solicito a gentileza de transferir R$ 1.200,00 ainda hoje.",
    "Tio, roubaram meu celular. Esse é meu número novo, faz um pix pra mim?",
  ], "forte");
  // as mesmas formas, sem pedido de dinheiro: só um ponto para conferir
  esperar([
    "Mãe, troquei de chip, salva esse aqui",
    "Perdi meu celular ontem, esse número é temporário",
  ], "atencao");
  // não é número novo
  esperar([
    "Oi tia! Troquei de celular mas o número é o mesmo, me adiciona de novo no grupo",
    "Me manda o número novo da sua sogra?",
    "Qual é o número novo do encanador?",
    "Comprei um celular novo, as fotos ficaram ótimas",
  ], "nenhum");
});

test("classe 2 — pedido de dinheiro sem a palavra Pix", () => {
  esperar([
    "vó sou eu, troquei de número. me ajuda com 850 reais? é urgente, não conta pra ninguém",
    "Mãe, esse é meu número novo. Preciso de 2 mil até as 18h",
    "Pai, não posso falar agora, me ajuda com 400?",
  ], "forte");
  // pedido de dinheiro legítimo, sem outro sinal: nunca dá aviso
  esperar([
    "Mãe, preciso de 2 mil até as 18h pra pagar o aluguel",
    "Pai, me ajuda com 400 pro material da faculdade?",
    "Me manda o Pix do mercado?",
    "Faz um pix de 80 do gás, te devolvo no sábado",
    "A chave pix da faxina é o celular dela",
    "Padaria: pode pagar no pix",
    "Mãe, faz um pix urgente de 30 que esqueci a carteira, te devolvo em casa",
  ], "nenhum");
});

test("classe 3 — combinações que faltavam", () => {
  esperar([
    "Te mandei um pix de 500 por engano, pode devolver nessa outra chave?",
    "Oi, transferi 300 reais sem querer pra você, faz a devolução pra chave certa por favor",
    "Mãe, troquei de número. Manda na chave do meu amigo, ele me passa",
    "Tô sem microfone, não dá pra falar. Preciso de R$ 600 urgente",
  ], "forte");
  esperar(["Mandei um pix de 50 por engano pra você, pode conferir no app?"], "atencao");
  esperar([
    "Desculpa, mandei a mensagem errada sem querer",
    "Recebi o seu pix, obrigado!",
  ], "nenhum");
});

test("classe 4 — cobrança e ameaça sem link", () => {
  esperar([
    "Setor de cobrança: seu nome será negativado amanhã. Quite pelo Pix CNPJ 12.345.678/0001-90 hoje.",
    "Aviso: o fornecimento de energia será cortado amanhã. Pague o boleto em anexo para evitar o corte.",
    "Seu título foi protestado. Para acordo hoje, segue a chave pix abaixo.",
  ], "forte");
  esperar([
    "Lembrete: sua fatura de luz vence amanhã. Pague pelo aplicativo da distribuidora.",
    "Oi, o boleto do condomínio chegou por e-mail, vence dia 10.",
  ], "nenhum");
});

test("classe 5 — falsa central sem link", () => {
  esperar([
    "Banco: compra de R$ 2.390,00 não reconhecida? Ligue agora para 0800 123 4567",
    "Central de segurança: identificamos uma transação suspeita no seu cartão.",
    "Não desligue e não abra o aplicativo do banco, a operação está em análise.",
    "Ligue 0800 000 1234 e informe o código recebido por SMS para cancelar a compra.",
  ], "forte");
  // aviso legítimo que manda usar o verso do cartão: só um ponto para conferir
  esperar(["Se não reconhece a compra, ligue para o número no verso do seu cartão."], "atencao");
  esperar([
    "Compra de R$ 89,90 aprovada no cartão final 1234.",
    "Compra aprovada no cartão final 1234. Valor R$ 45,00.",
    "Liga pra tia no 11 98765-4321 pra combinar o almoço",
  ], "nenhum");
});

test("classe 6 — prêmio, vaga e só no Pix", () => {
  esperar([
    "Parabéns, você foi sorteado! Para receber o prêmio, pague a taxa de envio de R$ 49.",
    "Vaga de renda extra: curtir vídeos e ganhar R$ 300 por dia. Pague o cadastro de R$ 80 para começar.",
    "Empréstimo aprovado! Deposite a taxa de R$ 380 de seguro para liberar.",
  ], "forte");
  esperar(["Black Friday: 80% de desconto, só no Pix!"], "atencao");
  esperar([
    "Ganhei um brinde na farmácia hoje!",
    "Abriu vaga lá na loja, quer que eu te indique?",
    "Pagando no Pix tem 5% de desconto.",
  ], "nenhum");
});

test("pedido de código, com o que o WhatsApp manda dizer", () => {
  assert.equal(nivel("Oi! Me passa o código que chegou por SMS?"), "forte");
  assert.equal(nivel("Seu código de verificação é 123456. Não compartilhe esse código."), "nenhum");
});

test("falsa central: conta segura, aplicativo, senha e motoboy", () => {
  esperar([
    "Aqui é da central de segurança do banco. Detectamos uma compra suspeita, transfira seu saldo para uma conta segura.",
    "Para cancelar a compra, baixe o aplicativo AnyDesk e me passe o número que aparecer.",
    "Confirme sua senha e o token para bloquear o novo dispositivo.",
    "Um motoboy vai buscar o seu cartão para perícia.",
    "Vamos fazer um teste do Pix para validar sua conta.",
  ], "forte");
});

test("cobrança com link e empréstimo com taxa", () => {
  esperar([
    "Correios: sua encomenda está retida. Pague a taxa em https://rastreio-entrega.xyz/pagar",
    "Última notificação: regularize sua pendência em www.receita-regularize.com.br ou seu CPF será cancelado.",
    "Seu token expirou. Para evitar bloqueio, acesse bit.ly/atualiza-banco",
    "Serasa: seu CPF foi negativado. Clique aqui: serasa-acordo.net",
    "Seu empréstimo de R$ 5.000 foi aprovado! Para liberar, pague a taxa de liberação de R$ 250.",
  ], "forte");
  esperar(["Olha a foto da festa: https://exemplo.com/foto", "Paguei a parcela do empréstimo ontem."], "nenhum");
});

// ---- as 6 mensagens normais de família da pesquisa ------------------------------

test("as 6 mensagens normais de família da pesquisa", () => {
  const casos = [
    ["Mãe, troquei de número, o antigo vai ser desligado. Salva esse aqui. Beijo", "atencao"],
    ["Pai, me faz um pix de 50 pro gás? Te devolvo sexta", "nenhum"],
    ["Vó, a mãe pediu pra te avisar que o almoço é às 13h, não precisa levar nada", "nenhum"],
    ["Tô sem bateria, vou desligar, te ligo depois", "nenhum"],
    ["Mãe, paga esse boleto da faculdade pra mim? Tá no meu nome, vence hoje", "nenhum"],
    ["Pode transferir pro Zé da oficina, a chave é o celular dele, ele já arrumou o carro", "nenhum"],
  ];
  for (const [msg, esperado] of casos) assert.equal(nivel(msg), esperado, msg);
});

// ---- o nível "atenção" não acusa ninguém ----------------------------------------

test("atenção: título proporcional e passos condicionais, sem 'nunca responda'", () => {
  const numeroNovo = rodar("Mãe, troquei de número, o antigo vai ser desligado. Salva esse aqui.");
  assert.equal(numeroNovo.nivel, "atencao");
  assert.equal(numeroNovo.encontrados[0].golpe, "Número novo de parente ou amigo");
  assert.match(numeroNovo.oQueFazer[0], /Antes de salvar o número novo, ligue/);


  for (const msg of ["Mãe, troquei de número, salva esse", "Mandei um pix de 50 por engano pra você", "Se não reconhece a compra, ligue para o número no verso do seu cartão."]) {
    const r = rodar(msg);
    assert.equal(r.nivel, "atencao", msg);
    for (const e of r.encontrados) assert.doesNotMatch(e.golpe, /golpe|falso|falsa/i, msg);
    assert.doesNotMatch(r.oQueFazer.join(" "), /Nunca ligue nem responda/, msg);
  }
});

test("alertas fortes escondem as atenções da mesma família", () => {
  const r = rodar("Oi mãe, troquei de número, salva esse. Preciso que você me faça um Pix agora");
  assert.equal(r.encontrados[0].nivel, "forte");
  assert.ok(!r.encontrados.some((e) => e.nivel === "atencao"));
});

test("um sinal sozinho só dá alerta forte nos casos que o banco nunca faz", () => {
  const isolados = ["pedido-codigo", "conta-segura", "acesso-remoto", "pedido-senha", "motoboy", "pressao-ligacao"];
  for (const r of REGRAS.filter((x) => x.nivel === "forte")) {
    for (const c of r.quando) {
      if (c.length === 1) assert.ok(isolados.includes(c[0]), `${r.id}: ${c[0]} dá alerta forte sozinho`);
    }
  }
});

// ---- ajustes finais da v0.1 (remedição do Revisor) ------------------------------

test("conta de terceiro só avisa combinada com número novo, segredo, pressa ou evita ligação", () => {
  esperar([
    "Faz um pix de 80 pro seu Zé da feira, a chave é o telefone dele",
    "Pode pagar na conta da minha colega, ela me repassa",
    "A chave pix é da minha vizinha, ela vai levar o bolo",
  ], "nenhum");
  esperar([
    "Mãe, troquei de número. Faz o pix na conta da minha amiga",
    "Não conta pra ninguém, manda na conta de um amigo meu",
    "Urgente, manda pra chave do meu primo, ele me passa",
    "Tô sem crédito, não consigo ligar. Manda na conta da minha colega",
  ], "forte");
});

test("outro número anunciado sem 'troquei'", () => {
  esperar([
    "Vó, agora estou usando este zap. O banco bloqueou meu cartão, me salva com 400?",
    "Mãe, peguei o celular emprestado da minha amiga. Preciso de 300 reais pra hoje",
  ], "forte");
  esperar(["Peguei o celular emprestado da minha amiga só pra te avisar que cheguei"], "atencao");
  esperar(["O celular da escola tá emprestado pro professor"], "nenhum");
});

test("impedimento e evita ligação ditos de outro jeito", () => {
  esperar([
    "Pai, o banco bloqueou meu cartão, faz um pix pra mim?",
    "Filho aqui, tô sem crédito e sem conseguir ligar. Paga esse valor pra mim?",
  ], "forte");
  esperar([
    "O banco bloqueou meu cartão, já liguei e resolveram",
    "Tô sem crédito, depois te ligo",
  ], "nenhum");
});

test("código pedido como '6 números' ou 'número que chegou'", () => {
  esperar([
    "Aqui é do banco. Confirme os 6 números que chegaram por SMS para cancelar a compra.",
    "Me passa o número que chegou no seu celular, por favor",
  ], "forte");
  esperar(["Anota os 6 números do protocolo: 123456"], "nenhum");
});

test("devolver no Pix de outra pessoa", () => {
  esperar([
    "Fiz uma transferência sem querer pra você, manda de volta nesse pix do meu marido",
    "Caiu na sua conta 200 reais por engano, devolve no pix da minha esposa por favor",
  ], "forte");
  esperar(["Já devolvi o pix que você mandou por engano, confere aí"], "atencao");
});

test("multa ou cobrança com chave CNPJ, sem link", () => {
  esperar([
    "Multa pendente: pague hoje pela chave CNPJ 12.345.678/0001-90 para evitar protesto.",
    "Débito em aberto. Seu nome será negativado amanhã. Chave pix é o CNPJ da empresa.",
  ], "forte");
  esperar([
    "Paguei a multa do carro ontem pelo app do banco",
    "A loja aceita pix, a chave é o CNPJ que está na nota",
  ], "nenhum");
});

test("empréstimo pré-aprovado com seguro ou parcela antecipada", () => {
  esperar([
    "Seu consignado pré-aprovado de R$ 8.000 está pronto. Faça o pagamento do seguro para cair na conta hoje.",
    "Crédito pré-aprovado! Pague a primeira parcela para liberar o valor.",
  ], "forte");
  esperar(["Paguei a primeira parcela do consignado, já caiu o desconto na folha"], "nenhum");
});

test("falsa central: texto fiel à fonte (urgência e pressão)", () => {
  const r = rodar("Não desligue e não abra o aplicativo do banco.");
  assert.match(r.encontrados[0].alerta, /não usa urgência nem pressão/);
  assert.doesNotMatch(r.encontrados[0].alerta, /O banco não faz isso/);
});

test("bloqueio com cara de banco aparece como falsa central, não como falso parente", () => {
  const banco = [
    "Seu Pix foi bloqueado por segurança. Para liberar, faça um Pix de teste de R$ 10. Não feche esta conversa.",
    "Central: seu cartão foi bloqueado. Faça uma transferência de R$ 50 para desbloquear.",
  ];
  for (const msg of banco) {
    const r = rodar(msg);
    assert.equal(r.nivel, "forte", msg);
    assert.deepEqual(r.encontrados.map((e) => e.golpe), ["Falsa central do banco"], msg);
  }
  // o mesmo impedimento dito por um parente continua como falso parente
  const parente = rodar("Mãe, meu pix tá bloqueado, faz um pix pra mim?");
  assert.equal(parente.nivel, "forte");
  assert.deepEqual(parente.encontrados.map((e) => e.golpe), ["Falso parente ou amigo pedindo dinheiro"]);
});

test("contexto de banco sozinho não gera aviso (só escolhe o nome do golpe)", () => {
  assert.equal(nivel("Seu cartão novo chegou na agência, o gerente pediu para buscar."), "nenhum");
});

// ---- "pagar por mim": pede para OUTRA pessoa pagar, com app/senha/conta travada

const PAGAR_POR_MIM = [
  "Deu um imprevisto aqui. Tenho que pagar um boleto hoje mas travou no aplicativo minha senha de transação.",
  "Hoje é o último dia que pago com desconto. Amanhã passando na agência já mando o pix.",
  "Se eu mandar o boleto consegue pagar na sua conta? 2.100,00 o valor do boleto. Amanhã cedo passo na agência pra mudar a senha e transfiro na sua conta.",
];

test("pagar por mim: a conversa inteira dá forte, cada mensagem pelo menos atenção", () => {
  const juntas = rodar(PAGAR_POR_MIM.join("\n"));
  assert.equal(juntas.nivel, "forte");
  assert.deepEqual(juntas.encontrados.map((e) => e.golpe), ["Falso parente ou amigo pedindo dinheiro"]);
  const passos = juntas.oQueFazer.join(" ");
  assert.match(passos, /número que você já conhecia, ou fale com ela pessoalmente/);
  assert.match(passos, /Não pague boleto de outra pessoa sem confirmar/);
  assert.match(passos, /beneficiário/);
  for (const msg of PAGAR_POR_MIM) assert.notEqual(nivel(msg), "nenhum", msg);
});

test("pagar por mim: mesma classe, outras palavras", () => {
  esperar([
    "Oi, o app do banco travou e minha senha bloqueou. Consegue pagar esse boleto de 1.850,00 pra mim? Te devolvo amanhã",
    "Tô sem acesso ao aplicativo, faz esse pagamento por mim hoje? Amanhã eu transfiro",
    "Meu limite estourou, se eu te mandar o boleto você paga? É o último dia",
  ], "forte");
  esperar(["Travou minha senha de transação, amanhã passo na agência e te passo o pix"], "atencao");
});

test("pagar por mim: pedido de família SEM impedimento continua sem aviso", () => {
  esperar([
    "Paga a conta de luz que eu te devolvo",
    "Faz um pix pra mim que te pago sexta",
    "Pode pagar o boleto da escola pra mim? Te devolvo amanhã",
    "Hoje é o último dia do desconto da loja, vamos?",
    "Meu app do banco travou, depois eu vejo isso",
    "Vou passar na agência amanhã pra resolver a senha",
  ], "nenhum");
});

test("pagar por mim: oferta em primeira pessoa não é pedido", () => {
  esperar([
    "Vou passar na agência hoje pra trocar a senha, quer que eu pague a sua conta também?",
    "Meu app travou, mas posso pagar a sua conta amanhã na agência",
    "Deixa que eu pago o seu boleto hoje, minha senha já voltou",
  ], "nenhum");
  // o pedido de verdade, na mesma situação, continua avisando
  assert.notEqual(nivel("Vou passar na agência hoje pra trocar a senha, consegue pagar a minha conta pra mim?"), "nenhum");
});

test("pagar por mim: pedido e impedimento ditos de outras formas", () => {
  esperar([
    "Poderia efetuar o pagamento por mim? O acesso ao internet banking foi bloqueado. Amanhã te devolvo",
    "Você paga essa conta pra mim? Tô sem acesso ao meu banco, amanhã te mando de volta",
    "Deu erro no token aqui. Consegue pagá-lo para mim hoje? É o último dia",
    "Minha conta bloqueou, paga no meu lugar esse boleto de 1.300,00? Te devolvo amanhã",
    "Tô com o app travado, você paga pra mim? Te pago sexta",
  ], "forte");
  // as versões normais parecidas
  esperar([
    "Você paga a conta de luz e eu pago a de água, combinado?",
    "Minha conta bloqueou, mas já resolvi no banco",
    "Deu erro no token, vou ligar no banco amanhã",
    "Paga no meu lugar o pão hoje? Eu esqueci a carteira",
  ], "nenhum");
});

test("pagar por mim: pedido e impedimento em mensagens diferentes, coladas juntas", () => {
  const conversa = [
    "Oi, tudo bem? Deu um problema aqui.",
    "O aplicativo do banco travou e não consigo fazer nada.",
    "Consegue pagar esse boleto pra mim?",
    "Amanhã eu transfiro pra você.",
  ];
  for (const msg of conversa.slice(0, 1)) assert.equal(nivel(msg), "nenhum", msg);
  assert.equal(nivel(conversa.join("\n")), "forte");
});

test("valor alto não casa CPF, CNPJ nem protocolo com pontos", async () => {
  const { sinaisPresentes, normalizar } = await import("../js/motor.js");
  const tem = (t) => sinaisPresentes(normalizar(t), SINAIS).has("valor-alto");
  assert.ok(tem("o valor é 2.100,00"));
  assert.ok(tem("R$ 1.850"));
  assert.ok(tem("são 3 mil reais"));
  assert.ok(!tem("meu CPF é 123.456.789-00"));
  assert.ok(!tem("CNPJ 12.345.678/0001-90"));
  assert.ok(!tem("R$ 980,00"));
});
