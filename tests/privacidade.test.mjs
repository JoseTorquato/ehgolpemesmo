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
];

test("nenhum endereço de fora, a não ser o WhatsApp e fontes oficiais citadas", () => {
  const achados = [];
  for (const { caminho, texto } of codigo()) {
    for (const m of texto.matchAll(/(https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})[^\s"'`)]*/gi)) {
      if (caminho === join("js", "compartilhar.js") && m[0].startsWith("https://wa.me/")) continue;
      if (m[1] === "https:" && FONTES_OFICIAIS.includes(m[2])) continue;
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
  assert.equal(textoParaCompartilhar(""), `${NOME_DO_SITE} Confira antes de pagar.`);
  assert.equal(textoParaCompartilhar("https://exemplo.invalid/"), `${NOME_DO_SITE} Confira antes de pagar. https://exemplo.invalid/`);
  assert.equal(URL_PUBLICA, "", "sem endereço público até a publicação ser aprovada");
  const link = linkDoWhatsApp();
  assert.ok(link.startsWith("https://wa.me/?text="));
  assert.equal(decodeURIComponent(link.split("text=")[1]), textoParaCompartilhar());
  // as funções não recebem o conteúdo colado, e a página as chama sem argumento
  assert.equal(linkDoWhatsApp.length + textoParaCompartilhar.length, 0);
  const app = readFileSync(join(RAIZ, "js", "app.js"), "utf8");
  assert.match(app, /linkDoWhatsApp\(\)/);
  assert.doesNotMatch(app, /linkDoWhatsApp\([^)]/);
});

test("o texto colado nunca vira HTML (sem innerHTML)", () => {
  const achados = codigo()
    .filter((a) => a.ext === ".js")
    .filter((a) => /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/.test(a.texto))
    .map((a) => a.caminho);
  assert.deepEqual(achados, []);
});
