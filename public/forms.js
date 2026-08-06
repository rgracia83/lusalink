(() => {
  'use strict';

  function setStatus(element, message, type = '') {
    if (!element) return;
    element.textContent = message;
    element.className = `form-status${type ? ` ${type}` : ''}`;
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
  }

  function setSubmitting(button, submitting) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = submitting;
    button.textContent = submitting ? 'A enviar…' : button.dataset.originalText;
    button.setAttribute('aria-busy', submitting ? 'true' : 'false');
  }

  function formToObject(form) {
    const result = {};
    for (const [key, rawValue] of new FormData(form).entries()) {
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = Array.isArray(result[key])
          ? [...result[key], value]
          : [result[key], value];
      } else {
        result[key] = value;
      }
    }
    result._page = window.location.href;
    return result;
  }

  async function sendForm(form, options) {
    const status = document.getElementById(options.statusId);
    const button = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(status, 'Preencha os campos obrigatórios assinalados.', 'error');
      return false;
    }

    setSubmitting(button, true);
    setStatus(status, 'A enviar os dados…');

    try {
      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formToObject(form))
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (_) {
        payload = {};
      }

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message || 'Não foi possível enviar o formulário.');
      }

      setStatus(status, options.successMessage, 'success');
      form.reset();
      if (typeof options.onSuccess === 'function') options.onSuccess();
      return true;
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus(
        status,
        error.message || 'Não foi possível enviar neste momento. Tente novamente.',
        'error'
      );
      return false;
    } finally {
      setSubmitting(button, false);
    }
  }

  const heroForm = document.getElementById('heroEvaluationForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (event) => {
      event.preventDefault();
      sendForm(heroForm, {
        endpoint: '/api/forms/quick-evaluation',
        statusId: 'heroStatus',
        successMessage: 'Pedido enviado com sucesso. Entraremos em contacto brevemente.'
      });
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      sendForm(contactForm, {
        endpoint: '/api/forms/contact',
        statusId: 'contactStatus',
        successMessage: 'Mensagem enviada com sucesso. Entraremos em contacto brevemente.'
      });
    });
  }

  const evaluationForm = document.getElementById('evaluationForm');
  if (evaluationForm) {
    evaluationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      return sendForm(evaluationForm, {
        endpoint: '/api/forms/evaluation',
        statusId: 'evaluationStatus',
        successMessage: 'Pedido enviado com sucesso.',
        onSuccess: () => {
          evaluationForm.classList.add('submitted');
          document.getElementById('successOverlay')?.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
})();
