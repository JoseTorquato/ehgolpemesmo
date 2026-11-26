// Para quem tem dificuldade de leitura: letra grande, contraste AA, alvos
// grandes, rótulos e aviso ao leitor de tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./arquivos.mjs";

const ler = (...p) => readFileSync(join(RAIZ, ...p), "utf8");
const css = ler("css", "estilo.css");
const index = ler("index.html");

function cor(nome) {
  const m = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `variável --${nome} não encontrada`);
  return m[1];
}

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [texto, fundo]: todo par usado no CSS
const PARES = [
  ["texto", "fundo"],
  ["texto-suave", "fundo"],
  ["primario-texto", "primario"],
  ["secundario-texto", "secundario-fundo"],
  ["alerta-texto", "alerta-fundo"],
  ["whatsapp-texto", "whatsapp"],
  ["primario", "fundo"], // links
  // topo e rodapé, sobre as duas pontas do gradiente do fundo
  ["hero-texto", "hero-1"],
  ["hero-texto", "hero-2"],
  ["hero-suave", "hero-1"],
  ["hero-suave", "hero-2"],
  ["marca", "hero-1"],
  ["marca", "hero-2"],
  ["hero-texto", "selo-fundo"],
  // v2: ação principal, abas, resultado por nível e fundo da página
  ["acao-texto", "acao"],
  ["secundario-texto", "fundo"], // "Colar" e abas não escolhidas sobre branco
  ["primario", "secundario-fundo"], // ícones e abas sobre o trilho
  ["forte-texto", "forte-fundo"],
  ["atencao-texto", "atencao-fundo"],
  ["nenhum-texto", "nenhum-fundo"],
  ["fundo", "forte-cor"], // ícone "!" do nível forte
  ["fundo", "atencao-cor"],
  ["fundo", "nenhum-cor"],
  ["texto", "pagina"],
  ["texto-suave", "pagina"],
  ["primario", "pagina"],
  ["texto-suave", "secundario-fundo"],
  ["borda", "fundo"], // borda do "Colar" e dos campos (componente: mínimo 3:1; aqui passa 4,5:1)
];

test("contraste AA (4,5:1) em todos os pares de cor", () => {
  for (const [texto, fundo] of PARES) {
    const c = contraste(cor(texto), cor(fundo));
    assert.ok(c >= 4.5, `--${texto} sobre --${fundo}: ${c.toFixed(2)}:1`);
  }
});

test("letra base de pelo menos 18px, em unidade que respeita o aparelho", () => {
  const m = css.match(/html\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)%/);
  assert.ok(m, "font-size do html em %");
  assert.ok(Number(m[1]) >= 112.5, `base de ${(16 * m[1]) / 100}px`);
});

test("botões com pelo menos 44px de altura", () => {
  const m = css.match(/button,\s*\.botao-link\s*\{[^}]*min-height:\s*(\d+(?:\.\d+)?)rem/);
  assert.ok(m, "min-height dos botões em rem");
  assert.ok(Number(m[1]) * 16 >= 44);
});

