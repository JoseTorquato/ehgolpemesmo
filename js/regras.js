// Sinais e regras dos golpes: só dados, sem código. Formato em js/motor.js.
//
// Base: pesquisa-v0.1 e pesquisa-black-friday (25/11/2026). Os ROTEIROS dos
// golpes vêm de fontes oficiais: Glossário de Tipologias de Fraudes e Golpes
// Digitais (MJSP + Febraban, out/2025), Polícia Civil de Goiás, Febraban,
// Banco Central, WhatsApp, CERT.br. Os PADRÕES de texto abaixo são derivados
// desses roteiros; não são citações oficiais. Cada classe de golpe tem testes
// com mensagens de golpe e com mensagens normais parecidas
// (tests/regras.test.mjs).
//
// Dois níveis:
// - "forte": combinação de sinais que forma um golpe conhecido. A página
//   mostra o nome do golpe.
// - "atencao": um ponto para conferir. A página NÃO cita golpe e os passos
//   são condicionais ("se veio de um número novo..."). Pedido de dinheiro,
//   mesmo com pressa, sozinho não gera aviso nenhum.

// Valor em dinheiro: "R$ 400", "400 reais", "2 mil", "50 conto".
const VALOR = "(r\\$ ?\\d[\\d.,]*|\\d[\\d.,]* ?(mil|reais|conto|contos|pila)\\b)";

// ---- falso parente (glossário MJSP/Febraban nº 23 e 27; Polícia Civil de Goiás)

const FALSO_PARENTE = "Falso parente ou amigo pedindo dinheiro";

const FAZER_FALSO_PARENTE = [
  "Ligue para o seu parente no número ANTIGO, aquele que você já tinha salvo. Nunca ligue nem responda pelo número que pediu o dinheiro.",
  "Faça uma pergunta que só ele saberia responder, ou fale com outro parente para confirmar.",
  "Não faça Pix nem transferência para a conta de outra pessoa.",
  "Combine com a família uma palavra-chave para pedidos de dinheiro.",
];

