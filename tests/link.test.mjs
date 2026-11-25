// Conferir link e anúncio (Black Friday): links e anúncios de golpe montados
// a partir dos roteiros da pesquisa, e links e anúncios normais, que não
// podem receber alerta forte.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analisarComLink,
  conferirEndereco,
  decodificarPunycode,
  distancia,
  dominioRegistravel,
  extrairEndereco,
  SEM_SINAL_LINK,
} from "../js/link.js";
import { conferirAnuncio, precoCaiDemais } from "../js/anuncio.js";
import { CONFERIDO_EM, LOJAS } from "../js/dados/lojas.js";
import { analisar, normalizar, validar } from "../js/motor.js";
import { REGRAS, SINAIS } from "../js/regras.js";

const nivel = (l) => conferirEndereco(l).nivel;
const ids = (l) => conferirEndereco(l).alertas.map((a) => a.id).sort();

test("sem sinal no link: a frase combinada, que não garante nada", () => {
  assert.equal(
    SEM_SINAL_LINK,
    "Não encontramos sinais de alerta, mas isso não garante nada — entre pelo app ou digitando o endereço da loja.",
  );
});

test("os 5 links do parecer do Revisor deixam de dar 'nenhum', menos o gov.br", () => {
  assert.equal(nivel("https://enel-pagamento.site/2via"), "atencao");
  assert.equal(nivel("bradesco-seguranca.online/atualizar"), "atencao");
  assert.deepEqual(ids("http://bit.ly/3xYz9"), ["encurtador"]);
  assert.equal(nivel("magalu-blackfriday-90off.shop"), "forte");
  assert.equal(nivel("https://www.gov.br/inss"), "nenhum");
});

test("link colado no campo de MENSAGEM também é conferido", () => {
  const base = validar(SINAIS, REGRAS);
  const r = (t) => analisarComLink(t, base, analisar);
  assert.equal(r("magalu-blackfriday-90off.shop").nivel, "forte");
  assert.equal(r("http://bit.ly/3xYz9").nivel, "atencao");
  assert.equal(r("Olha que promoção: https://www.magazineluiza.com.br/tv/p/123").nivel, "nenhum");
  assert.equal(r("Bom dia! Já chegou em casa?").nivel, "nenhum");
  // as regras da mensagem continuam valendo junto com as do link
  const misto = r("Oi mãe, troquei de número. Faz um pix pra mim hoje? Te devolvo amanhã. Paga por aqui: bit.ly/abc");
  assert.equal(misto.nivel, "forte");
  assert.ok(misto.encontrados.some((e) => e.id === "link-encurtador"));
});

test("endereços que imitam lojas: alerta forte", () => {
  for (const l of [
    "magalu-blackfriday-90off.shop",
    "magalu.ofertas-x.com",
    "www.magazineluiza.com.br.golpe.xyz",
    "amazom.com.br",
    "arnericanas.com.br",
    "mercadolivre-oficial.com",
    "casasbahia.shop",
    "drogasil-promo.com.br",
    "shopee-br.top",
    "lojasrenner-black.com",
    "extra-ofertas.com",
    "https://аmazon.com.br/oferta", // "а" cirílico
    "https://xn--amazn-mye.com",
  ]) {
    assert.equal(nivel(l), "forte", l);
  }
  assert.deepEqual(ids("magalu.ofertas-x.com"), ["marca-subdominio"]);
  assert.deepEqual(ids("https://аmazon.com.br/oferta"), ["parecido", "punycode"]);
});

test("encurtador, letra especial e terminação incomum sozinhos: só atenção", () => {
  assert.deepEqual(ids("https://tinyurl.com/abc"), ["encurtador"]);
  assert.equal(nivel("https://tinyurl.com/abc"), "atencao");
  assert.deepEqual(ids("https://xn--caf-dma.com.br"), ["punycode"]); // café.com.br
  assert.equal(nivel("https://xn--caf-dma.com.br"), "atencao");
  assert.deepEqual(ids("minhaloja.store"), ["terminacao"]);
  assert.equal(nivel("minhaloja.store"), "atencao");
});

