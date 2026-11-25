// Sinais e regras dos golpes: só dados, sem código. Formato em js/motor.js.
//
// Base: pesquisa-v0.1 (25/11/2026). Os ROTEIROS dos golpes vêm de fontes
// oficiais: Glossário de Tipologias de Fraudes e Golpes Digitais (MJSP +
// Febraban, out/2025), Polícia Civil de Goiás, Febraban, Banco Central e
// WhatsApp. Os PADRÕES de texto abaixo são derivados desses roteiros; não são
// citações oficiais. Cada regra tem testes com mensagens de golpe e com
// mensagens normais (tests/regras.test.mjs).

// ---- falso parente (glossário MJSP/Febraban nº 23 e 27; Polícia Civil de Goiás)

const FALSO_PARENTE = "Falso parente ou amigo pedindo dinheiro";

const FAZER_FALSO_PARENTE = [
  "Ligue para o seu parente no número ANTIGO, aquele que você já tinha salvo. Nunca ligue nem responda pelo número que pediu o dinheiro.",
  "Faça uma pergunta que só ele saberia responder, ou fale com outro parente para confirmar.",
  "Não faça Pix nem transferência para a conta de outra pessoa.",
  "Combine com a família uma palavra-chave para pedidos de dinheiro.",
];

// ---- falsa central do banco (glossário nº 8 e nº 36; Febraban 01/07/2026)

const FALSA_CENTRAL = "Falsa central do banco";

const FAZER_FALSA_CENTRAL = [
  "Desligue ou pare de responder. O banco não pede senha, código, transferência para \"conta segura\" nem instalação de aplicativo.",
  "Ligue você para o banco, no número que está no verso do cartão ou no site oficial, de preferência de outro telefone.",
];

// ---- Pix errado + devolução (glossário nº 28; BCB, Guia do MED, seção 3.1)

const PIX_ERRADO = "Pix \"por engano\" com pedido de devolução";

const FAZER_PIX_ERRADO = [
  "Não faça um Pix novo para outra chave ou outra conta.",
  "Se o dinheiro realmente entrou na sua conta, a devolução se faz pela função de devolver o próprio Pix recebido, no aplicativo do seu banco.",
  "Na dúvida, fale com o seu banco pelos canais oficiais.",
];

// ---- empréstimo com taxa antecipada (glossário nº 18; Febraban 04/09/2024)

const EMPRESTIMO = "Empréstimo que pede pagamento antes";

const FAZER_EMPRESTIMO = [
  "Não pague nada. Segundo a Febraban, não existe empréstimo que exija pagamento antecipado de taxa, IOF ou parcela.",
  "Se quiser crédito, procure o seu banco pelos canais oficiais.",
];

// ---- cobrança ou taxa falsa com link (glossário nº 9 e nº 11; Febraban 11/11/2025)

const COBRANCA_FALSA = "Cobrança ou taxa falsa com link";

const FAZER_COBRANCA_FALSA = [
  "Não clique no link. A Febraban orienta: nunca clique em links recebidos por mensagens.",
  "Se a cobrança parecer real, procure a empresa ou o órgão pelo site ou telefone oficial, que você mesmo busca.",
];

// ---- código de verificação (WhatsApp, Central de Ajuda)

const CODIGO = "Pedido de código de verificação";

const FAZER_CODIGO = [
  "Não passe o código para ninguém, nem para amigo ou parente. Quem tem o código pode tomar a sua conta.",
  "Ative a verificação em duas etapas no WhatsApp.",
];

