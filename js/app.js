// Liga a página ao motor. O que a pessoa cola fica só na memória desta aba:
// não é salvo, não é enviado, não vai para o compartilhamento.

import { validar } from "./motor.js";
import { REGRAS, SINAIS } from "./regras.js";
import { conferirLinha, explicar } from "./boleto.js";
import { conferirEndereco, FAZER_LINK, SEM_SINAL_LINK } from "./link.js";
import { analisarMensagem, conferirAnuncio } from "./anuncio.js";
import * as T from "./textos.js";

const base = validar(SINAIS, REGRAS);

const $ = (id) => document.getElementById(id);

function lista(itens) {
  const ul = document.createElement("ul");
  for (const item of itens) {
    const li = document.createElement("li");
    li.textContent = item; // textContent: o texto nunca vira HTML
    ul.append(li);
  }
  return ul;
}

function titulo(texto) {
  const h = document.createElement("h2");
  h.textContent = texto;
  return h;
}

function paragrafo(texto, classe) {
  const p = document.createElement("p");
  p.textContent = texto;
  if (classe) p.className = classe;
  return p;
}

function mostrar(nivel, ...nos) {
  const area = $("resultado");
  area.replaceChildren(...nos);
  area.dataset.nivel = nivel;
  area.hidden = false;
  area.focus();
}

function conferirMensagem(evento) {
  evento.preventDefault();
  const texto = $("mensagem").value;
  if (!texto.trim()) return mostrar("vazio", paragrafo(T.VAZIO));
  // regras da mensagem + links + regras de anúncio
  const r = analisarMensagem(texto, base);
  if (r.nivel === "nenhum") {
    return mostrar("nenhum", paragrafo(T.SEM_SINAL, "resumo"), titulo(T.TITULO_FAZER), lista(T.PASSOS_GERAIS));
  }
  const fortes = r.encontrados.filter((e) => e.nivel === "forte");
  const atencoes = r.encontrados.filter((e) => e.nivel === "atencao");
  const nos = [];
  if (fortes.length) {
    // só no nível forte: "Sinais de alerta encontrados" e o nome do golpe
    nos.push(
      paragrafo(T.RESUMO_FORTE, "resumo"),
      titulo(T.TITULO_SINAIS),
      lista(fortes.map((e) => `${e.golpe}: ${e.alerta}`)),
    );
    if (atencoes.length) nos.push(titulo(T.TITULO_TAMBEM), lista(atencoes.map((e) => e.alerta)));
    const passos = [...r.oQueFazer, ...T.PASSOS_GERAIS.filter((p) => !r.oQueFazer.includes(p))];
    nos.push(titulo(T.TITULO_FAZER), lista(passos));
  } else {
    // nível atenção: texto neutro e passos condicionais, sem acusar ninguém
    nos.push(
      paragrafo(T.RESUMO_ATENCAO, "resumo"),
      titulo(T.TITULO_CONFERIR),
      lista(atencoes.map((e) => e.alerta)),
      titulo(T.TITULO_FAZER),
      lista([...r.oQueFazer, T.PASSO_DUVIDA]),
    );
  }
  mostrar(r.nivel, ...nos);
}

// Resposta à pergunta "Alguém te pediu para pagar este boleto por ele?":
// fica só nesta variável, não é enviada nem guardada.
let pediramParaPagar = null;

function zerarPergunta() {
  pediramParaPagar = null;
  $("pediu-sim").setAttribute("aria-pressed", "false");
  $("pediu-nao").setAttribute("aria-pressed", "false");
}

function responderPergunta(sim) {
  pediramParaPagar = sim;
  $("pediu-sim").setAttribute("aria-pressed", String(sim));
  $("pediu-nao").setAttribute("aria-pressed", String(!sim));
  if (!$("resultado").hidden && $("boleto").value.trim()) conferirBoleto();
}

function conferirBoleto(evento) {
  evento?.preventDefault();
  const r = conferirLinha($("boleto").value);
  if (r.status === "vazio") return mostrar("vazio", paragrafo(T.VAZIO));
  const { destaque, golpe, alertas, informacoes, oQueFazer } = explicar(r, {
    pediramParaPagar: pediramParaPagar === true,
  });
  const nos = [];
  if (destaque) nos.push(paragrafo(destaque, "destaque"));
  if (alertas.length) {
    nos.push(paragrafo(T.RESUMO_BOLETO_ALERTA, "resumo"), titulo(T.TITULO_SINAIS), lista(alertas));
    // "Sim" junto com problema na linha: o texto neutro vem logo depois
    if (golpe) nos.push(paragrafo(golpe.alerta));
  } else if (golpe) {
    // "Sim" sozinho não diz por onde veio o pedido: nível atenção, sem nome de golpe
    nos.push(paragrafo(golpe.alerta, "resumo"));
  } else {
    nos.push(paragrafo(T.SEM_SINAL, "resumo"));
  }
  if (informacoes.length) nos.push(titulo(T.TITULO_BOLETO), lista(informacoes));
  nos.push(titulo(T.TITULO_FAZER), lista(oQueFazer));
  mostrar(alertas.length ? "forte" : golpe ? "atencao" : "nenhum", ...nos);
}

