(() => {
  'use strict';

  const CONFIG = Object.freeze({
    cookieName: 'lusalink_consent',
    cookieDays: 180,
    consentVersion: 1,
    gtmId: 'GTM-52PXMD88',
    ga4MeasurementId: 'G-LCEC5RY9X8'
  });

  window.LUSALINK_TRACKING = CONFIG;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  // Google Consent Mode v2: recusado por defeito antes de qualquer tag Google.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  let gtmLoaded = false;
  let currentPreferences = null;
  let lastFocusedElement = null;

  function getCookie(name) {
    const prefix = `${name}=`;
    const value = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
    return value ? value.slice(prefix.length) : null;
  }

  function setCookie(name, value, days) {
    const maxAge = Math.round(days * 24 * 60 * 60);
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }

  function deleteCookie(name, domain) {
    const domainPart = domain ? `; Domain=${domain}` : '';
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domainPart}`;
  }

  function readPreferences() {
    const raw = getCookie(CONFIG.cookieName);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed.version !== CONFIG.consentVersion) return null;
      return {
        version: CONFIG.consentVersion,
        necessary: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true,
        updatedAt: parsed.updatedAt || null
      };
    } catch {
      return null;
    }
  }

  function savePreferences(preferences) {
    const stored = {
      version: CONFIG.consentVersion,
      necessary: true,
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
      updatedAt: new Date().toISOString()
    };
    setCookie(CONFIG.cookieName, JSON.stringify(stored), CONFIG.cookieDays);
    return stored;
  }

  function loadGTM() {
    if (gtmLoaded || !CONFIG.gtmId) return;
    gtmLoaded = true;
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
      lusalink_ga4_measurement_id: CONFIG.ga4MeasurementId
    });
    const firstScript = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(CONFIG.gtmId)}`;
    script.dataset.consentManaged = 'true';
    if (firstScript?.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
    else document.head.appendChild(script);
  }

  function clearGoogleAnalyticsCookies() {
    const names = document.cookie
      .split(';')
      .map((part) => part.trim().split('=')[0])
      .filter((name) => name === '_ga' || name.startsWith('_ga_'));

    const host = location.hostname.replace(/^www\./, '');
    for (const name of names) {
      deleteCookie(name);
      deleteCookie(name, location.hostname);
      deleteCookie(name, `.${location.hostname}`);
      if (host !== location.hostname) deleteCookie(name, host);
      deleteCookie(name, `.${host}`);
    }
  }

  function applyConsent(preferences, source = 'saved') {
    const previousAnalytics = currentPreferences?.analytics === true;
    currentPreferences = {
      necessary: true,
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing)
    };

    window.gtag('consent', 'update', {
      analytics_storage: currentPreferences.analytics ? 'granted' : 'denied',
      ad_storage: currentPreferences.marketing ? 'granted' : 'denied',
      ad_user_data: currentPreferences.marketing ? 'granted' : 'denied',
      ad_personalization: currentPreferences.marketing ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });

    window.dataLayer.push({
      event: 'lusalink_consent_update',
      consent_source: source,
      analytics_consent: currentPreferences.analytics ? 'granted' : 'denied',
      marketing_consent: currentPreferences.marketing ? 'granted' : 'denied',
      ga4_measurement_id: CONFIG.ga4MeasurementId
    });

    if (currentPreferences.analytics || currentPreferences.marketing) loadGTM();
    if (previousAnalytics && !currentPreferences.analytics) clearGoogleAnalyticsCookies();
  }

  function buildUI() {
    if (document.getElementById('cookie-banner')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <section class="cookie-banner" id="cookie-banner" role="region" aria-label="Preferências de cookies" hidden>
        <div class="cookie-banner__content">
          <div class="cookie-banner__text">
            <strong>Privacidade e cookies</strong>
            <p>Usamos cookies necessários e, apenas com a sua autorização, cookies de análise para medir e melhorar o website.</p>
            <a href="/politica-cookies">Consultar a Política de Cookies</a>
          </div>
          <div class="cookie-banner__actions">
            <button class="cookie-btn cookie-btn--primary" type="button" data-cookie-action="accept">Aceitar todos</button>
            <button class="cookie-btn cookie-btn--secondary" type="button" data-cookie-action="reject">Recusar opcionais</button>
            <button class="cookie-btn cookie-btn--link" type="button" data-cookie-action="settings">Personalizar</button>
          </div>
        </div>
      </section>

      <div class="cookie-modal" id="cookie-modal" hidden>
        <div class="cookie-modal__backdrop" data-cookie-action="close"></div>
        <section class="cookie-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title" aria-describedby="cookie-modal-description">
          <button class="cookie-modal__close" type="button" aria-label="Fechar preferências" data-cookie-action="close">×</button>
          <div class="cookie-modal__header">
            <span class="cookie-modal__eyebrow">Centro de privacidade</span>
            <h2 id="cookie-modal-title">Preferências de cookies</h2>
            <p id="cookie-modal-description">Escolha as categorias opcionais. Os cookies necessários estão sempre ativos porque permitem guardar a sua escolha e garantir o funcionamento do website.</p>
          </div>

          <div class="cookie-category">
            <div>
              <h3>Necessários</h3>
              <p>Guardam as preferências de consentimento e suportam funcionalidades essenciais.</p>
            </div>
            <span class="cookie-always-on" aria-label="Sempre ativo">Sempre ativo</span>
          </div>

          <label class="cookie-category cookie-category--toggle" for="cookie-analytics">
            <div>
              <h3>Análise</h3>
              <p>Permitem usar o Google Analytics 4 para compreender visitas e utilização do website.</p>
            </div>
            <span class="cookie-switch">
              <input id="cookie-analytics" type="checkbox" />
              <span aria-hidden="true"></span>
            </span>
          </label>

          <label class="cookie-category cookie-category--toggle" for="cookie-marketing">
            <div>
              <h3>Marketing</h3>
              <p>Permitem ativar etiquetas publicitárias no Google Tag Manager, quando configuradas.</p>
            </div>
            <span class="cookie-switch">
              <input id="cookie-marketing" type="checkbox" />
              <span aria-hidden="true"></span>
            </span>
          </label>

          <div class="cookie-modal__links">
            <a href="/politica-privacidade">Política de Privacidade</a>
            <a href="/politica-cookies">Política de Cookies</a>
          </div>

          <div class="cookie-modal__actions">
            <button class="cookie-btn cookie-btn--secondary" type="button" data-cookie-action="reject">Recusar opcionais</button>
            <button class="cookie-btn cookie-btn--primary" type="button" data-cookie-action="save">Guardar preferências</button>
          </div>
        </section>
      </div>
    `;

    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);
  }

  function getElements() {
    return {
      banner: document.getElementById('cookie-banner'),
      modal: document.getElementById('cookie-modal'),
      analytics: document.getElementById('cookie-analytics'),
      marketing: document.getElementById('cookie-marketing')
    };
  }

  function showBanner() {
    const { banner } = getElements();
    if (banner) banner.hidden = false;
  }

  function hideBanner() {
    const { banner } = getElements();
    if (banner) banner.hidden = true;
  }

  function openSettings() {
    const { modal, analytics, marketing } = getElements();
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    const prefs = currentPreferences || readPreferences() || { analytics: false, marketing: false };
    analytics.checked = Boolean(prefs.analytics);
    marketing.checked = Boolean(prefs.marketing);
    modal.hidden = false;
    document.body.classList.add('cookie-modal-open');
    modal.querySelector('.cookie-modal__close')?.focus();
  }

  function closeSettings() {
    const { modal } = getElements();
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('cookie-modal-open');
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }

  function commit(preferences, source) {
    const stored = savePreferences(preferences);
    applyConsent(stored, source);
    hideBanner();
    closeSettings();
  }

  function handleAction(action) {
    const { analytics, marketing } = getElements();
    if (action === 'accept') commit({ analytics: true, marketing: true }, 'accept_all');
    if (action === 'reject') commit({ analytics: false, marketing: false }, 'reject_all');
    if (action === 'settings') openSettings();
    if (action === 'save') commit({ analytics: analytics.checked, marketing: marketing.checked }, 'custom');
    if (action === 'close') closeSettings();
  }

  function bindUI() {
    document.addEventListener('click', (event) => {
      const actionTarget = event.target.closest('[data-cookie-action]');
      if (actionTarget) {
        event.preventDefault();
        handleAction(actionTarget.dataset.cookieAction);
        return;
      }

      const settingsTarget = event.target.closest('.js-cookie-settings');
      if (settingsTarget) {
        event.preventDefault();
        openSettings();
      }
    });

    document.addEventListener('keydown', (event) => {
      const { modal } = getElements();
      if (event.key === 'Escape' && modal && !modal.hidden) closeSettings();
    });
  }

  function init() {
    buildUI();
    bindUI();
    const saved = readPreferences();
    if (saved) {
      applyConsent(saved, 'saved');
      hideBanner();
    } else {
      applyConsent({ analytics: false, marketing: false }, 'default');
      showBanner();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