const FAZER_PAGAR_POR_MIM = [
  "Antes de pagar, ligue para a pessoa no número que você já conhecia, ou fale com ela pessoalmente.",
  "Não pague boleto de outra pessoa sem confirmar com ela.",
  "Se for pagar um boleto, confira no aplicativo do seu banco o nome de quem vai receber (o beneficiário).",
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

// ---- cobrança falsa (glossário nº 9 "Falsa Dívida/Cobrança" e nº 11 "Falsa Taxa"; Febraban 11/11/2025)

const COBRANCA_FALSA = "Cobrança falsa com ameaça";

const FAZER_COBRANCA_FALSA = [
  "Não clique em link e não pague pela mensagem. A Febraban orienta: nunca clique em links recebidos por mensagens.",
  "Se a cobrança parecer real, procure a empresa ou o órgão pelo site ou telefone oficial, que você mesmo busca.",
];

// ---- prêmio ou emprego com taxa (glossário: falsa taxa; CERT.br: ofertas vantajosas como isca)

const PREMIO_TAXA = "Prêmio ou vaga que pede pagamento";

const FAZER_PREMIO_TAXA = [
  "Não pague taxa, frete, kit ou cadastro para receber prêmio ou conseguir vaga.",
  "Procure a empresa pelo site ou telefone oficial, que você mesmo busca, e confirme.",
];

// ---- código de verificação (WhatsApp, Central de Ajuda)

const CODIGO = "Pedido de código de verificação";

const FAZER_CODIGO = [
  "Não passe o código para ninguém, nem para amigo, parente ou \"funcionário do banco\". Quem tem o código pode tomar a sua conta.",
  "Ative a verificação em duas etapas no WhatsApp.",
];

export const SINAIS = {
  // S1 — anúncio de número novo (inclui chip, celular perdido, número emprestado)
  "numero-novo": {
    nome: "Diz que trocou de número",
    padroes: [
      "\\b(troquei|mudei|alterei) (de |o |meu )?(numero|telefone|whats|zap|chip)\\b",
      "\\b(troquei|mudei) de (celular|aparelho)\\b",
      "\\bnumero novo\\b(?! d[ao]\\b)",
      "\\bnovo (numero|contato|chip|zap|whats)\\b(?! d[ao]\\b)",
      "\\b(meu|o) numero antigo\\b",
      "\\bsalva (esse|este|meu|o meu|aqui)\\b",
      "\\b(perdi|roubaram|furtaram|levaram|quebrei|molhei) (o |meu )?(celular|telefone|aparelho|chip)\\b",
      "\\b(celular|telefone|aparelho) (caiu|molhou|quebrou|estragou|foi roubado|sumiu)\\b",
      "\\bnumero (temporario|provisorio|reserva|emprestado)\\b",
      "\\b(to|estou|tou) (usando|com|falando (do|pelo)) (o )?(celular|telefone|numero|whats|zap) d(o|a|e) (um|uma|meu|minha|outr)",
      "\\b(este|esse) (e|eh) (o )?meu (novo )?(numero|contato|zap|whats)\\b",
      "\\b(usando|falando por|falando deste|falando desse) (este|esse) (zap|whats|numero|celular|telefone)\\b",
      "\\b(celular|telefone|numero) emprestado\\b",
      "\\bpeguei (o )?(celular|telefone)( emprestado)? d(a|o|e)\\b",
    ],
    exceto: [
      // "troquei de celular, mas o número é o mesmo"
      "\\b(mesmo numero|numero (e|eh|continua|segue|ficou) (o )?mesmo|nao (mudei|troquei|mudou) (de |o )?numero)\\b",
      // pede o número de OUTRA pessoa
      "\\b(manda|passa|envia|me da|qual (e|eh))\\w*( pra mim| aqui)? (o |a )?(numero|contato|celular|telefone)( novo)? d(a|o|e)\\b",
    ],
  },
  // S2 — pedido de dinheiro (com ou sem a palavra Pix)
  "pedido-dinheiro": {
    nome: "Pede dinheiro",
    padroes: [
      "\\bpix\\b",
      "\\btransfer(e|ir|ia|encia)\\b",
      "\\bdeposit(a|e|ar|o)\\b",
      "\\bme (empresta|empreste)\\b",
      "\\bpaga (esse|este|isso|essa|pra mim|para mim)\\b",
      "\\bboleto\\b",
      "\\bmanda (um )?(dinheiro|valor|grana)\\b",
      `\\b(preciso|precisando|precisava|necessito)\\b(?:[^.!?]|\\.\\d){0,30}${VALOR}`,
      `\\b(ajuda|ajudar|socorre|empresta|emprestar|arruma|arrumar|consegue|manda|mandar|passa|libera)\\w*\\b(?:[^.!?]|\\.\\d){0,25}${VALOR}`,
      "\\bme (ajuda|salva|socorre)\\w* com (uns |um )?\\d{2,}",
      "\\b(preciso|precisando|precisava) (de )?(um |uma )?(dinheiro|grana)\\b",
    ],
  },
  // S3 — urgência
  "urgencia": {
    nome: "Tem pressa",
    padroes: [
      "\\burgen(te|cia)\\b",
      "\\brapid(inho|amente)\\b",
      "\\b(hoje ainda|ainda hoje|vence hoje|hoje mesmo|agora mesmo)\\b",
      "\\bagora\\b",
      "\\b(antes|ate) (d(a|as|o|e) |as |a )?\\d{1,2} ?(h|horas|:\\d\\d)?\\b",
      "\\be rapido\\b",
      "\\bnao pode esperar\\b",
      "\\bo quanto antes\\b",
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
      "\\b(bloqueou|bloquearam|travou|travaram) (o |meu |minha )?(cartao|conta|pix)\\b",
      "\\b(meu |minha )?(cartao|conta|pix) (ta |esta |foi )?(bloquead|travad)[oa]\\b",
    ],
  },
  // S5 — promessa de devolver
  "promessa-devolucao": {
    nome: "Promete devolver logo",
    padroes: [
      "\\b(te )?(devolvo|pago|acerto) (logo )?(amanha|depois|sexta|segunda|na semana)\\b",
      "\\bdepois te acerto\\b",
      "\\b(transfiro|devolvo|te passo|te mando|ja mando|mando o pix|te pago|te reembolso)\\b(?:[^.!?]|\\.\\d){0,40}\\b(amanha|depois|sexta|segunda|na sua conta|logo)\\b",
      "\\b(amanha|depois)\\b(?:[^.!?]|\\.\\d){0,60}\\b(transfiro|devolvo|te passo|te mando|ja mando|mando o pix|te pago)\\b",
    ],
  },
  // ---- "pagar por mim": pede para OUTRA pessoa pagar por ela, com
  // impedimento de app/senha/conta (Polícia Civil de Goiás: "meu cartão
  // estourou o limite… me deposita"; glossário nº 23)
  "pagar-por-mim": {
    nome: "Pede para você pagar por ela",
    padroes: [
      "\\b(paga|pagar|pague|faz|fazer|faca)\\w*( esse| este| essa| o| a| um| uma)? (pagamento|boleto|conta|pix)\\b(?:[^.!?]|\\.\\d){0,25}\\b(pra mim|para mim|por mim)\\b",
      "\\b(paga|pagar|pague|faz|faca) (pra mim|para mim|por mim)\\b",
      "\\bconsegue (me )?(pagar|fazer (esse|este|o|um) (pagamento|pix|boleto))\\b",
      "\\bse eu (te )?(mandar|enviar|passar) o (boleto|codigo de barras|pix|link)\\b",
      "\\bpagar na sua conta\\b",
      "\\bfaz (esse|este) pagamento\\b",
      "\\bpode pagar (esse|este|o|um) (boleto|pix|pagamento)\\b",
    ],
  },
  // impedimento dito de forma mais fraca (ir à agência, senha de transação):
  // só conta junto com "pagar por mim"; sozinho com Pix não acusa ninguém
  "impedimento-pagar": {
    nome: "Diz que o app, a senha ou a conta não funciona",
    padroes: [
      "\\btravou\\b(?:[^.!?]|\\.\\d){0,30}\\b(app|aplicativo|senha|conta|cartao)\\b",
      "\\bsenha (de transacao|eletronica|do app|do aplicativo|do banco)\\b",
      "\\b(passo|passar|passando|vou|ir|indo) (la )?(na|a|ate a) agencia\\b",
      "\\b(mudar|trocar|desbloquear|resetar|refazer) (a |minha )?senha\\b",
      "\\b(banco|app|aplicativo) (bloqueou|travou)\\b",
    ],
  },
  "prazo-hoje": {
    nome: "Diz que tem que ser hoje",
    padroes: ["\\bhoje\\b", "\\bultimo dia\\b", "\\b(desconto|vence|vencimento) (ate |e )?hoje\\b"],
  },
  // valor a partir de R$ 1.000: acima dos pedidos pequenos do dia a dia
  // (gás, mercado, remédio) e na faixa dos casos da Polícia Civil de Goiás
  "valor-alto": {
    nome: "Valor alto (R$ 1.000 ou mais)",
    padroes: [
      "\\b(r\\$ ?)?\\d{1,3}(\\.\\d{3})+(,\\d{2})?\\b",
      "\\br\\$ ?\\d{4,}\\b",
      "\\b\\d{4,},\\d{2}\\b",
      "\\b\\d+([.,]\\d+)? ?mil\\b",
    ],
  },
  // S6 — conta de outra pessoa
  "conta-terceiro": {
    nome: "Pede para pagar na conta de outra pessoa",
    padroes: [
      "\\b(conta|chave|pix) d(e|o|a) (um|uma|meu|minha) (amig|colega|conhecid|primo|prima|cunhad|vizinh|chefe|patra|namorad|soci|irm)",
      "\\bno nome d(o|a|e) (um|uma|meu|minha|outr)",
      "\\b(chave|conta)\\b(?:[^.!?]|\\.\\d){0,20}\\b(esta|ta|e|eh) (no|em) nome d(o|a|e)\\b",
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
      "\\bmicrofone (quebrou|nao funciona|ta ruim|esta ruim)\\b",
      "\\bsem credito\\b",
      "\\b(nao consigo|sem conseguir) (te )?(ligar|falar|atender)\\b",
      "\\b(so|somente) (consigo |posso )?(falar|responder|teclar) por (mensagem|aqui|texto|escrito|whats)\\b",
      "\\bnao (me )?(liga|ligue)\\b",
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
  // S9 — pedido de código (WhatsApp e bancos: nunca compartilhar o código)
  "pedido-codigo": {
    nome: "Pede um código",
    padroes: [
      "\\b(passa|passe|manda|mande|envia|envie|fala|informa|informe|informar|diga|digite|confirme)( pra mim| para mim| aqui)? (o |esse |aquele |este |seu )?codigo\\b",
      "\\bcodigo (que chegou|que recebeu|que voce recebeu|recebido|enviado|de verificacao|de seis digitos|de 6 digitos|por sms)\\b",
      "\\b(passa|passe|manda|mande|envia|envie|informa|informe|diga|digite|confirme|confirma)( pra mim| para mim| aqui)? (os |o )?(6|seis) (numeros|digitos)\\b",
      "\\b(numero|numeros) que (chegou|chegaram|recebeu|voce recebeu)( por sms| no seu celular)?\\b",
    ],
    exceto: ["\\b(nao|nunca) (passe|compartilhe|informe|envie|forneca|repasse) (o |esse |seu |este )?codigo\\b"],
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
  "compra-suspeita": {
    nome: "Fala de compra ou acesso que você não fez",
    padroes: [
      "\\b(compra|transacao|movimentacao|pagamento|acesso)\\b(?:[^.!?]|\\.\\d){0,60}\\b(nao reconhec|suspeit|nao autorizad|indevid)",
      "\\b(caso nao reconheca|se nao (foi voce|reconhece|reconhecer))\\b",
      "\\bnovo dispositivo\\b",
      "\\b(clonagem|clonad[oa])\\b",
    ],
  },
  "ligar-numero": {
    nome: "Manda ligar para um número da mensagem",
    padroes: [
      "\\b(ligue|ligar|liga|entre em contato|contate|retorne|disque)\\b(?:[^.!?]|\\.\\d){0,40}(0800|0300|4004|4003|\\(?\\d{2}\\)? ?9?\\d{4}[- ]?\\d{4})",
    ],
    exceto: ["\\bverso do (seu )?cartao\\b"],
  },
  "pressao-ligacao": {
    nome: "Pede para não desligar ou não abrir o aplicativo",
    padroes: [
      "\\bnao (desligue|desliga|abra o (app|aplicativo)|abra seu (app|aplicativo)|entre no (app|aplicativo)|procure (sua|a) agencia)\\b",
      "\\bmantenha (a |esta )?(ligacao|linha)\\b",
      "\\bsigilo (bancario|da operacao|da investigacao)\\b",
    ],
  },
  // Fala como banco ou central ("seu Pix", "central", "não feche esta
  // conversa"). Não gera aviso sozinho: só decide qual golpe é mostrado.
  "contexto-banco": {
    nome: "Fala como banco ou central",
    padroes: [
      "\\bseu (pix|cartao|conta|acesso|app|aplicativo)\\b",
      "\\b(central|gerente|atendente)\\b",
      "\\bsetor (de )?(seguranca|fraudes?|atendimento)\\b",
      "\\bnao (feche|saia d)\\w* (esta|essa|da) (conversa|tela|ligacao)\\b",
      "\\bpor (motivo de |medida de )?seguranca\\b",
    ],
  },
  "central-seguranca": {
    nome: "Diz ser da central de segurança",
    padroes: ["\\b(central|setor|departamento) (de )?(seguranca|fraudes?|prevencao)\\b"],
  },

  // ---- Pix errado
  "pix-engano": {
    nome: "Diz que mandou Pix por engano",
    padroes: [
      "\\b(pix|transferencia|deposito|dinheiro|r\\$|reais)\\b(?:[^.!?]|\\.\\d){0,40}\\b(por engano|sem querer|errad[oa])\\b",
      "\\b(por engano|sem querer)\\b(?:[^.!?]|\\.\\d){0,40}\\b(pix|transferencia|deposito|dinheiro|r\\$|reais|sua conta)\\b",
      "\\b(caiu|cairam) na sua conta\\b",
      "\\berrei (a |o )?(chave|numero do pix|pix|conta)\\b",
    ],
  },
  "devolucao-outra-chave": {
    nome: "Pede devolução para outra chave ou boleto",
    padroes: [
      "\\bdevol(v\\w*|ucao)\\b(?:[^.!?]|\\.\\d){0,40}\\b(outra|nessa|nesta|essa|esta|seguinte|nova|minha|certa|correta) (chave|conta)\\b",
      "\\bdevol(v\\w*|ucao)\\b(?:[^.!?]|\\.\\d){0,40}\\bboleto\\b",
      "\\b(manda|mandar|faz|fazer|envia|enviar)\\w* de volta\\b(?:[^.!?]|\\.\\d){0,40}\\b(chave|conta|pix)\\b",
      "\\b(chave|conta) (certa|correta)\\b",
      "\\b(devol(v\\w*|ucao)|de volta)\\b(?:[^.!?]|\\.\\d){0,40}\\b(pix|chave|conta) d(o|a) (meu|minha|um|uma)\\b",
    ],
  },

  // ---- empréstimo, prêmio, emprego
  "emprestimo": {
    nome: "Fala de empréstimo ou crédito",
    padroes: [
      "\\bemprestimo\\b",
      "\\bconsignado\\b",
      "\\bcredito (aprovado|liberado|pre-aprovado|pre aprovado)\\b",
      "\\bpre[- ]?aprovado\\b",
      "\\bportabilidade\\b",
    ],
  },
  "taxa-antecipada": {
    nome: "Pede pagamento antes de liberar",
    padroes: [
      "\\btaxa (de )?(liberacao|cadastro|abertura|antecipada)\\b",
      "\\b(pagar|pague|deposite|depositar) (o )?iof\\b",
      "\\bantecip\\w* (a )?(primeira )?parcela\\b",
      "\\bseguro obrigatorio (para|pra) liberar\\b",
      "\\b(pag(ar|ue|amento)|deposit\\w*|transfer\\w*) (d(o|a) |o |a )?(seguro|primeira parcela|parcela antecipada)\\b(?:[^.!?]|\\.\\d){0,40}\\b(liberar|cair|liberacao|receber|creditad)",
    ],
  },
  "pagar-taxa": {
    nome: "Pede para pagar taxa, frete ou cadastro",
    padroes: [
      "\\b(pag(ar|ue|amento)|deposit\\w*|transfer\\w*)\\b(?:[^.!?]|\\.\\d){0,25}\\b(taxa|frete|imposto|tarifa|kit|curso|cadastro|inscricao|seguro|caucao)\\b",
      "\\b(taxa|frete) (de|para|pra) (liberacao|envio|retirada|cadastro|inscricao|liberar|receber)\\b",
    ],
  },
  "premio": {
    nome: "Fala de prêmio ou sorteio",
    padroes: [
      "\\b(voce )?(ganhou|foi sortead[oa]|foi contemplad[oa]|e o ganhador|e a ganhadora)\\b",
      "\\b(premio|sorteio|brinde)\\b",
    ],
  },
  "emprego": {
    nome: "Oferece vaga ou renda extra",
    padroes: [
      "\\b(vaga|emprego|renda extra|trabalho (em casa|home office|online))\\b",
      "\\b(curtir|avaliar|seguir|assistir) (videos|produtos|perfis|paginas)\\b",
    ],
  },

  // ---- cobrança
  "link": {
    nome: "Tem um link",
    padroes: ["https?://", "\\bwww\\.", "\\b[a-z0-9-]+\\.(com|net|org|br|io|xyz|top|site|online|info|me|ly)\\b"],
  },
  "pressao-cobranca": {
    nome: "Fala em taxa, pendência ou bloqueio",
    padroes: [
      "\\btaxa\\b",
      "\\bregulariz(e|ar|acao)\\b",
      "\\bevit(e|ar) (o |a |seu |sua )?(bloqueio|corte|negativacao|protesto|suspensao|cancelamento)\\b",
      "\\bpendencia\\b",
      "\\bultim(a|o) (notificacao|aviso)\\b",
      "\\b(multa|debito) (pendente|em aberto|vencid[oa])\\b",
      "\\bencomenda (esta |foi )?retida\\b",
      "\\balfandega\\b",
      "\\bcpf (sera|vai ser) (cancelado|bloqueado|suspenso)\\b",
      "\\bsera (bloquead|cancelad|suspens)[oa]\\b",
      "\\bem (24|48|72) ?h(oras)?\\b",
    ],
  },
  "ameaca-cobranca": {
    nome: "Ameaça de negativação, corte ou processo",
    padroes: [
      "\\bnegativ(acao|ado|ada|ar)\\b",
      "\\bnome (sujo|no spc|no serasa)\\b",
      "\\bprotest(o|ado|ada|ar)\\b",
      "\\b(corte|cortad[oa]|cortar|desligamento)\\b(?:[^.!?]|\\.\\d){0,30}\\b(luz|energia|agua|internet|linha|servico|fornecimento)\\b",
      "\\b(sera|vai ser|serao) (bloquead|suspens|cancelad|cortad|desligad|negativad|protestad)\\w*",
      "\\b(acao judicial|processo judicial|oficial de justica|mandado de)\\b",
      "\\bsetor (de )?cobranca\\b",
      "\\b(multa|debito|divida) (pendente|em aberto|vencida|a pagar)\\b",
      "\\bevit(e|ar) (o |a |seu |sua )?(bloqueio|corte|negativacao|protesto|suspensao)\\b",
    ],
  },
  "pagar-pix-boleto": {
    nome: "Pede pagamento por Pix ou boleto",
    padroes: [
      "\\b(pag(ue|ar|amento)|quit(e|ar|acao)|acordo|regulariz\\w*|deposit\\w*)\\b(?:[^.!?]|\\.\\d){0,50}\\b(pix|boleto|chave|cnpj|qr ?code)\\b",
      "\\b(boleto|chave pix|pix|qr ?code)\\b(?:[^.!?]|\\.\\d){0,30}\\b(anexo|em anexo|segue|abaixo|a seguir)\\b",
      "\\bsegue (o |a )?(boleto|chave|pix|qr)",
      "\\bchave (pix )?(e |eh )?(o )?cnpj\\b",
    ],
  },
  "prazo-curto": {
    nome: "Dá prazo curto",
    padroes: [
      "\\b(ate )?(hoje|amanha)\\b",
      "\\bem (24|48|72) ?h(oras)?\\b",
      "\\bate as \\d",
      "\\bimediat\\w*\\b",
      "\\bultim(o|a) (dia|aviso|notificacao|chance)\\b",
    ],
  },

  // ---- Black Friday (CERT.br: desconto no Pix sozinho não é sinal)
  "so-no-pix": {
    nome: "Só aceita Pix",
    padroes: ["\\b(so|somente|apenas|exclusiv\\w*) (no|pelo|via|para|por) pix\\b"],
  },
  "desconto-absurdo": {
    nome: "Desconto muito alto",
    padroes: ["\\b([7-9]\\d)% ?(off|de desconto|desconto)\\b", "\\b(desconto|off) de ([7-9]\\d)%"],
  },
};

const FAMILIA_FP = "falso-parente";

export const REGRAS = [
  // ---------------- falso parente: alerta forte só com combinação
  {
    id: "falso-parente-numero-novo-dinheiro",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [["numero-novo", "pedido-dinheiro"], ["numero-novo", "conta-terceiro"]],
    peso: 5,
    alerta: "Diz que trocou de número (ou está usando outro celular) e, na mesma conversa, pede dinheiro. É o roteiro mais comum do golpe do falso parente.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-impedimento",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [["pedido-dinheiro", "impedimento"]],
    exceto: ["contexto-banco"], // aí é a falsa central (regra abaixo)
    peso: 5,
    alerta: "Pede dinheiro dizendo que o cartão, o limite ou o aplicativo do banco não funciona. É a desculpa clássica do golpe.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-evita-ligacao",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [["pedido-dinheiro", "evita-ligacao"]],
    peso: 5,
    alerta: "Pede dinheiro e evita falar por telefone. Golpistas fogem da ligação para não serem reconhecidos pela voz.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-terceiro-pressa",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [["conta-terceiro", "urgencia"], ["conta-terceiro", "sigilo"], ["conta-terceiro", "evita-ligacao"]],
    peso: 5,
    alerta: "Pede pagamento na conta de outra pessoa, com pressa, segredo ou sem poder falar. Golpistas usam contas de terceiros para receber.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "falso-parente-segredo",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [["pedido-dinheiro", "sigilo"]],
    peso: 4,
    alerta: "Pede dinheiro e pede segredo. Pedir para não contar a ninguém é um jeito de impedir que você confirme.",
    oQueFazer: FAZER_FALSO_PARENTE,
  },
  {
    id: "numero-novo-confirmar",
    golpe: "Número novo de parente ou amigo",
    familia: FAMILIA_FP,
    nivel: "atencao",
    quando: [["numero-novo"]],
    peso: 2,
    alerta: "A mensagem diz que a pessoa trocou de número ou está usando outro celular.",
    oQueFazer: [
      "Antes de salvar o número novo, ligue para a pessoa no número antigo, que você já tinha, e confirme.",
      "Se ela não atender, confirme com outro parente.",
    ],
  },

  {
    id: "pagar-por-mim",
    golpe: FALSO_PARENTE,
    familia: FAMILIA_FP,
    nivel: "forte",
    quando: [
      ["pagar-por-mim", "impedimento", "promessa-devolucao"],
      ["pagar-por-mim", "impedimento", "urgencia"],
      ["pagar-por-mim", "impedimento", "prazo-hoje"],
      ["pagar-por-mim", "impedimento", "valor-alto"],
      ["pagar-por-mim", "impedimento-pagar", "promessa-devolucao"],
      ["pagar-por-mim", "impedimento-pagar", "urgencia"],
      ["pagar-por-mim", "impedimento-pagar", "prazo-hoje"],
      ["pagar-por-mim", "impedimento-pagar", "valor-alto"],
    ],
    peso: 5,
    alerta: "Pede para você pagar um boleto ou um Pix por ela, dizendo que o aplicativo, a senha ou a conta não funciona, e promete devolver ou tem pressa. É um jeito comum do golpe do falso parente.",
    oQueFazer: FAZER_PAGAR_POR_MIM,
  },
  {
    id: "pagar-por-mim-confirmar",
    golpe: "Pedido para pagar por outra pessoa",
    familia: FAMILIA_FP,
    nivel: "atencao",
    quando: [
      ["impedimento", "pagar-por-mim"],
      ["impedimento", "promessa-devolucao"],
      ["impedimento", "urgencia"],
      ["impedimento", "prazo-hoje"],
      ["impedimento-pagar", "pagar-por-mim"],
      ["impedimento-pagar", "promessa-devolucao"],
      ["impedimento-pagar", "urgencia"],
      ["impedimento-pagar", "prazo-hoje"],
    ],
    peso: 3,
    alerta: "A mensagem pede pagamento ou diz que o aplicativo, a senha ou a conta da pessoa não está funcionando.",
    oQueFazer: FAZER_PAGAR_POR_MIM,
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
    familia: "falsa-central",
    nivel: "forte",
    quando: [["conta-segura"]],
    peso: 5,
    alerta: "Fala em transferir para uma \"conta segura\" ou fazer teste com Pix. O banco nunca pede transferência para resolver problema na conta.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-aplicativo",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["acesso-remoto"]],
    peso: 5,
    alerta: "Pede para instalar um aplicativo. Com acesso remoto, o golpista mexe no seu celular e na sua conta.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-senha",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["pedido-senha"]],
    peso: 5,
    alerta: "Pede senha ou token. O banco não pede senha nem token por mensagem ou ligação.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-motoboy",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["motoboy"]],
    peso: 5,
    alerta: "Fala em mandar alguém buscar ou cortar o cartão. O banco não manda motoboy buscar cartão.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-ligar",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["compra-suspeita", "ligar-numero"], ["central-seguranca", "ligar-numero"], ["central-seguranca", "compra-suspeita"]],
    peso: 5,
    alerta: "Fala de compra ou acesso que você não fez e manda ligar para um número da própria mensagem. É assim que começa o golpe da falsa central.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-bloqueio",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["pedido-dinheiro", "impedimento", "contexto-banco"]],
    peso: 5,
    alerta: "Diz que o seu Pix, cartão ou conta foi bloqueado e pede um Pix ou pagamento para resolver. O banco nunca pede transferência para resolver problema na conta.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "falsa-central-pressao",
    golpe: FALSA_CENTRAL,
    familia: "falsa-central",
    nivel: "forte",
    quando: [["pressao-ligacao"]],
    peso: 5,
    alerta: "Pede para não desligar, não abrir o aplicativo ou não procurar a agência. Segundo a Febraban, o banco não usa urgência nem pressão; isso serve para impedir que você confirme.",
    oQueFazer: FAZER_FALSA_CENTRAL,
  },
  {
    id: "compra-nao-reconhecida",
    golpe: "Aviso de compra não reconhecida",
    familia: "falsa-central",
    nivel: "atencao",
    quando: [["compra-suspeita"]],
    peso: 2,
    alerta: "A mensagem fala de compra ou acesso que você não reconhece.",
    oQueFazer: [
      "Confira pelo aplicativo do seu banco ou ligando para o número do verso do cartão, nunca por um número ou link da mensagem.",
    ],
  },

  // ---------------- Pix errado
  {
    id: "pix-errado-devolucao",
    golpe: PIX_ERRADO,
    familia: "pix-errado",
    nivel: "forte",
    quando: [["pix-engano", "devolucao-outra-chave"]],
    peso: 5,
    alerta: "Diz que mandou um Pix por engano e pede a devolução em outra chave, conta ou boleto. Depois o golpista pede o estorno do Pix original, e você perde duas vezes.",
    oQueFazer: FAZER_PIX_ERRADO,
  },
  {
    id: "pix-errado-aviso",
    golpe: "Pix recebido por engano",
    familia: "pix-errado",
    nivel: "atencao",
    quando: [["pix-engano"]],
    peso: 3,
    alerta: "A mensagem diz que mandaram um Pix para você por engano.",
    oQueFazer: [
      "Confira no aplicativo do seu banco se o dinheiro entrou mesmo.",
      "Se entrou, devolva só pela função de devolver o próprio Pix recebido, nunca fazendo um Pix novo para outra chave.",
    ],
  },

  // ---------------- empréstimo, prêmio, emprego
  {
    id: "emprestimo-taxa-antecipada",
    golpe: EMPRESTIMO,
    familia: "emprestimo",
    nivel: "forte",
    quando: [["emprestimo", "taxa-antecipada"], ["emprestimo", "pagar-taxa"]],
    peso: 5,
    alerta: "Oferece empréstimo e pede um pagamento antes de liberar o dinheiro.",
    oQueFazer: FAZER_EMPRESTIMO,
  },
  {
    id: "taxa-antecipada-aviso",
    golpe: "Pagamento adiantado",
    familia: "emprestimo",
    nivel: "atencao",
    quando: [["taxa-antecipada"]],
    peso: 3,
    alerta: "A mensagem pede uma taxa ou parcela antes de liberar algo.",
    oQueFazer: ["Desconfie de qualquer pagamento adiantado. Confirme com a empresa pelo site ou telefone oficial."],
  },
  {
    id: "premio-ou-vaga-com-taxa",
    golpe: PREMIO_TAXA,
    nivel: "forte",
    quando: [["premio", "pagar-taxa"], ["emprego", "pagar-taxa"], ["premio", "taxa-antecipada"], ["emprego", "taxa-antecipada"]],
    peso: 4,
    alerta: "Promete prêmio ou vaga e pede um pagamento antes (taxa, frete, kit ou cadastro).",
    oQueFazer: FAZER_PREMIO_TAXA,
  },

  // ---------------- cobrança falsa
  {
    id: "cobranca-falsa-link",
    golpe: COBRANCA_FALSA,
    familia: "cobranca",
    nivel: "forte",
    quando: [["link", "pressao-cobranca"], ["link", "ameaca-cobranca"]],
    peso: 4,
    alerta: "Tem um link e fala em taxa, pendência, bloqueio, negativação ou prazo curto. Links assim costumam levar a páginas falsas que imitam empresas e órgãos públicos.",
    oQueFazer: FAZER_COBRANCA_FALSA,
  },
  {
    id: "cobranca-falsa-ameaca",
    golpe: COBRANCA_FALSA,
    familia: "cobranca",
    nivel: "forte",
    quando: [["ameaca-cobranca", "pagar-pix-boleto", "prazo-curto"]],
    peso: 4,
    alerta: "Ameaça com negativação, corte ou processo, dá prazo curto e manda pagar por Pix ou boleto da mensagem.",
    oQueFazer: FAZER_COBRANCA_FALSA,
  },
  {
    id: "cobranca-confirmar",
    golpe: "Cobrança com ameaça",
    familia: "cobranca",
    nivel: "atencao",
    quando: [["ameaca-cobranca", "pagar-pix-boleto"]],
    peso: 2,
    alerta: "A mensagem cobra uma dívida com ameaça e pede pagamento por Pix ou boleto.",
    oQueFazer: ["Antes de pagar, confirme a dívida com a empresa pelo site ou telefone oficial, que você mesmo busca."],
  },

  // ---------------- Black Friday
  {
    id: "desconto-alto-so-pix",
    golpe: "Desconto muito alto, só no Pix",
    nivel: "atencao",
    quando: [["so-no-pix", "desconto-absurdo"]],
    peso: 2,
    alerta: "A oferta tem desconto muito alto e só aceita Pix.",
    oQueFazer: [
      "Desconto no Pix é comum, mas confira se a loja é conhecida, digitando você mesmo o endereço dela.",
      "Na hora de pagar, confira se o nome de quem recebe é o da loja.",
    ],
  },
];