// Link e/ou texto de anúncio: o link nunca é aberto, só o texto do endereço
// é comparado com as listas embarcadas.
function conferirLinkAnuncio(evento) {
  evento.preventDefault();
  const temLink = $("link").value.trim() !== "";
  const temAnuncio = $("anuncio").value.trim() !== "";
  if (!temLink && !temAnuncio) return mostrar("vazio", paragrafo(T.VAZIO_LINK));

  const fortes = [];
  const atencoes = [];
  const informacoes = [];
  const passos = [...FAZER_LINK];
  if (temLink) {
    const r = conferirEndereco($("link").value);
    // o que não é endereço de site: aviso de campo, sem cara de resultado
    if (r.status === "sem-endereco" && !temAnuncio) return mostrar("vazio", paragrafo(T.SEM_ENDERECO));
    if (r.status === "sem-endereco") informacoes.push(T.SEM_ENDERECO);
    else {
      for (const a of r.alertas) (a.nivel === "forte" ? fortes : atencoes).push(a.texto);
      informacoes.push(...r.informacoes);
    }
  }
  if (temAnuncio) {
    const r = conferirAnuncio($("anuncio").value);
    for (const e of r.encontrados) {
      if (e.nivel === "forte") fortes.push(`${e.golpe}: ${e.alerta}`);
      else atencoes.push(e.alerta);
    }
    for (const p of r.oQueFazer) if (!passos.includes(p)) passos.push(p);
  }

  const nos = [];
  const nivel = fortes.length ? "forte" : atencoes.length ? "atencao" : "nenhum";
  if (nivel === "forte") {
    nos.push(paragrafo(T.RESUMO_FORTE_LINK, "resumo"), titulo(T.TITULO_SINAIS), lista(fortes));
    if (atencoes.length) nos.push(titulo(T.TITULO_TAMBEM), lista(atencoes));
  } else if (nivel === "atencao") {
    nos.push(paragrafo(T.RESUMO_ATENCAO, "resumo"), titulo(T.TITULO_CONFERIR), lista(atencoes));
  } else {
    nos.push(paragrafo(SEM_SINAL_LINK, "resumo"));
  }
  for (const info of informacoes) nos.push(paragrafo(info));
  nos.push(titulo(T.TITULO_FAZER), lista(passos));
  mostrar(nivel, ...nos);
}

async function colarEm(id) {
  const campo = $(id);
  try {
    campo.value = await navigator.clipboard.readText();
  } catch {
    mostrar("vazio", paragrafo(T.COLAR_SEM_PERMISSAO));
  }
  campo.focus();
}

const ABAS = ["mensagem", "boleto", "link"];

// Abas (role="tab"): a escolhida fica marcada e é a única na ordem do Tab;
// as setas mudam de aba, como num controle de abas comum.
function escolher(qual, { focarCampo = true } = {}) {
  for (const nome of ABAS) {
    const ativo = nome === qual;
    const aba = $(`aba-${nome}`);
    aba.setAttribute("aria-selected", String(ativo));
    aba.tabIndex = ativo ? 0 : -1;
    $(`form-${nome}`).hidden = !ativo;
  }
  $("resultado").hidden = true;
  if (focarCampo) $(qual).focus();
}

for (const nome of ABAS) {
  $(`aba-${nome}`).addEventListener("keydown", (e) => {
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!passo && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = ABAS.indexOf(nome);
    const proxima = e.key === "Home" ? ABAS[0] : e.key === "End" ? ABAS.at(-1) : ABAS[(i + passo + ABAS.length) % ABAS.length];
    escolher(proxima, { focarCampo: false });
    $(`aba-${proxima}`).focus();
  });
}

$("aba-mensagem").addEventListener("click", () => escolher("mensagem"));
$("aba-boleto").addEventListener("click", () => escolher("boleto"));
$("form-mensagem").addEventListener("submit", conferirMensagem);
$("form-boleto").addEventListener("submit", conferirBoleto);
$("aba-link").addEventListener("click", () => escolher("link"));
$("form-link").addEventListener("submit", conferirLinkAnuncio);
$("colar-link").addEventListener("click", () => colarEm("link"));
$("colar-anuncio").addEventListener("click", () => colarEm("anuncio"));
for (const id of ["link", "anuncio"]) $(id).addEventListener("input", () => ($("resultado").hidden = true));
$("colar-mensagem").addEventListener("click", () => colarEm("mensagem"));
$("colar-boleto").addEventListener("click", () => {
  zerarPergunta();
  colarEm("boleto");
});
// outro boleto: zera a resposta e esconde o resultado do boleto anterior
$("boleto").addEventListener("input", () => {
  zerarPergunta();
  $("resultado").hidden = true;
});
$("pediu-sim").addEventListener("click", () => responderPergunta(true));
$("pediu-nao").addEventListener("click", () => responderPergunta(false));
