# Lusalink — formulários no Render

Este projeto já não utiliza FormSubmit. O website e a API dos formulários são executados no mesmo Web Service Node.js do Render.

## Opção recomendada: Render gratuito + Resend API

O Render gratuito bloqueia ligações SMTP nas portas 25, 465 e 587. Por isso, no plano gratuito, use a API HTTPS do Resend.

### 1. Preparar o Resend

1. Crie uma conta no Resend.
2. Adicione e verifique o domínio que será usado no remetente.
3. Crie uma API Key.
4. O remetente pode ser, por exemplo: `Lusalink <formularios@seudominio.pt>`.

## 2. Publicar no GitHub

Coloque todos os ficheiros desta pasta na raiz de um repositório GitHub e faça push.

## 3. Criar o serviço no Render

Método simples:

1. Render > **New** > **Web Service**.
2. Ligue o repositório GitHub.
3. Runtime: **Node**.
4. Build Command: `npm install`.
5. Start Command: `npm start`.
6. Health Check Path: `/api/health`.

Também pode escolher **New > Blueprint**: o ficheiro `render.yaml` já está incluído.

## 4. Variáveis de ambiente no Render

Em **Environment**, configure:

- `EMAIL_PROVIDER` = `resend`
- `RESEND_API_KEY` = chave criada no Resend
- `FORM_TO_EMAIL` = email que deve receber os formulários
- `FORM_FROM_EMAIL` = `Lusalink <formularios@seudominio.pt>`
- `FORM_SUBJECT_PREFIX` = `Lusalink`

Não coloque a API Key diretamente nos ficheiros do projeto.

## 5. Domínio

Depois do deploy, o site funciona no endereço `*.onrender.com`. Pode adicionar o domínio próprio em **Settings > Custom Domains**.

## Alternativa SMTP

O backend também aceita SMTP, mas o serviço Render precisa de ser pago. Use:

- `EMAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FORM_TO_EMAIL`
- `FORM_FROM_EMAIL`

## Endpoints

- `POST /api/forms/contact`
- `POST /api/forms/evaluation`
- `GET /api/health`

Os formulários têm validação no servidor, honeypot antisspam e limite de pedidos por IP.


## Formulários incluídos

- O formulário rápido da página inicial envia diretamente para o backend e já não redireciona sem enviar.
- No formulário completo, apenas Nome, Telefone, Nome da empresa e consentimento RGPD são obrigatórios.
- O campo Website aceita `empresa.pt`, sem ser necessário escrever `https://`.


## SEO e blog

O projeto inclui `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph, dados estruturados e 10 artigos em `/blog/`. Depois do deploy, envie `https://lusalink.pt/sitemap.xml` no Google Search Console e peça indexação da página inicial, `/blog/` e dos artigos prioritários.


## Cookies, GA4 e Google Tag Manager

O projeto inclui uma barra de cookies própria com Google Consent Mode v2.

- Google Tag Manager: `GTM-52PXMD88`
- GA4 ID de medição: `G-LCEC5RY9X8`
- GA4 ID da stream: `11402039572`
- Preferência de consentimento: cookie necessário `lusalink_consent`, válido por 180 dias

As categorias opcionais começam em `denied`. O contentor GTM só é carregado depois de o visitante aceitar análise ou marketing. No Google Tag Manager, confirme que a Google tag/GA4 usa `G-LCEC5RY9X8` e que os consentimentos incorporados estão ativos. Evite adicionar um segundo snippet GA4 diretamente ao HTML, porque isso pode duplicar page views.

Páginas legais:

- `https://lusalink.pt/politica-privacidade`
- `https://lusalink.pt/politica-cookies`

Antes da publicação definitiva, confirme se pretende acrescentar à Política de Privacidade a denominação jurídica completa, NIPC e morada da entidade responsável.
