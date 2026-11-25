// Compartilhar no WhatsApp.
//
// A função NÃO recebe o texto colado pela pessoa, de propósito: o que vai
// para o WhatsApp é sempre o mesmo convite genérico, com o link do site.
// Mensagem ou boleto colados nunca saem do aparelho.

import { NOME_DO_SITE, URL_PUBLICA } from "./config.js";

export const CONVITE =
  `${NOME_DO_SITE} Antes de pagar um boleto ou responder uma mensagem estranha, cole aqui e confira. ` +
  "É grátis e nada sai do seu celular.";

export function textoParaCompartilhar(url = URL_PUBLICA) {
  return url ? `${CONVITE} ${url}` : CONVITE;
}

/** Link que abre o WhatsApp com o convite. Só é aberto se a pessoa tocar no botão. */
export function linkDoWhatsApp(url = URL_PUBLICA) {
  return "https://wa.me/?text=" + encodeURIComponent(textoParaCompartilhar(url));
}
