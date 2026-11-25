// Compartilhar no WhatsApp.
//
// A função NÃO recebe o texto colado pela pessoa, de propósito: o que vai
// para o WhatsApp é sempre a mesma frase genérica. Mensagem ou boleto
// colados nunca saem do aparelho.

import { NOME_DO_SITE, URL_PUBLICA } from "./config.js";

export function textoParaCompartilhar(url = URL_PUBLICA) {
  const base = `${NOME_DO_SITE} Confira antes de pagar.`;
  return url ? `${base} ${url}` : base;
}

/** Link que abre o WhatsApp com o texto genérico. Só é aberto se a pessoa tocar no botão. */
export function linkDoWhatsApp(url = URL_PUBLICA) {
  return "https://wa.me/?text=" + encodeURIComponent(textoParaCompartilhar(url));
}
