// Textos do resultado, num lugar só, para revisar a linguagem de uma vez.
// Regra da casa: nunca dar garantia sobre uma mensagem ou boleto (a lista de
// frases proibidas está em tests/frases-proibidas.test.mjs). Sem sinal
// encontrado, o máximo que se diz é SEM_SINAL.

export const TITULO_SINAIS = "Sinais de alerta encontrados";
export const TITULO_FAZER = "O que fazer agora";
export const TITULO_BOLETO = "O que a linha do boleto mostra";

export const RESUMO_FORTE = "Cuidado: esta mensagem tem sinais fortes de golpe.";
// nível "atenção": sem nome de golpe e sem "sinais de alerta"
export const RESUMO_ATENCAO = "Alguns pontos para conferir antes de pagar ou responder.";
export const TITULO_CONFERIR = "Antes de pagar, confira";
export const TITULO_TAMBEM = "Também confira";
export const PASSO_DUVIDA = "Na dúvida, peça ajuda a alguém de confiança antes de fazer qualquer pagamento.";
export const RESUMO_BOLETO_ALERTA = "Cuidado: esta linha de boleto tem problemas.";
export const RESUMO_FORTE_BOLETO = "Cuidado: pagar boleto a pedido de outra pessoa é o jeito do golpe do falso parente.";


export const SEM_SINAL =
  "Nenhum sinal de alerta encontrado — mesmo assim, confirme por outro canal.";

// Passos gerais, que valem para qualquer mensagem.
export const PASSOS_GERAIS = [
  "Não pague e não clique em link antes de confirmar.",
  "Ligue para a pessoa ou para a empresa num número que você já tinha, não no número da mensagem.",
  "Na dúvida, peça ajuda a alguém de confiança antes de fazer qualquer pagamento.",
];

export const VAZIO = "Cole a mensagem ou a linha do boleto no campo acima e toque em Conferir.";

export const COLAR_SEM_PERMISSAO =
  "Não foi possível colar automaticamente. Toque e segure no campo e escolha Colar.";
