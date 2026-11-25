// Mede rolagem lateral das páginas num navegador de verdade (Edge ou Chrome,
// sem janela), a 375 e 320 px, com o texto a 100% e a 200%.
//
//   node ferramentas/medir-rolagem.mjs
//
// Serve a pasta do site em 127.0.0.1 numa porta livre, abre cada página e
// compara scrollWidth com a largura da tela. Sai com erro se alguma página
// rolar para o lado. Caminho do navegador: variável NAVEGADOR, ou o padrão
// do Edge/Chrome no Windows, Linux e macOS.
//
// Não faz parte do `node --test` porque precisa de um navegador instalado.

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const PAGINAS = ["index.html", "black-friday.html", "ja-cai.html"];
const LARGURAS = [375, 320];
const ESCALAS = [1, 2]; // texto a 100% e a 200%

const CANDIDATOS = [
  process.env.NAVEGADOR,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/microsoft-edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const navegador = CANDIDATOS.find((c) => existsSync(c));
if (!navegador) {
  console.error("Navegador não encontrado. Defina NAVEGADOR com o caminho do Edge ou do Chrome.");
  process.exit(2);
}

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const servidor = createServer((req, res) => {
  const caminho = normalize(join(RAIZ, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!caminho.startsWith(normalize(RAIZ)) || !existsSync(caminho)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TIPOS[extname(caminho)] ?? "application/octet-stream" });
  res.end(readFileSync(caminho));
});
await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const site = `http://127.0.0.1:${servidor.address().port}/`;

const porta = 9222 + Math.floor(Math.random() * 1000);
const perfil = mkdtempSync(join(tmpdir(), "medir-rolagem-"));
const proc = spawn(navegador, ["--headless=new", `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

let alvo;
for (let i = 0; i < 75 && !alvo; i++) {
  await esperar(200);
  try {
    alvo = (await (await globalThis.fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === "page");
  } catch {}
}
if (!alvo) {
  console.error("Não consegui falar com o navegador.");
  process.exit(2);
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pendentes = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (pendentes.has(m.id)) {
    pendentes.get(m.id)(m.result);
    pendentes.delete(m.id);
  }
});
const cmd = (method, params = {}) =>
  new Promise((r) => {
    pendentes.set(++id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
const avaliar = async (expressao) => (await cmd("Runtime.evaluate", { expression: expressao, returnByValue: true })).result.value;

await cmd("Page.enable");
let falhas = 0;
for (const pagina of PAGINAS) {
  for (const largura of LARGURAS) {
    for (const escala of ESCALAS) {
      await cmd("Emulation.setDeviceMetricsOverride", { width: largura, height: 800, deviceScaleFactor: 1, mobile: true });
      await cmd("Page.navigate", { url: site + pagina });
      await esperar(800);
      // texto a 200%: dobra o tamanho da letra da página (o CSS usa 125% = 20px)
      if (escala !== 1) await avaliar(`document.documentElement.style.fontSize = "${125 * escala}%"`);
      await esperar(200);
      const m = await avaliar("({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })");
      const ok = m.s <= m.c;
      if (!ok) falhas++;
      console.log(`${ok ? "ok  " : "ROLA"} ${pagina.padEnd(18)} ${largura}px texto ${escala * 100}%: scrollWidth ${m.s} / largura ${m.c}`);
    }
  }
}
ws.close();
proc.kill();
servidor.close();
process.exit(falhas ? 1 : 0);
