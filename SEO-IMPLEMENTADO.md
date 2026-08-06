# SEO e blog implementados

## O que foi acrescentado

- Títulos e descrições únicos em todas as páginas.
- URLs canónicos e redirecionamentos de URLs antigas.
- Open Graph e Twitter Cards com imagens próprias.
- Dados estruturados `Organization`, `WebSite`, `WebPage`, `Blog`, `BlogPosting` e `BreadcrumbList`.
- `robots.txt` e `sitemap.xml`.
- Página 404 real com `noindex`.
- Navegação interna entre página inicial, avaliação, blog e artigos.
- Imagens sociais locais em `public/assets/images`.
- Blog em `/blog/` com 10 artigos originais.

## Artigos publicados

1. Como vender uma empresa de contabilidade em Portugal
2. Quanto vale uma empresa de contabilidade?
3. Como preparar um gabinete de contabilidade para venda
4. Sucessão num gabinete de contabilidade
5. Due diligence na venda de uma empresa de contabilidade
6. Como proteger clientes e equipa durante a venda
7. Venda total ou permanência no capital
8. O que os compradores procuram num gabinete de contabilidade
9. 10 erros a evitar ao vender um gabinete de contabilidade
10. Processo de aquisição de uma empresa de contabilidade

## Depois do deploy

1. Confirmar que abrem `https://lusalink.pt/`, `https://lusalink.pt/blog/`, `https://lusalink.pt/sitemap.xml` e `https://lusalink.pt/robots.txt`.
2. No Google Search Console, abrir **Sitemaps** e enviar `sitemap.xml`.
3. Em **Inspeção de URL**, testar a página inicial, a página do blog e os artigos prioritários.
4. Pedir indexação apenas depois de o novo deploy estar Live.
5. Acompanhar em **Desempenho** quais pesquisas geram impressões e cliques.

## Nota

O SEO melhora a capacidade de rastreio e a relevância do conteúdo, mas não garante posições imediatas. A indexação e os resultados dependem do Google, da concorrência, da autoridade do domínio e da promoção dos artigos.

## Privacidade, cookies e medição

- Política de Privacidade em `/politica-privacidade`
- Política de Cookies em `/politica-cookies`
- Barra de consentimento acessível em todas as páginas
- Google Consent Mode v2 com estados opcionais recusados por defeito
- Google Tag Manager `GTM-52PXMD88`
- Google Analytics 4 `G-LCEC5RY9X8`
- Imagens da página inicial e avaliação servidas localmente, sem pedidos automáticos ao Unsplash
- Fontes com fallback local, sem carregamento automático do Google Fonts


## Imagens humanas e desempenho

- Fotografias locais e coerentes com os temas de avaliação, sucessão, negociação, equipa e contacto.
- Hero da página inicial e da avaliação com imagens humanas.
- Blog e os 10 artigos com fotografias relacionadas com o respetivo conteúdo.
- Secções Sobre e Contacto com presença humana e texto contextual.
- Imagens visíveis servidas em WebP; versões JPG mantidas para Open Graph e partilhas sociais.
- `alt` descritivo, dimensões explícitas, `loading=lazy` abaixo da dobra e prioridade apenas nas imagens principais.
