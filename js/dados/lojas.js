// Endereços das lojas mais conhecidas do Brasil, para notar quando um link
// IMITA um deles. Lista curada à mão: não existe lista oficial de lojas.
//
// Cada domínio foi conferido em 25/11/2026:
//   - .br: titular no RDAP do Registro.br (rdap.registro.br, consulta por domínio)
//     é a empresa da loja (nome do titular anotado abaixo);
//   - .com: o domínio .br da loja, já conferido, redireciona para ele.
// Ficaram de fora as lojas cujo domínio não deu para conferir assim.
// "renner" sozinho não entra: renner.com.br é de outra empresa (Renner Herrmann).
// nomeComum: palavra comum ("extra", como em extra.globo.com); só conta quando
// vem junto de palavra de golpe (extra-ofertas.com) ou no domínio inteiro.
//
// Estar nesta lista NÃO quer dizer que a loja ou a oferta são de confiança:
// serve só para comparar endereços.

export const CONFERIDO_EM = "25/11/2026";

export const LOJAS = [
  { marca: "Magazine Luiza", nomes: ["magazineluiza", "magalu"], dominios: ["magazineluiza.com.br", "magalu.com.br", "magazinevoce.com.br"], titular: "MAGAZINE LUIZA S/A" },
  { marca: "Mercado Livre", nomes: ["mercadolivre"], dominios: ["mercadolivre.com.br"], titular: "Mercado Livre Brasil Ltda." },
  { marca: "Amazon", nomes: ["amazon"], dominios: ["amazon.com.br"], titular: "Amazon Servicos de Varejo do Brasil Ltda." },
  { marca: "Americanas", nomes: ["americanas"], dominios: ["americanas.com.br"], titular: "Americanas SA" },
  { marca: "Submarino", nomes: ["submarino"], dominios: ["submarino.com.br"], titular: "Americanas SA" },
  { marca: "Shoptime", nomes: ["shoptime"], dominios: ["shoptime.com.br"], titular: "Americanas SA" },
  { marca: "Casas Bahia", nomes: ["casasbahia"], dominios: ["casasbahia.com.br"], titular: "VIA VAREJO S/A" },
  { marca: "Ponto Frio", nomes: ["pontofrio"], dominios: ["pontofrio.com.br"], titular: "CNOVA COMERCIO ELETRONICO S.A." },
  { marca: "Extra", nomes: ["extra"], nomeComum: true, dominios: ["extra.com.br"], titular: "Companhia Brasileira de Distribuição" },
  { marca: "Carrefour", nomes: ["carrefour"], dominios: ["carrefour.com.br"], titular: "CARREFOUR COMERCIO E INDUSTRIA LTDA" },
  { marca: "Shopee", nomes: ["shopee"], dominios: ["shopee.com.br"], titular: "SHPS TECNOLOGIA E SERVICOS LTDA" },
  { marca: "Shein", nomes: ["shein"], dominios: ["shein.com.br", "shein.com"], titular: "Roadget Business Pte Ltd (shein.com.br, que redireciona para br.shein.com)" },
  { marca: "Temu", nomes: ["temu"], dominios: ["temu.com.br", "temu.com"], titular: "Whaleco Brasil Intermediação LTDA (temu.com.br, que redireciona para temu.com/br)" },
  { marca: "KaBuM!", nomes: ["kabum"], dominios: ["kabum.com.br"], titular: "KABUM COMÉRCIO ELETRÔNICO S.A" },
  { marca: "Netshoes", nomes: ["netshoes"], dominios: ["netshoes.com.br"], titular: "NS2.COM INTERNET SA" },
  { marca: "Centauro", nomes: ["centauro"], dominios: ["centauro.com.br"], titular: "SBF COMÉRCIO DE PRODUTOS ESPORTIVOS LTDA" },
  { marca: "Renner", nomes: ["lojasrenner"], dominios: ["lojasrenner.com.br"], titular: "Lojas Renner S.A." },
  { marca: "Riachuelo", nomes: ["riachuelo"], dominios: ["riachuelo.com.br"], titular: "LOJAS RIACHUELO S/A" },
  { marca: "C&A", nomes: ["cea"], nomeComum: true, dominios: ["cea.com.br"], titular: "COFRA LATIN AMERICA LTDA." },
  { marca: "Dafiti", nomes: ["dafiti"], dominios: ["dafiti.com.br"], titular: "GFG Comercio Digital Ltda" },
  { marca: "Fast Shop", nomes: ["fastshop"], dominios: ["fastshop.com.br"], titular: "Fast Shop S.A." },
  { marca: "Havan", nomes: ["havan"], dominios: ["havan.com.br"], titular: "HAVAN SA" },
  { marca: "Leroy Merlin", nomes: ["leroymerlin"], dominios: ["leroymerlin.com.br"], titular: "Leroy Merlin - Cia Brasileira de Bricolagem" },
  { marca: "MadeiraMadeira", nomes: ["madeiramadeira"], dominios: ["madeiramadeira.com.br"], titular: "Madeira Madeira Comercio Eletrônico S/A" },
  { marca: "Drogasil", nomes: ["drogasil"], dominios: ["drogasil.com.br"], titular: "RAIA DROGASIL S/A" },
  { marca: "Droga Raia", nomes: ["drogaraia"], dominios: ["drogaraia.com.br"], titular: "RAIA DROGASIL S/A" },
  { marca: "Natura", nomes: ["natura"], dominios: ["natura.com.br"], titular: "NATURA COSMETICOS S/A" },
  { marca: "O Boticário", nomes: ["boticario"], dominios: ["boticario.com.br"], titular: "BOTICARIO PRODUTOS DE BELEZA LTDA" },
  { marca: "Pichau", nomes: ["pichau"], dominios: ["pichau.com.br"], titular: "Pichau Informática" },
  { marca: "Polishop", nomes: ["polishop"], dominios: ["polishop.com.br"], titular: "POLIMPORT COMERCIO EXPORTACAO LTDA" },
];

// Encurtadores de link: não dá para ver o destino.
export const ENCURTADORES = [
  "bit.ly", "bitly.com", "tinyurl.com", "encurtador.com.br", "cutt.ly", "is.gd", "v.gd",
  "t.co", "rb.gy", "shorturl.at", "ow.ly", "tiny.cc", "s.id", "t.ly", "abre.ai", "amzn.to",
  "goo.gl", "buff.ly",
];

// Terminações pouco comuns para loja brasileira. Sinal FRACO: há lojas de
// verdade com elas (sem estatística oficial; ver pesquisa-black-friday, 1.1).
export const TERMINACOES_INCOMUNS = [
  "shop", "store", "online", "site", "xyz", "top", "click", "buzz", "live", "icu", "vip",
  "fun", "cyou", "sbs", "lol", "monster", "rest", "bond", "cfd", "win", "today", "website",
];

// Sufixos com dois níveis (o domínio registrável fica um nível abaixo).
// Simplificação da Public Suffix List: só os que aparecem em lojas no Brasil.
export const SUFIXOS_DUPLOS = [
  "com.br", "net.br", "org.br", "gov.br", "edu.br", "app.br", "art.br", "blog.br", "emp.br",
  "eti.br", "ind.br", "inf.br", "log.br", "tur.br", "adv.br", "eco.br", "seg.br", "srv.br",
  "tv.br", "rec.br", "dev.br", "tec.br", "co.uk", "com.ar", "com.mx",
  "com.pt", "com.co", "com.cn",
];
