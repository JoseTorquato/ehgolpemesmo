// Liga a página ao motor. O que a pessoa cola fica só na memória desta aba:
// não é salvo, não é enviado, não vai para o compartilhamento.

import { analisar, validarRegras } from "./motor.js";
import { REGRAS } from "./regras.js";
import { conferirLinha } from "./boleto.js";
import { linkDoWhatsApp } from "./compartilhar.js";
import * as T from "./textos.js";

const regras = validarRegras(REGRAS);

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

function mostrar(...nos) {
  const area = $("resultado");
  area.replaceChildren(...nos);
  area.hidden = false;
  area.focus();
}

function conferirMensagem(evento) {
  evento.preventDefault();
  const texto = $("mensagem").value;
  if (!texto.trim()) return mostrar(paragrafo(T.VAZIO));
  const { encontrados, oQueFazer } = analisar(texto, regras);
  if (encontrados.length === 0) {
    return mostrar(
      paragrafo(T.SEM_SINAL, "sem-sinal"),
      titulo(T.TITULO_FAZER),
      lista(T.PASSOS_GERAIS),
    );
  }
  mostrar(
    titulo(T.TITULO_SINAIS),
    lista(encontrados.map((e) => `${e.golpe}: ${e.alerta}`)),
    titulo(T.TITULO_FAZER),
    lista([...oQueFazer, ...T.PASSOS_GERAIS.filter((p) => !oQueFazer.includes(p))]),
  );
}

function conferirBoleto(evento) {
  evento.preventDefault();
  const { status } = conferirLinha($("boleto").value);
  if (status === "vazio") return mostrar(paragrafo(T.VAZIO));
  mostrar(paragrafo(T.BOLETO_INDISPONIVEL), titulo(T.TITULO_FAZER), lista(T.PASSOS_GERAIS));
}

async function colarEm(id) {
  const campo = $(id);
  try {
    campo.value = await navigator.clipboard.readText();
  } catch {
    mostrar(paragrafo(T.COLAR_SEM_PERMISSAO));
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