export const SINAIS = {
  // S1 — anúncio de número novo
  "numero-novo": {
    nome: "Diz que trocou de número",
    padroes: [
      "\\b(troquei|mudei|alterei) (de |o |meu )?(numero|celular|telefone|whats|zap)",
      "\\b(numero|celular) (novo|foi alterado|mudou)\\b",
      "\\bnovo numero\\b",
      "\\b(meu|o) numero antigo\\b",
      "\\bsalva (esse|este|meu|o meu|aqui)\\b",
    ],
  },
  // S2 — pedido de dinheiro
  "pedido-dinheiro": {
    nome: "Pede dinheiro",
    padroes: [
      "\\bpix\\b",
      "\\btransfer(e|ir|ia|encia)\\b",
      "\\bdeposit(a|e|ar|o)\\b",
      "\\bme (empresta|empreste)\\b",
      "\\bpaga (esse|este|isso|essa|pra mim|para mim)\\b",
      "\\bboleto\\b",
      "\\bmanda (um )?(dinheiro|valor)\\b",
    ],
  },
  // S3 — urgência
  "urgencia": {
    nome: "Tem pressa",
    padroes: [
      "\\burgen(te|cia)\\b",
      "\\brapid(inho|amente)\\b",
      "\\b(hoje ainda|ainda hoje|vence hoje)\\b",
      "\\bagora\\b",
      "\\bantes d(a|as|o|e) \\d",
      "\\be rapido\\b",
    ],
  },
  // S4 — impedimento para pagar sozinho
  "impedimento": {
    nome: "Diz que não consegue pagar sozinho",
    padroes: [
      "\\bestourou o limite\\b",
      "\\b(limite|cartao) (estourou|estourado|bloqueado|bloqueou)\\b",
      "\\bcartao (foi |ta |esta )?bloqueado\\b",
      "\\b(app|aplicativo)( do banco)? (travou|bloqueou|nao abre|nao funciona)\\b",
      "\\bsem acesso (ao|no) (banco|app|aplicativo)\\b",
      "\\bnao consigo (fazer|mandar) (o |um )?(pix|transferencia)\\b",
      "\\bconta (bloqueada|travada)\\b",
    ],
  },
  // S5 — promessa de devolver
  "promessa-devolucao": {
    nome: "Promete devolver logo",
    padroes: [
      "\\b(te )?(devolvo|pago|acerto) (logo )?(amanha|depois|sexta|segunda|na semana)\\b",
      "\\bdepois te acerto\\b",
    ],
  },
  // S6 — conta de outra pessoa
  "conta-terceiro": {
    nome: "Pede para pagar na conta de outra pessoa",
    padroes: [
      "\\bconta d(e|o|a) (um|uma|meu|minha) (amig|colega|conhecid)",
      "\\bno nome d(o|a|e) (um|uma|meu|minha|outr)",
      "\\bchave (e |eh )?d(e|o|a) (outra pessoa|um amigo|uma amiga|meu amigo|minha amiga|minha colega)\\b",
      "\\b(e|eh) d(a|o) (minha colega|meu amigo|minha amiga|rapaz|moco)\\b",
      "\\b(a chave|a conta) (e|eh) (o celular |o cpf |o telefone )?(dele|dela)\\b",
    ],
  },
  // S7 — evita ligação
  "evita-ligacao": {
    nome: "Evita falar por telefone",
    padroes: [
      "\\bnao (posso|consigo|da pra|da para) (falar|atender|ligar)\\b",
      "\\bligacao (esta |ta )?(ruim|caindo|cortando)\\b",
      "\\b(to|estou) sem (audio|microfone)\\b",
    ],
  },
  // S8 — pedido de segredo
  "sigilo": {
    nome: "Pede segredo",
    padroes: [
      "\\bnao (conta|fala|diz|comenta) (nada )?(pra|para|pro|com)( o| a)? (ninguem|pai|mae|papai|mamae|vo|vovo|ele|ela)\\b",
      "\\bsegredo\\b",
      "\\bentre nos\\b",
    ],
  },
  // S9 — pedido de código (WhatsApp: nunca compartilhar o código)
  "pedido-codigo": {
    nome: "Pede um código",
    padroes: [
      "\\b(passa|manda|envia|fala|informa)( pra mim| para mim)? (o|esse|aquele) codigo\\b",
      "\\bcodigo (que chegou|de verificacao|de seis digitos|de 6 digitos|por sms)\\b",
    ],
    exceto: ["\\bnao (passe|compartilhe|informe|envie) (o|esse|seu) codigo\\b"],
  },

  // ---- falsa central
  "conta-segura": {
    nome: "Fala em conta segura ou teste de Pix",
    padroes: [
      "\\bconta (segura|de seguranca|protegida)\\b",
      "\\btransferir (para|pra) proteger\\b",
      "\\bteste (de|do|com o) pix\\b",
    ],
  },
  "acesso-remoto": {
    nome: "Pede para instalar aplicativo",
    padroes: [
      "\\b(instal|baix)(e|a|ar) (o |um |esse |este )?(app|aplicativo)\\b",
      "\\bacesso remoto\\b",
      "\\b(anydesk|teamviewer)\\b",
    ],
  },
  "pedido-senha": {
    nome: "Pede senha ou token",
    padroes: [
      "\\b(informe|informar|digite|digitar|confirme|confirmar|passe|passar|me passa|fala) (a |sua |seu |o )?(senha|token)\\b",
    ],
    exceto: ["\\bnunca (informe|passe|compartilhe|digite|forneca) (a |sua |seu |o )?(senha|token)\\b"],
  },
  "motoboy": {
    nome: "Manda buscar ou cortar o cartão",
    padroes: ["\\bmotoboy\\b", "\\b(cortar|buscar|recolher) (o |seu )?cartao\\b"],
  },

  // ---- Pix errado
  "pix-engano": {
    nome: "Diz que mandou Pix por engano",
    padroes: [
      "\\b(mandei|fiz|enviei|transferi|caiu)( um| o)?( pix)?( pra voce| na sua conta)? (errado|por engano)\\b",
      "\\bpor engano na sua conta\\b",
      "\\bpix errado\\b",
    ],
  },
  "devolucao-outra-chave": {
    nome: "Pede devolução para outra chave ou boleto",
    padroes: [
      "\\bdevolv\\w* (pra|para|nessa|nesta|na|em|pela|pelo) (essa |esta |outra |nessa |minha )?(outra )?(chave|conta|boleto)\\b",
    ],
  },

  // ---- empréstimo
  "emprestimo": {
    nome: "Fala de empréstimo ou crédito",
    padroes: ["\\bemprestimo\\b", "\\bcredito (aprovado|liberado|pre-aprovado|pre aprovado)\\b", "\\bportabilidade\\b"],
  },
  "taxa-antecipada": {
    nome: "Pede pagamento antes de liberar",
    padroes: [
      "\\btaxa (de )?(liberacao|cadastro|abertura|antecipada)\\b",
      "\\b(pagar|pague|deposite|depositar) (o )?iof\\b",
      "\\bantecip\\w* (a )?(primeira )?parcela\\b",
      "\\bseguro obrigatorio (para|pra) liberar\\b",
    ],
  },

  // ---- cobrança falsa com link
  "link": {
    nome: "Tem um link",
    padroes: ["https?://", "\\bwww\\.", "\\b[a-z0-9-]+\\.(com|net|org|br|io|xyz|top|site|online|info|me|ly)\\b"],
  },
  "pressao-cobranca": {
    nome: "Ameaça de bloqueio, taxa ou pendência",
    padroes: [
      "\\btaxa\\b",
      "\\bregulariz(e|ar|acao)\\b",
      "\\bevite (o )?bloqueio\\b",
      "\\bpendencia\\b",
      "\\bultim(a|o) (notificacao|aviso)\\b",
      "\\bencomenda (esta |foi )?retida\\b",
      "\\balfandega\\b",
      "\\bcpf (sera|vai ser) (cancelado|bloqueado|suspenso)\\b",
      "\\bsera (bloquead|cancelad|suspens)[oa]\\b",
      "\\bem (24|48|72) ?h(oras)?\\b",
    ],
  },
};

