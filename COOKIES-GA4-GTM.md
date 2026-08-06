# Lusalink — Cookies, GA4 e Google Tag Manager

## Identificadores configurados

- Google Tag Manager: `GTM-52PXMD88`
- GA4 — ID de medição: `G-LCEC5RY9X8`
- GA4 — ID da stream: `11402039572`
- URL da stream: `https://lusalink.pt`

## Funcionamento implementado

1. O Google Consent Mode v2 começa com `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` em `denied`.
2. O Google Tag Manager não é carregado antes de existir consentimento para análise ou marketing.
3. “Recusar opcionais” mantém GA4 e etiquetas de marketing desligados.
4. “Aceitar todos” autoriza análise e marketing e carrega o contentor GTM.
5. “Personalizar” permite escolher análise e marketing separadamente.
6. A escolha fica guardada no cookie necessário `lusalink_consent` durante 180 dias.
7. O link “Gerir cookies”, existente no rodapé e nas políticas, permite alterar ou retirar a autorização.
8. Ao retirar análise, o site envia o estado `denied` e remove os cookies `_ga` do domínio que consegue identificar.

## Confirmação necessária dentro do Google Tag Manager

No contentor `GTM-52PXMD88`:

1. Abra **Tags**.
2. Confirme que existe uma **Google tag** com o ID `G-LCEC5RY9X8`.
3. Use o acionador **All Pages**.
4. Em **Consent Settings**, mantenha as verificações de consentimento incorporadas da Google. Não crie uma exceção que ignore `analytics_storage`.
5. Evite instalar um segundo snippet GA4 diretamente no HTML, porque pode duplicar page views.
6. Publique uma nova versão do contentor.

## Teste depois do deploy

### Teste de recusa

1. Abra o site numa janela anónima.
2. Antes de escolher, confirme que não existem cookies `_ga`.
3. Carregue em **Recusar opcionais**.
4. Navegue por várias páginas.
5. Confirme que não são criados cookies `_ga`.

### Teste de aceitação

1. Apague o cookie `lusalink_consent` ou use outra janela anónima.
2. Carregue em **Aceitar todos**.
3. Confirme no DevTools que é carregado `googletagmanager.com/gtm.js?id=GTM-52PXMD88`.
4. Confirme que aparece `_ga` e `_ga_LCEC5RY9X8`.
5. No GA4, abra **Reports > Realtime** e confirme a visita.

### Teste com Tag Assistant

Use o modo **Preview** do Google Tag Manager para confirmar:

- estado inicial: `denied`;
- após aceitação: `granted`;
- a Google tag `G-LCEC5RY9X8` dispara apenas quando `analytics_storage` está autorizado.

## Páginas legais

- `https://lusalink.pt/politica-privacidade`
- `https://lusalink.pt/politica-cookies`

Antes da publicação definitiva, acrescente à Política de Privacidade a denominação jurídica completa, NIPC e morada da entidade responsável, caso pretenda apresentar esses dados no website.
