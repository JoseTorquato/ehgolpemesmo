// Regressões da revisão do PR #3: "@" antes do site, domínio da mesma empresa
// em outro país, anúncio no campo de mensagem e classes de anúncio que
// escapavam. Exemplos montados aqui, por classe (sem os conjuntos de teste
// do Revisor e do QA, que ficam fora do repositório).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { conferirEndereco, extrairEndereco, lerEndereco } from "../js/link.js";
import { analisarMensagem, conferirAnuncio } from "../js/anuncio.js";
import { validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";
import { RAIZ } from "./arquivos.mjs";
import * as T from "../js/textos.js";

const BASE = validar(SINAIS, REGRAS);
const ids = (l) => conferirEndereco(l).alertas.map((a) => a.id).sort();
const nivel = (l) => conferirEndereco(l).nivel;

test("'@' antes do site: o site de verdade é o que vem depois, e o alerta é forte", () => {
  const formas = [
    "https://www.magazineluiza.com.br@golpe.example/oferta",
    "https://magazineluiza.com.br@golpe.example/",
    "https://magazineluiza.com.br:443@golpe.example/",
    "https://magazineluiza.com.br%2F@golpe.example/x",
    "https://www.amazon.com.br@golpe.example/.",
    "www.magazineluiza.com.br@golpe.example/oferta",
    "magazineluiza.com.br@golpe.example",
    "https://usuario:senha@golpe.example/x",
    "usuario:senha@golpe.example/x",
    "https://loja.com.br@203.0.113.7/x",
  ];
  for (const f of formas) {
    const r = conferirEndereco(f);
    assert.equal(r.status, "lido", f);
    assert.equal(r.nivel, "forte", f);
    assert.ok(r.alertas.some((a) => a.id === "arroba"), f);
    assert.ok(!r.informacoes.length, `${f}: não pode dizer que está na lista da loja`);
    assert.match(r.alertas.find((a) => a.id === "arroba").texto, /o que vem depois dele/);
  }
  assert.equal(conferirEndereco("https://www.magazineluiza.com.br@golpe.example/").host, "golpe.example");
  assert.equal(conferirEndereco("https://loja.com.br@203.0.113.7/x").host, "203.0.113.7");
});

test("'@' depois de ?, # ou do caminho não é o caso do usuário: sem alerta de @", () => {
  for (const l of [
    "https://www.magazineluiza.com.br/busca?email=nome@exemplo.com",
    "https://www.magazineluiza.com.br/perfil@loja",
    "https://www.magazineluiza.com.br/#contato@loja",
  ]) {
    assert.equal(nivel(l), "nenhum", l);
  }
  for (const l of ["golpe.shop?x=1@magazineluiza.com.br", "golpe.shop#magazineluiza.com.br"]) {
    const r = conferirEndereco(l);
    assert.equal(r.host, "golpe.shop", l);
    assert.ok(!ids(l).includes("arroba"), l);
  }
});

test("'@' no campo de mensagem também é pego", () => {
  const r = analisarMensagem("Olha a promoção da TV: https://www.magazineluiza.com.br@golpe.example/tv corre!", BASE);
  assert.equal(r.nivel, "forte");
  assert.ok(r.encontrados.some((e) => e.id === "link-arroba"));
});

test("e-mail comum, texto e esquemas que não são site: não é endereço", () => {
  for (const t of ["contato@loja.com.br", "joao.silva@exemplo.com", "javascript:alert(1)", "palavra", "mailto:a@b.com"]) {
    assert.equal(conferirEndereco(t).status, "sem-endereco", t);
  }
  assert.equal(extrairEndereco("me escreve em joao.silva@exemplo.com ok?"), null);
  assert.equal(lerEndereco("https://203.0.113.7/x").ehIp, true);
  assert.deepEqual(ids("http://203.0.113.7/x"), ["ip"]);
});

test("mesma empresa em outro país ou com outra grafia: nunca alerta forte", () => {
  // conferidos: mercadolibre.com.ar (RDAP do NIC Argentina) e .com.mx (whois do NIC México)
  for (const l of ["mercadolibre.com.ar", "https://articulo.mercadolibre.com.ar/MLA-1", "https://www.mercadolibre.com.mx/"]) {
    assert.equal(nivel(l), "nenhum", l);
  }
  // titular oculto (mercadolibre.com) ou país não conferido: só atenção
  for (const l of ["mercadolibre.com", "mercadolibre.cl", "amazon.de", "shein.com.mx"]) {
    assert.equal(nivel(l), "atencao", l);
  }
  // a imitação continua forte
  assert.equal(nivel("mercadolibre-ofertas.com"), "forte");
  assert.equal(nivel("mercadolivri.com.br"), "forte");
});

test("marca fora da lista com 'oficial' ou 'outlet' no endereço", () => {
  assert.deepEqual(ids("marcaqualquer-oficial.com.br"), ["isca"]);
  assert.equal(nivel("marcaqualquer-outlet.com.br"), "atencao");
  assert.equal(nivel("marcaqualquer-oficial.shop"), "forte");
});

test("anúncio no campo de mensagem roda as regras de anúncio, sem alarme em conversa de família", () => {
  const anuncio = "Promoção! Videogame PS5 por R$ 799, aceitamos apenas Pix, chama no WhatsApp";
  assert.equal(analisarMensagem(anuncio, BASE).nivel, "forte");
  for (const m of [
    "Me manda o pix pra reservar a mesa do aniversário?",
    "Vó, o pix da festa eu mando amanhã",
    "Restam 3 dias para a viagem!",
  ]) {
    assert.equal(analisarMensagem(m, BASE).nivel, "nenhum", m);
  }
});

test("classes de anúncio que escapavam", () => {
  // escassez com número + prazo em minutos: atenção
  assert.equal(conferirAnuncio("Restam 4 peças! A oferta acaba em 20 minutos").nivel, "atencao");
  // perfil criado há poucas semanas + preço absurdo: forte
  assert.equal(conferirAnuncio("Loja aberta há 3 semanas. TV 60 polegadas por R$ 850").nivel, "forte");
  // pagamento antecipado para reservar + último dia: forte
  assert.equal(conferirAnuncio("Faça o depósito antecipado para garantir a sua. Último dia!").nivel, "forte");
  // produto caro a preço muito baixo, sem "de X por Y", + prazo em horas: forte
  assert.equal(conferirAnuncio("MacBook novo por R$ 990, válido por 3 horas").nivel, "forte");
  // preço absurdo + só Pix + link fora da loja: forte
  assert.equal(conferirAnuncio("iPhone 16 por R$ 700. Só aceitamos Pix. Compre em ofertas-celular.store/p").nivel, "forte");
});

test("anúncios normais continuam sem alerta forte", () => {
  for (const t of [
    "Smart TV 32\" por R$ 899 em até 10x no cartão",
    "iPhone 15 em até 12x de R$ 450 sem juros",
    "Até 70% off em toda a loja, só hoje, no site e no app",
    "Últimas 2 horas de Black Friday no site da loja",
    "Fone por R$ 99, restam poucas unidades",
    "Restaurante: reserve a sua mesa pelo aplicativo",
    "Promoção válida por 24 horas no site e no app",
  ]) {
    assert.notEqual(conferirAnuncio(t).nivel, "forte", t);
  }
});

test("aba de link: campo vazio fala de link ou anúncio; texto que não é endereço não vira resultado", () => {
  assert.match(T.VAZIO_LINK, /link ou o texto do anúncio/);
  const app = readFileSync(join(RAIZ, "js", "app.js"), "utf8");
  assert.match(app, /paragrafo\(T\.VAZIO_LINK\)/);
  assert.match(app, /r\.status === "sem-endereco" && !temAnuncio\) return mostrar\("vazio", paragrafo\(T\.SEM_ENDERECO\)\)/);
  assert.match(app, /analisarMensagem\(texto, base\)/);
});