test("todo domínio da lista de lojas passa sem alerta, com e sem www e caminho", () => {
  for (const loja of LOJAS) {
    for (const d of loja.dominios) {
      for (const l of [d, `www.${d}`, `https://www.${d}/produto/123?x=1`]) {
        const r = conferirEndereco(l);
        assert.equal(r.nivel, "nenhum", l);
        assert.match(r.informacoes[0], new RegExp(`lista de endereços da loja ${loja.marca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), l);
      }
    }
  }
});

test("links normais (lojas, bancos, notícias, governo) não recebem alerta forte", () => {
  const normais = [
    "globo.com", "g1.globo.com", "extra.globo.com", "uol.com.br", "folha.uol.com.br", "bb.com.br",
    "caixa.gov.br", "itau.com.br", "nubank.com.br", "correios.com.br", "olx.com.br", "ifood.com.br",
    "netflix.com", "google.com", "youtube.com", "instagram.com", "facebook.com", "whatsapp.com",
    "mercadopago.com.br", "picpay.com", "linkedin.com", "estadao.com.br", "receita.fazenda.gov.br",
    "renner.com.br", "naturalmente.com.br", "amazonas.am.gov.br", "horas-extra.com.br", "havana.com.br",
    "zattini.com.br", "panvel.com", "booking.com", "decolar.com", "pt.wikipedia.org/wiki/Black_Friday",
    "amazon.com", "mercadolivre.com",
  ];
  for (const l of normais) assert.notEqual(nivel(l), "forte", l);
  // nenhum sinal na maioria; o mesmo nome com outra terminação é só atenção
  assert.deepEqual(ids("amazon.com"), ["outra-terminacao"]);
  assert.equal(nivel("renner.com.br"), "nenhum", "renner.com.br é de outra empresa: não é imitação da Renner");
});

test("entrada sem endereço, e-mail e vazio", () => {
  assert.equal(conferirEndereco("").status, "vazio");
  assert.equal(conferirEndereco("sem link aqui").status, "sem-endereco");
  assert.equal(conferirEndereco("contato@loja.com.br").status, "sem-endereco");
  assert.equal(extrairEndereco("veja em https://loja.com.br/x hoje"), "https://loja.com.br/x");
});

test("peças: distância, domínio registrável e Punycode", () => {
  assert.equal(distancia("magalu", "magalu"), 0);
  assert.equal(distancia("amazom", "amazon"), 1);
  assert.equal(distancia("mgaalu", "magalu"), 1); // letras trocadas de lugar
  assert.equal(dominioRegistravel("www.ofertas.loja.com.br"), "loja.com.br");
  assert.equal(dominioRegistravel("magalu.ofertas-x.com"), "ofertas-x.com");
  assert.equal(decodificarPunycode("xn--caf-dma"), "café");
  assert.equal(decodificarPunycode("xn--mazon-3ve"), "аmazon");
});

test("lista de lojas: domínio único, titular conferido e data", () => {
  assert.equal(CONFERIDO_EM, "25/11/2026");
  const vistos = new Set();
  for (const l of LOJAS) {
    assert.ok(l.marca && l.titular, l.marca);
    for (const d of l.dominios) {
      assert.ok(!vistos.has(d), `repetido: ${d}`);
      vistos.add(d);
      assert.match(d, /^[a-z0-9-]+(\.[a-z]+)+$/, d);
    }
  }
  assert.ok(LOJAS.length >= 25);
});

// ---- anúncio ---------------------------------------------------------------

const nivelAnuncio = (t) => conferirAnuncio(t).nivel;

test("anúncios com sinais de golpe: alerta forte", () => {
  for (const t of [
    "PROMOÇÃO BLACK FRIDAY!!! iPhone 15 de R$ 7.999 por R$ 1.299. Pagamento somente via Pix. Corre que acaba hoje!",
    "Nosso perfil antigo foi hackeado, esse é o perfil novo da loja. Air fryer 80% off, chama no direct",
    "TV 55 polegadas por apenas R$ 499! Compre aqui: https://magalu-blackfriday-90off.shop",
    "Últimas unidades! Só hoje: notebook com 70% de desconto. Pagamento apenas no Pix",
    "Liquidação total, preço de custo. Pedidos pelo WhatsApp wa.me/5511999999999",
    "Oferta Casas Bahia: geladeira de 3.500 por 990, link: casasbahia-ofertas.online",
    "Perdemos nossa conta, essa é a página nova. Aceitamos somente Pix.",
  ]) {
    assert.equal(nivelAnuncio(t), "forte", t);
  }
});

test("anúncios com um sinal só: atenção, sem acusar", () => {
  for (const t of [
    "Smart TV com 80% de desconto na Black Friday",
    "Aceitamos apenas Pix",
    "Perfil novo da loja, sigam a gente!",
    "Gostou? Chama no WhatsApp que a gente fecha",
    "Oferta relâmpago: fone bluetooth 25% off, termina em 2 horas, estoque limitado",
  ]) {
    assert.equal(nivelAnuncio(t), "atencao", t);
  }
});

test("anúncios normais de Black Friday: nunca alerta forte", () => {
  const normais = [
    "Black Friday Magazine Luiza: Smart TV 50\" de R$ 2.999 por R$ 2.299 no Pix. Confira em magazineluiza.com.br",
    "Até 40% off em eletrodomésticos. 10% de desconto no Pix. Só hoje!",
    "Últimas unidades do tênis com 30% de desconto na Netshoes",
    "Frete grátis acima de R$ 199 em todo o site. Promoção válida até domingo.",
    "Air fryer de R$ 499 por R$ 349 na Amazon: https://www.amazon.com.br/dp/B0XXXX",
    "Cupom BLACK10 dá 10% de desconto no app da Shopee",
    "Pague com Pix e ganhe 5% de desconto. Parcelamos em até 10x sem juros no cartão.",
    "Oferta relâmpago: fone bluetooth 25% off, termina em 2 horas, estoque limitado",
    "Black Friday Americanas: notebook de 3.999 por 3.199 em americanas.com.br",
    "Na KaBuM!, placa de vídeo com até 35% off. Só no site e no app.",
  ];
  for (const t of normais) assert.notEqual(nivelAnuncio(t), "forte", t);
  // desconto no Pix, sozinho, não é sinal (CERT.br)
  assert.equal(nivelAnuncio("Pague com Pix e ganhe 5% de desconto."), "nenhum");
  assert.equal(nivelAnuncio("Até 40% off em eletrodomésticos. 10% de desconto no Pix. Só hoje!"), "nenhum");
});

test("preço que cai demais: de X por Y com Y até 40% de X", () => {
  const p = (t) => precoCaiDemais(normalizar(t));
  assert.ok(p("de R$ 7.999 por R$ 1.299"));
  assert.ok(p("de 3.500 por 990"));
  assert.ok(!p("de R$ 2.999 por R$ 2.299"));
  assert.ok(!p("de R$ 499 por R$ 349"));
  assert.ok(!p("das 9h por 2 horas"));
});

test("motor: sinal posto por código precisa existir", () => {
  const base = validar(SINAIS, REGRAS);
  assert.throws(() => analisar("oi", base, ["nao-existe"]), /sinal desconhecido/);
});
