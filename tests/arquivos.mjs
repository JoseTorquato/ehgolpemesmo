// Lista os arquivos do site (o que vai para o navegador e a documentação).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const IGNORAR = new Set([".git", "node_modules", "tests"]);

function percorrer(pasta) {
  const saida = [];
  for (const nome of readdirSync(pasta)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) saida.push(...percorrer(caminho));
    else saida.push(caminho);
  }
  return saida;
}

/** [{caminho, ext, texto}] dos arquivos de texto do site, fora a pasta de testes. */
export function arquivosDoSite(extensoes = [".html", ".js", ".css", ".md", ".json"]) {
  return percorrer(RAIZ)
    .filter((c) => extensoes.includes(extname(c)))
    .map((c) => ({ caminho: relative(RAIZ, c), ext: extname(c), texto: readFileSync(c, "utf8") }));
}
