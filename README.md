# É golpe mesmo?

No ar em https://josetorquato.dev/ehgolpemesmo/

Site gratuito e sem cadastro para conferir, no celular, se uma mensagem ou um boleto tem sinais de golpe, antes de pagar.

## Privacidade (regra do projeto)

- **Nada sai do aparelho.** Tudo roda no navegador: sem servidor, sem IA, sem analytics, sem cookies, sem guardar o que foi colado.
- **Nada vem de fora.** Sem CDN: fontes, scripts e estilos são do próprio site. Cada página traz uma política de segurança (CSP) que proíbe o navegador de abrir conexões (`connect-src 'none'`).
- **Compartilhar** abre o WhatsApp só com um convite genérico e o link do site (`js/compartilhar.js`). O conteúdo colado nunca vai junto.
- **O resultado nunca dá garantia.** Sem sinal encontrado, o máximo é: "Nenhum sinal de alerta encontrado — mesmo assim, confirme por outro canal". As frases de garantia proibidas estão em `tests/frases-proibidas.test.mjs`, e o teste lê todos os arquivos do site.

Os testes de `tests/` conferem estas regras: privacidade, frases proibidas e acessibilidade.

## Rodar localmente

Não há build. Os módulos ES precisam ser servidos por HTTP. **Abrir o `index.html` direto do disco (`file://`) não funciona** no Chrome e no Edge: o navegador bloqueia os módulos JS e a conferência não roda (constatado pelo Revisor no Edge, em 25/11/2026). As páginas de texto ("Já caí" e "Black Friday") abrem, mas a conferência não:

```bash
python -m http.server 8000
# abra http://localhost:8000 no navegador (no celular, use o modo de visualização de celular, 375 px)
```

**Sem internet:** com a página já aberta, a conferência funciona sem rede (nada é buscado de fora). Mas o site **não abre sem internet depois de fechado**: não há service worker nem cache offline. Pendência anotada; não foi feito.

## Testes

Precisa do Node 20 ou mais novo. Não há dependências para instalar:

```bash
node --test
```

## Estrutura

| arquivo | o que é |
|---|---|
| `index.html`, `ja-cai.html`, `black-friday.html` | as páginas |
| `css/estilo.css` | estilo mobile first: letra base de 20px, contraste AA, botões de 60px |
| `js/regras.js` | **dados**: sinais e regras dos golpes (formato descrito em `js/motor.js`) |
| `js/motor.js` | motor: normaliza o texto, valida as regras e procura os sinais |
| `js/boleto.js` | linha do boleto: dígitos verificadores, banco, valor, vencimento |
| `js/dados/bancos.js` | lista de bancos do Banco Central (gerada; fonte e data no arquivo) |
| `js/textos.js` | textos do resultado, num lugar só |
| `js/compartilhar.js`, `js/config.js` | convite genérico do WhatsApp, com o endereço público do site |
| `js/pagina.js` | liga o botão "Compartilhar no WhatsApp" (todas as páginas) |
| `img/og.png`, `img/icone-180.png` | prévia do link (1200×630) e ícone; fonte em `ferramentas/og.svg` e `favicon.svg` |
| `js/app.js` | liga a página ao motor |

## Estado (v0.1, local)

- **Mensagens:** regras do falso parente (9 sinais; alerta forte só com combinação) e, mais curtas, falsa central, Pix "por engano" com devolução, empréstimo com taxa antecipada, cobrança falsa com link e pedido de código. Os roteiros vêm de fontes oficiais (MJSP/Febraban, Polícia Civil de Goiás, BCB, WhatsApp); os padrões de texto são derivados deles. `tests/regras.test.mjs` traz as mensagens de golpe e as mensagens normais usadas para medir falso alarme.
- **Boleto:** 47 dígitos (cobrança) e 48 (arrecadação), dígitos verificadores, banco pela lista do Banco Central embarcada (`dados/ParticipantesSTR.csv`, baixada em 24/11/2026, gerada em `js/dados/bancos.js` por `node ferramentas/gerar-bancos.mjs`), valor e vencimento provável (estimativa, porque o fator de vencimento recomeçou em 22/02/2025). O resultado sempre manda conferir o nome do beneficiário no aplicativo do banco.
- **Já caí, e agora?:** só passos confirmados em fonte oficial, com a fonte em cada parte.
- **Black Friday: antes de comprar:** checklist de sete cuidados, só com orientação de fonte primária (CERT.br, NIC.br, Febraban, Procons, Serasa, MJSP), e link para a lista "Evite esses Sites" do Procon-SP, sem republicar a lista.

## Imagem de prévia do link

`img/og.png` (1200×630) é gerada localmente de `ferramentas/og.svg`, e `img/icone-180.png` de `favicon.svg`. Para gerar de novo, abra o SVG no navegador numa janela do tamanho da imagem e salve o print em PNG (no Edge headless: `msedge --headless=new --hide-scrollbars --window-size=1200,630 --screenshot=img/og.png file:///CAMINHO/ferramentas/og.svg`, que reproduz a imagem atual pixel a pixel). As metatags `og:*` e `twitter:*` de cada página apontam para `https://josetorquato.dev/ehgolpemesmo/img/og.png`; o teste confere o tamanho do PNG.

Mudanças só por branch e pull request; quem aprova e faz o merge é o José.
