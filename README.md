# É golpe?

Site gratuito e sem cadastro para conferir, no celular, se uma mensagem ou um boleto tem sinais de golpe, antes de pagar.

## Privacidade (regra do projeto)

- **Nada sai do aparelho.** Tudo roda no navegador: sem servidor, sem IA, sem analytics, sem cookies, sem guardar o que foi colado.
- **Nada vem de fora.** Sem CDN: fontes, scripts e estilos são do próprio site. Cada página traz uma política de segurança (CSP) que proíbe o navegador de abrir conexões (`connect-src 'none'`).
- **Compartilhar** abre o WhatsApp só com um aviso genérico ("É golpe? Confira antes de pagar."). O conteúdo colado nunca vai junto.
- **O resultado nunca dá garantia.** Sem sinal encontrado, o máximo é: "Nenhum sinal de alerta encontrado — mesmo assim, confirme por outro canal". As frases de garantia proibidas estão em `tests/frases-proibidas.test.mjs`, e o teste lê todos os arquivos do site.

Os testes de `tests/` conferem estas regras: privacidade, frases proibidas e acessibilidade.

## Rodar localmente

Não há build. Os módulos ES precisam ser servidos por HTTP; abrir o arquivo direto (`file://`) não funciona:

```bash
python -m http.server 8000
# abra http://localhost:8000 no navegador (no celular, use o modo de visualização de celular, 375 px)
```

## Testes

Precisa do Node 20 ou mais novo. Não há dependências para instalar:

```bash
node --test
```

## Estrutura

| arquivo | o que é |
|---|---|
| `index.html`, `ja-cai.html` | as páginas |
| `css/estilo.css` | estilo mobile first: letra base de 20px, contraste AA, botões de 60px |
| `js/regras.js` | **dados** das regras dos golpes (formato descrito em `js/motor.js`) |
| `js/motor.js` | motor: normaliza o texto, valida as regras e procura os sinais |
| `js/boleto.js` | linha do boleto |
| `js/textos.js` | textos do resultado, num lugar só |
| `js/compartilhar.js`, `js/config.js` | compartilhamento genérico; `URL_PUBLICA` vazio até a publicação ser aprovada |
| `js/app.js` | liga a página ao motor |

## Estado

Esta é a base. As regras dos golpes, a conferência da linha do boleto e o conteúdo da página "Já caí, e agora?" entram com a pesquisa: só com passos e prazos confirmados em fonte oficial. Até lá, `js/regras.js` está vazio, e o site responde com o aviso de "nenhum sinal" e os passos gerais.

O projeto é local. Repositório público e site publicado só com aprovação do José.
