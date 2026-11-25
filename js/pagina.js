// O que toda página tem: o botão "Compartilhar no WhatsApp".
// O link leva sempre o mesmo convite genérico (js/compartilhar.js), nunca o
// que a pessoa colou.

import { linkDoWhatsApp } from "./compartilhar.js";

const botao = document.getElementById("compartilhar");
if (botao) botao.href = linkDoWhatsApp();
