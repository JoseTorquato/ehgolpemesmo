// Nada sai do aparelho: sem rede, sem CDN, sem guardar o que foi colado, e o
// compartilhamento leva só um texto genérico.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { arquivosDoSite, RAIZ } from "./arquivos.mjs";
import { linkDoWhatsApp, textoParaCompartilhar } from "../js/compartilhar.js";
import { NOME_DO_SITE, URL_PUBLICA } from "../js/config.js";

const codigo = () => arquivosDoSite([".html", ".js", ".css"]);

test("toda página bloqueia conexões pela política de segurança (CSP)", () => {
  const paginas = codigo().filter((a) => a.ext === ".html");
  assert.ok(paginas.length >= 2);
  for (const { caminho, texto } of paginas) {
    const csp = texto.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
    assert.ok(csp, `${caminho}: sem CSP`);
    for (const diretiva of ["default-src 'none'", "connect-src 'none'", "script-src 'self'", "style-src 'self'", "form-action 'none'"]) {
      assert.ok(csp[1].includes(diretiva), `${caminho}: CSP sem ${diretiva}`);
    }
  }
});

// Endereços de fora só como REFERÊNCIA a fonte oficial (texto ou link que a
// pessoa toca). Nada disso é carregado: a CSP bloqueia qualquer conexão.
const FONTES_OFICIAIS = [
  "www.bcb.gov.br",
  "www.gov.br",
  "portal.febraban.org.br",
  "faq.whatsapp.com",
  "nic.br",
  "cartilha.cert.br",
  "letsencrypt.org",
  "www.serasaexperian.com.br",
  "sistemas.procon.sp.gov.br",
  "prefeitura.pbh.gov.br",
  "www.pmvc.ba.gov.br",
  // catálogo de golpes (golpes.html): polícias, Correios e imprensa citada
  "goias.gov.br",
  "www.parana.pr.gov.br",
  "www.correios.com.br",
  "agenciabrasil.ebc.com.br",
  "www.folhape.com.br",
  "canaltech.com.br",
];

// O endereço do próprio site (prévia de link e convite do WhatsApp) e o
// código aberto no GitHub, só como texto ou link que a pessoa toca.
const DO_PROPRIO_SITE = [
  "https://josetorquato.dev/ehgolpemesmo/",
  "https://github.com/JoseTorquato/ehgolpemesmo",
];

test("nenhum endereço de fora, a não ser o WhatsApp e fontes oficiais citadas", () => {
  const achados = [];
  for (const { caminho, texto } of codigo()) {
    for (const m of texto.matchAll(/(https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})[^\s"'`)]*/gi)) {
      if (caminho === join("js", "compartilhar.js") && m[0].startsWith("https://wa.me/")) continue;
      if (m[1] === "https:" && FONTES_OFICIAIS.includes(m[2])) continue;
      if (DO_PROPRIO_SITE.some((p) => m[0].startsWith(p))) continue;
      achados.push(`${caminho}: ${m[0]}`);
    }
  }
  assert.deepEqual(achados, []);
});

test("links para fontes oficiais são só links: rel noopener noreferrer, nunca recurso", () => {
  for (const { caminho, texto } of codigo().filter((a) => a.ext === ".html")) {
    for (const m of texto.matchAll(/<(\w+)\b[^>]*\b(?:href|src)="https:\/\/[^"]+"[^>]*>/g)) {
      assert.equal(m[1], "a", `${caminho}: ${m[0]}`);
      assert.match(m[0], /rel="noopener noreferrer"/, `${caminho}: ${m[0]}`);
    }
  }
});

test("nenhuma chamada de rede nem armazenamento no código", () => {
  const proibido = /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|importScripts|serviceWorker)\b|import\s*\(/;
  const achados = codigo()
    .filter((a) => a.ext === ".js" || a.ext === ".html")
    .filter((a) => proibido.test(a.texto.replace(/\/\/.*$/gm, "")))
    .map((a) => a.caminho);
  assert.deepEqual(achados, []);
});

test("scripts e estilos só do próprio site", () => {
  for (const { caminho, texto } of codigo().filter((a) => a.ext === ".html")) {
    for (const m of texto.matchAll(/<(script|link)\b[^>]*>/g)) {
      const src = m[0].match(/(?:src|href)="([^"]+)"/);
      if (src) assert.ok(!/^[a-z]+:|^\/\//i.test(src[1]), `${caminho}: ${m[0]}`);
    }
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(texto), `${caminho}: script embutido`);
  }
});

