// Liga a página ao motor. O que a pessoa cola fica só na memória desta aba:
// não é salvo, não é enviado, não vai para o compartilhamento.

import { analisar, validar } from "./motor.js";
import { REGRAS, SINAIS } from "./regras.js";
import { conferirLinha, explicar } from "./boleto.js";
import { linkDoWhatsApp } from "./compartilhar.js";
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
  const r = analisar(texto, base);
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

function conferirBoleto(evento) {
  evento.preventDefault();
  const r = conferirLinha($("boleto").value);
  if (r.status === "vazio") return mostrar("vazio", paragrafo(T.VAZIO));
  const { alertas, informacoes, oQueFazer } = explicar(r);
  const nos = [];
  if (alertas.length) {
    nos.push(paragrafo(T.RESUMO_BOLETO_ALERTA, "resumo"), titulo(T.TITULO_SINAIS), lista(alertas));
  } else {
    nos.push(paragrafo(T.SEM_SINAL, "resumo"));
  }
  if (informacoes.length) nos.push(titulo(T.TITULO_BOLETO), lista(informacoes));
  nos.push(titulo(T.TITULO_FAZER), lista(oQueFazer));
  mostrar(alertas.length ? "forte" : "nenhum", ...nos);
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

function escolher(qual) {
  for (const nome of ["mensagem", "boleto"]) {
    const ativo = nome === qual;
    $(`aba-${nome}`).setAttribute("aria-pressed", String(ativo));
    $(`form-${nome}`).hidden = !ativo;
  }
  $("resultado").hidden = true;
  $(qual).focus();
}

$("aba-mensagem").addEventListener("click", () => escolher("mensagem"));
$("aba-boleto").addEventListener("click", () => escolher("boleto"));
$("form-mensagem").addEventListener("submit", conferirMensagem);
$("form-boleto").addEventListener("submit", conferirBoleto);
$("colar-mensagem").addEventListener("click", () => colarEm("mensagem"));
$("colar-boleto").addEventListener("click", () => colarEm("boleto"));
$("compartilhar").href = linkDoWhatsApp();