test("página pronta para celular e leitor de tela", () => {
  assert.match(index, /<html lang="pt-BR">/);
  assert.match(index, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(index, /id="resultado"[^>]*aria-live="polite"/);
  assert.match(index, /class="pular" href="#principal"/);
  // abas de verdade: "escolha o tipo", não botão de ação
  assert.match(index, /<div class="abas" role="tablist" aria-labelledby="abas-titulo">/);
  for (const [id, nome] of [["mensagem", "Mensagem"], ["boleto", "Boleto"], ["link", "Link ou anúncio"]]) {
    assert.match(
      index,
      new RegExp(`<button type="button" role="tab" id="aba-${id}" aria-selected="(true|false)" aria-controls="form-${id}"[^>]*>.*<span>${nome}</span></button>`),
      id,
    );
    assert.match(index, new RegExp(`<form id="form-${id}" class="painel" role="tabpanel" aria-labelledby="aba-${id}"`), id);
  }
  assert.equal((index.match(/aria-selected="true"/g) ?? []).length, 1, "uma aba escolhida");
  // uma só ação principal por formulário
  assert.equal((index.match(/<button type="submit" class="conferir">/g) ?? []).length, 3);
  const app = ler("js", "app.js");
  assert.match(app, /aba\.setAttribute\("aria-selected", String\(ativo\)\)/);
  assert.match(app, /ArrowRight/);
  for (const id of ["mensagem", "boleto", "link", "anuncio"]) {
    assert.match(index, new RegExp(`<label for="${id}">[^<]+</label>`), `campo ${id} sem rótulo`);
  }
  // sem bloqueio de zoom
  assert.doesNotMatch(index, /user-scalable=no|maximum-scale=1\b/);
});

// Prazos que podem aparecer na página "Já caí", cada um com a fonte oficial.
const PRAZOS_CONFIRMADOS = {
  "80 dias": "BCB, Guia do MED v4.4, seções 4.2.4 e 6 (prazo para contestar)",
};

test("a página Já caí só tem prazo confirmado e cada parte cita a fonte", () => {
  const pagina = ler("ja-cai.html");
  assert.match(pagina, /<h1>Já caí, e agora\?<\/h1>/);
  const prazos = [...pagina.matchAll(/\d+\s*(horas?|dias?|minutos?)\b/gi)].map((m) => m[0]);
  for (const p of prazos) assert.ok(p in PRAZOS_CONFIRMADOS, `prazo sem fonte conferida: ${p}`);
  assert.ok(prazos.includes("80 dias"));
  const secoes = pagina.split("<section").slice(1);
  assert.ok(secoes.length >= 4);
  for (const s of secoes) assert.match(s, /class="fonte">Fontes?: /, s.slice(0, 80));
  assert.match(pagina, /não pode exigir boletim de ocorrência/);
  assert.match(pagina, /mandou por engano/);
  assert.match(pagina, /desacordo comercial/);
});

test("Black Friday: os sete cuidados, cada um com fonte, e a lista do Procon-SP só como link", () => {
  const pagina = ler("black-friday.html");
  assert.match(pagina, /<h1>Black Friday: antes de comprar<\/h1>/);
  const secoes = pagina.split("<section").slice(1);
  assert.equal(secoes.filter((s) => /<h2 id="\w+">\d\. /.test(s)).length, 7);
  for (const s of secoes) assert.match(s, /class="fonte">Fontes?/, s.slice(0, 80));
  assert.match(pagina, /href="https:\/\/sistemas\.procon\.sp\.gov\.br\/evitesite\/list\/evitesites\.php"/);
  assert.match(pagina, /não estar na lista não quer dizer nada/);
  assert.match(pagina, /href="ja-cai\.html"/);
  assert.match(pagina, /href="index\.html">conferidor/);
  assert.match(index, /href="black-friday\.html"/);
});

test("botão Voltar com pelo menos 44px, resultado com nome e favicon local", () => {
  const m = css.match(/\.voltar a\s*\{[^}]*min-height:\s*(\d+(?:\.\d+)?)rem/);
  assert.ok(m, "min-height do .voltar a em rem");
  assert.ok(Number(m[1]) * 20 >= 44, `${Number(m[1]) * 20}px`);
  assert.match(index, /id="resultado"[^>]*aria-label="[^"]+"/);
  for (const pagina of ["index.html", "ja-cai.html", "black-friday.html"]) {
    assert.match(ler(pagina), /<link rel="icon" href="favicon\.svg"/, pagina);
  }
  assert.match(ler("favicon.svg"), /^<svg /);
});

test("pergunta do boleto: botões grandes e acessíveis, sem formulário enviado", () => {
  assert.match(index, /<fieldset class="pergunta">\s*<legend>Alguém te pediu para pagar este boleto por ele\?<\/legend>/);
  for (const id of ["pediu-sim", "pediu-nao"]) {
    assert.match(index, new RegExp(`<button type="button" id="${id}"[^>]*aria-pressed="false"`), id);
  }
  // a resposta fica numa variável do script; nada de input enviado
  assert.doesNotMatch(index, /name="pediu/);
  assert.match(ler("js", "app.js"), /let pediramParaPagar = null;/);
});

test("pergunta do boleto: Sim é nível atenção e a resposta zera com outro boleto", () => {
  const app = ler("js", "app.js");
  assert.match(app, /alertas\.length \? "forte" : golpe \? "atencao" : "nenhum"/);
  assert.match(app, /\$\("boleto"\)\.addEventListener\("input", \(\) => \{\s*zerarPergunta\(\);\s*\$\("resultado"\)\.hidden = true;/);
  assert.doesNotMatch(ler("js", "textos.js"), /é o jeito do golpe/);
});

// Texto a 200% (rem = 40px) numa tela de 320px: as folgas laterais dos
// cartões e dos botões não podem crescer só em rem, senão o conteúdo não cabe
// e a página rola para o lado. A medição num navegador de verdade está em
// ferramentas/medir-rolagem.mjs.
function avaliarLargura(expressao, { rem, vw, cem }) {
  const e = expressao.trim();
  const unidade = (v) => {
    const m = v.trim().match(/^(-?\d*\.?\d+)(rem|vw|px)$/);
    assert.ok(m, `valor não entendido: ${v}`);
    return Number(m[1]) * { rem, vw: vw / 100, px: 1 }[m[2]];
  };
  const args = (s) => {
    const partes = [];
    let nivel = 0, atual = "";
    for (const c of s) {
      if (c === "(") nivel++;
      if (c === ")") nivel--;
      if (c === "," && nivel === 0) { partes.push(atual); atual = ""; } else atual += c;
    }
    return [...partes, atual];
  };
  const fn = e.match(/^(min|max)\((.*)\)$/);
  if (fn) return Math[fn[1]](...args(fn[2]).map((a) => avaliarLargura(a, { rem, vw, cem })));
  if (/^\(100% - [\d.]+rem\) \/ 2$/.test(e)) return (cem - unidade(e.match(/- ([\d.]+rem)/)[1])) / 2;
  return unidade(e);
}

test("texto a 200% em 320 e 375px: folgas laterais dos cartões e botões cabem na tela", () => {
  const bloco = (seletor) => {
    const m = css.replace(/\r\n/g, "\n").match(seletor);
    assert.ok(m, `bloco ${seletor} não encontrado`);
    return m[1];
  };
  const prop = (b, nome) => b.match(new RegExp(String.raw`(?:^|[;\s])${nome}:\s*([^;]+);`))?.[1];
  const cartao = bloco(/\nmain,\s*\.compartilhar\s*\{([^}]*)\}/);
  const botao = bloco(/\nbutton,\s*\.botao-link\s*\{([^}]*)\}/);
  for (const largura of [320, 375]) {
    const ctx = { rem: 40, vw: largura, cem: largura };
    const margem = avaliarLargura(prop(cartao, "margin-left"), ctx) + avaliarLargura(prop(cartao, "margin-right"), ctx);
    const padCartao = 2 * avaliarLargura(prop(cartao, "padding").split(/\s+(?![^(]*\))/)[1], ctx);
    const padBotao = 2 * avaliarLargura(prop(botao, "padding").split(/\s+(?![^(]*\))/)[1], ctx);
    const util = largura - margem - padCartao - padBotao;
    // "mensagem" e "conferência", em negrito a 40px, precisam de ~230px
    assert.ok(util >= 230, `${largura}px a 200%: sobram ${util.toFixed(0)}px para o texto do botão`);
  }
  // nenhuma regra de tela estreita volta a pôr folga lateral só em rem
  assert.doesNotMatch(css, /@media[^{]*max-width[^{]*\{\s*main/);
});