test("o texto compartilhado é genérico e não leva o que foi colado", () => {
  assert.equal(
    textoParaCompartilhar(""),
    `${NOME_DO_SITE} Antes de pagar um boleto ou responder uma mensagem estranha, cole aqui e confira. É grátis e nada sai do seu celular.`,
  );
  assert.equal(textoParaCompartilhar("https://exemplo.invalid/"), `${textoParaCompartilhar("")} https://exemplo.invalid/`);
  assert.equal(URL_PUBLICA, "https://josetorquato.dev/ehgolpemesmo/", "endereço publicado");
  assert.ok(textoParaCompartilhar().endsWith(" https://josetorquato.dev/ehgolpemesmo/"), "o convite leva o link do site");
  const link = linkDoWhatsApp();
  assert.ok(link.startsWith("https://wa.me/?text="));
  assert.equal(decodeURIComponent(link.split("text=")[1]), textoParaCompartilhar());
  // as funções não recebem o conteúdo colado, e a página as chama sem argumento
  assert.equal(linkDoWhatsApp.length + textoParaCompartilhar.length, 0);
  const pagina = readFileSync(join(RAIZ, "js", "pagina.js"), "utf8");
  assert.match(pagina, /linkDoWhatsApp\(\)/);
  for (const arquivo of ["pagina.js", "app.js"]) {
    assert.doesNotMatch(readFileSync(join(RAIZ, "js", arquivo), "utf8"), /linkDoWhatsApp\([^)]/, arquivo);
  }
});

test("toda página tem o botão de compartilhar, o script dele e o rodapé com o código aberto", () => {
  const paginas = codigo().filter((a) => a.ext === ".html");
  for (const { caminho, texto } of paginas) {
    assert.match(texto, /<a class="botao-link whatsapp" id="compartilhar" href="#"[^>]*>Compartilhar no WhatsApp<\/a>/, caminho);
    assert.match(texto, /<script type="module" src="js\/pagina\.js"><\/script>/, caminho);
    assert.match(
      texto,
      /<p class="autoria">Feito por José Torquato · <a href="https:\/\/github\.com\/JoseTorquato\/ehgolpemesmo" rel="noopener noreferrer">código aberto<\/a><\/p>/,
      caminho,
    );
  }
});

function tamanhoDoPng(caminho) {
  const b = readFileSync(join(RAIZ, caminho));
  assert.equal(b.subarray(1, 4).toString(), "PNG", caminho);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test("prévia de link (WhatsApp): og e twitter em toda página, imagem 1200×630 do próprio site", () => {
  const meta = (texto, nome) => texto.match(new RegExp(`<meta (?:property|name)="${nome}" content="([^"]+)">`))?.[1];
  for (const { caminho, texto } of codigo().filter((a) => a.ext === ".html")) {
    for (const nome of ["og:title", "og:description", "og:image", "og:url", "twitter:card", "theme-color", "description"]) {
      assert.ok(meta(texto, nome), `${caminho}: sem ${nome}`);
    }
    assert.equal(meta(texto, "og:image"), "https://josetorquato.dev/ehgolpemesmo/img/og.png", caminho);
    assert.equal(meta(texto, "twitter:card"), "summary_large_image", caminho);
    assert.equal(meta(texto, "og:url"), `https://josetorquato.dev/ehgolpemesmo/${caminho === "index.html" ? "" : caminho}`, caminho);
    assert.match(texto, /<link rel="apple-touch-icon" href="img\/icone-180\.png">/, caminho);
  }
  assert.deepEqual(tamanhoDoPng("img/og.png"), [1200, 630]);
  assert.deepEqual(tamanhoDoPng("img/icone-180.png"), [180, 180]);
  assert.ok(readFileSync(join(RAIZ, "img", "og.png")).length < 600 * 1024, "imagem leve para o WhatsApp");
});

test("o texto colado nunca vira HTML (sem innerHTML)", () => {
  const achados = codigo()
    .filter((a) => a.ext === ".js")
    .filter((a) => /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/.test(a.texto))
    .map((a) => a.caminho);
  assert.deepEqual(achados, []);
});

test("o site só convida a colar um link quando tiver o campo de conferir link", () => {
  const paginas = codigo().filter((a) => a.ext === ".html");
  const temCampoDeLink = paginas.some((a) => /<input id="link"/.test(a.texto));
  if (temCampoDeLink) return;
  for (const { caminho, texto } of paginas) {
    assert.doesNotMatch(texto, /ou o link|e o link antes/i, caminho);
  }
  assert.doesNotMatch(readFileSync(join(RAIZ, "ferramentas", "og.svg"), "utf8"), /o link/, "ferramentas/og.svg");
});