export const REGRAS = [
  // ---------------- falso parente: alerta forte só com combinação
  {
    id: "falso-parente-numero-novo-dinheiro",
    golpe: FALSO_PARENTE,
    nivel: "forte",
    quando: [["numero-novo", "pedido-dinheiro"], ["numero-novo", "conta-terceiro"]],
    peso: 5,
    alerta: "Diz que trocou de número e, na mesma conversa, pede dinheiro. É o roteiro mais comum do golpe do falso parente.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-impedimento",
    golpe: FALSO_PARENTE,
    nivel: "forte",
    quando: [["pedido-dinheiro", "impedimento"]],
    peso: 5,
    alerta: "Pede dinheiro dizendo que o cartão, o limite ou o aplicativo do banco não funciona. É a desculpa clássica do golpe.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-evita-ligacao",
    golpe: FALSO_PARENTE,
    nivel: "forte",
    quando: [["pedido-dinheiro", "evita-ligacao"]],
    peso: 5,
    alerta: "Pede dinheiro e evita falar por telefone. Golpistas fogem da ligação para não serem reconhecidos pela voz.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-terceiro-pressa",
    golpe: FALSO_PARENTE,
    nivel: "forte",
    quando: [["conta-terceiro", "urgencia"]],
    peso: 5,
    alerta: "Pede pagamento com pressa na conta de outra pessoa. Golpistas usam contas de terceiros para receber.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-segredo",
    golpe: FALSO_PARENTE,
    nivel: "forte",
    quando: [["pedido-dinheiro", "sigilo"]],
    peso: 4,
    alerta: "Pede dinheiro e pede segredo. Pedir para não contar a ninguém é um jeito de impedir que você confirme.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-so-numero-novo",
    golpe: FALSO_PARENTE,
    nivel: "atencao",
    quando: [["numero-novo"]],
    peso: 2,
    alerta: "Diz que trocou de número. Antes de salvar o contato novo, confirme ligando no número antigo.",
    oQueFazer: [FAZER_FALSO_PARENTE[0], FAZER_FALSO_PARENTE[1]],
  },
  {
    id: "falso-parente-dinheiro-terceiro",
    golpe: FALSO_PARENTE,
    nivel: "atencao",
    quando: [["pedido-dinheiro", "conta-terceiro"]],
    peso: 3,
    alerta: "Pede pagamento na conta de outra pessoa. Pode ser normal, mas confirme por ligação com quem pediu antes de pagar.",
    oQueFazer: [FAZER_FALSO_PARENTE[0], FAZER_FALSO_PARENTE[2]],
  },
  {
    id: "dinheiro-com-pressa",
    golpe: FALSO_PARENTE,
    nivel: "atencao",
    quando: [["pedido-dinheiro", "urgencia"]],
    peso: 2,
    alerta: "Pede dinheiro com pressa. A pressa serve para você não ter tempo de conferir.",
    oQueFazer: [
      FAZER_FALSO_PARENTE[0],
      "Se for boleto, confira no aplicativo do seu banco o nome de quem vai receber, antes de pagar.",
    ],
  },

  // ---------------- código de verificação: forte sozinho
  {
    id: "pedido-de-codigo",
    golpe: CODIGO,
    nivel: "forte",
    quando: [["pedido-codigo"]],
    peso: 5,
    alerta: "Pede um código que chegou para você. Com esse código, a pessoa pode tomar a sua conta do WhatsApp ou do banco.",
    oQueFazer: FAZER_CODIGO,
  },

  // ---------------- falsa central
  {
    id: "falsa-central-conta-segura",
    golpe: FALSA_CENTRAL,
    nivel: "forte",
    quando: [["conta-segura"]],
    peso: 5,
    alerta: "Fala em transferir para uma \"conta segura\" ou fazer teste com Pix. O banco nunca pede transferência para resolver problema na conta.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-aplicativo",
    golpe: FALSA_CENTRAL,
    nivel: "forte",
    quando: [["acesso-remoto"]],
    peso: 5,
    alerta: "Pede para instalar um aplicativo. Com acesso remoto, o golpista mexe no seu celular e na sua conta.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-senha",
    golpe: FALSA_CENTRAL,
    nivel: "forte",
    quando: [["pedido-senha"]],
    peso: 5,
    alerta: "Pede senha ou token. O banco não pede senha nem token por mensagem ou ligação.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-motoboy",
    golpe: FALSA_CENTRAL,
    nivel: "forte",
    quando: [["motoboy"]],
    peso: 5,
    alerta: "Fala em mandar alguém buscar ou cortar o cartão. O banco não manda motoboy buscar cartão.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },

  // ---------------- Pix errado
  {
    id: "pix-errado-devolucao",
    golpe: PIX_ERRADO,
    nivel: "forte",
    quando: [["pix-engano", "devolucao-outra-chave"]],
    peso: 5,
    alerta: "Diz que mandou um Pix por engano e pede a devolução em outra chave ou conta. Depois o golpista pede o estorno do Pix original, e você perde duas vezes.",
    oQueFazer: FAZER_PIX_ERRADO,
  },
  {
    id: "pix-errado-aviso",
    golpe: PIX_ERRADO,
    nivel: "atencao",
    quando: [["pix-engano"]],
    peso: 3,
    alerta: "Diz que mandou um Pix por engano. Confira no aplicativo do banco se o dinheiro entrou mesmo, e devolva só pela função de devolução do próprio Pix.",
    oQueFazer: FAZER_PIX_ERRADO,
  },

  // ---------------- empréstimo
  {
    id: "emprestimo-taxa-antecipada",
    golpe: EMPRESTIMO,
    nivel: "forte",
    quando: [["emprestimo", "taxa-antecipada"]],
    peso: 5,
    alerta: "Oferece empréstimo e pede um pagamento antes de liberar o dinheiro.",
    oQueFazer: FAZER_EMPRESTIMO,
  },
  {
    id: "taxa-antecipada-aviso",
    golpe: EMPRESTIMO,
    nivel: "atencao",
    quando: [["taxa-antecipada"]],
    peso: 3,
    alerta: "Pede uma taxa ou parcela antes de liberar algo. Desconfie de qualquer pagamento adiantado.",
    oQueFazer: FAZER_EMPRESTIMO,
  },

  // ---------------- cobrança falsa
  {
    id: "cobranca-falsa-link",
    golpe: COBRANCA_FALSA,
    nivel: "forte",
    quando: [["link", "pressao-cobranca"]],
    peso: 4,
    alerta: "Tem um link e fala em taxa, pendência, bloqueio ou prazo curto. Links assim costumam levar a páginas falsas que imitam empresas e órgãos públicos.",
    oQueFazer: FAZER_COBRANCA_FALSA,
  },
];
