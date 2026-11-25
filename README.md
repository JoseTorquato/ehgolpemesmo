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
| `js/regras.js` | **dados**: sinais e regras dos golpes (formato descrito em `js/motor.js`) |
| `js/motor.js` | motor: normaliza o texto, valida as regras e procura os sinais |
| `js/boleto.js` | linha do boleto: dígitos verificadores, banco, valor, vencimento |
| `js/dados/bancos.js` | lista de bancos do Banco Central (gerada; fonte e data no arquivo) |
| `js/textos.js` | textos do resultado, num lugar só |
| `js/compartilhar.js`, `js/config.js` | compartilhamento genérico; `URL_PUBLICA` vazio até a publicação ser aprovada |
| `js/app.js` | liga a página ao motor |

## Estado (v0.1, local)

- **Mensagens:** regras do falso parente (9 sinais; alerta forte só com combinação) e, mais curtas, falsa central, Pix "por engano" com devolução, empréstimo com taxa antecipada, cobrança falsa com link e pedido de código. Os roteiros vêm de fontes oficiais (MJSP/Febraban, Polícia Civil de Goiás, BCB, WhatsApp); os padrões de texto são derivados deles. `tests/regras.test.mjs` traz as mensagens de golpe e as mensagens normais usadas para medir falso alarme.
- **Boleto:** 47 dígitos (cobrança) e 48 (arrecadação), dígitos verificadores, banco pela lista do Banco Central embarcada (`dados/ParticipantesSTR.csv`, baixada em 24/11/2026, gerada em `js/dados/bancos.js` por `node ferramentas/gerar-bancos.mjs`), valor e vencimento provável (estimativa, porque o fator de vencimento recomeçou em 22/02/2025). O resultado sempre manda conferir o nome do beneficiário no aplicativo do banco.
- **Já caí, e agora?:** só passos confirmados em fonte oficial, com a fonte em cada parte.

O projeto é local. Repositório público e site publicado só com aprovação do José.
