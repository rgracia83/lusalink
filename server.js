import express from 'express';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));

// Canonicaliza HTTPS e o domínio sem www em produção.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  const host = String(req.headers.host || '').toLowerCase().split(':')[0];
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const isLusalinkHost = host === 'lusalink.pt' || host === 'www.lusalink.pt';
  if (host === 'www.lusalink.pt' || (isLusalinkHost && proto !== 'https')) {
    return res.redirect(301, `https://lusalink.pt${req.originalUrl}`);
  }
  return next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Foram enviados demasiados pedidos. Aguarde alguns minutos e tente novamente.'
  }
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 4000;

const FORM_DEFINITIONS = {
  'quick-evaluation': {
    subject: 'Novo pedido rápido de avaliação',
    required: ['Nome', 'Telefone', 'Nome da empresa', 'Consentimento RGPD'],
    fields: [
      'Nome',
      'Telefone',
      'Nome da empresa',
      'Receita anual (€)',
      'EBITDA (€)',
      'Consentimento RGPD'
    ]
  },
  contact: {
    subject: 'Novo contacto pelo site',
    required: ['Nome', 'email', 'Mensagem', 'Consentimento RGPD'],
    fields: [
      'Nome',
      'Telefone',
      'email',
      'Nome da empresa',
      'Mensagem',
      'Consentimento RGPD'
    ]
  },
  evaluation: {
    subject: 'Novo pedido de avaliação',
    required: ['Nome', 'Telefone', 'Nome da empresa', 'Consentimento RGPD'],
    fields: [
      'Nome',
      'Telefone',
      'email',
      'Cargo / Função',
      'Nome da empresa',
      'NIF',
      'Código Postal',
      'Website',
      'Anos de actividade',
      'Número de colaboradores',
      'Tipo de negócio',
      'Receita anual (€)',
      'EBITDA (€)',
      'Consentimento RGPD'
    ]
  }
};

function cleanString(value) {
  return String(value ?? '').replace(/\0/g, '').trim().slice(0, MAX_FIELD_LENGTH);
}

function cleanValue(value) {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean).slice(0, 20);
  }
  return cleanString(value);
}

function isEmpty(value) {
  return Array.isArray(value) ? value.length === 0 : !value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function valueToText(value) {
  return Array.isArray(value) ? value.join(', ') : String(value || '—');
}

function parseRecipients(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => EMAIL_PATTERN.test(item));
}

function getEmailSettings() {
  const provider = cleanString(process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  const to = parseRecipients(process.env.FORM_TO_EMAIL);
  const bcc = parseRecipients(process.env.FORM_BCC_EMAIL);
  const from = cleanString(process.env.FORM_FROM_EMAIL);

  if (!to.length) throw new Error('FORM_TO_EMAIL não está configurado.');
  if (!from) throw new Error('FORM_FROM_EMAIL não está configurado.');

  return { provider, to, bcc, from };
}

function validateAndExtract(formType, body) {
  const definition = FORM_DEFINITIONS[formType];
  if (!definition) return { error: 'Tipo de formulário inválido.' };

  const honeypot = cleanString(body?._honey);
  if (honeypot) return { spam: true };

  const values = {};
  for (const field of definition.fields) {
    values[field] = cleanValue(body?.[field]);
  }

  const missing = definition.required.filter((field) => isEmpty(values[field]));
  if (missing.length) {
    return { error: `Preencha os campos obrigatórios: ${missing.join(', ')}.` };
  }

  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    return { error: 'Introduza um endereço de email válido.' };
  }

  return {
    definition,
    values,
    page: cleanString(body?._page),
    submittedAt: new Date().toLocaleString('pt-PT', {
      timeZone: 'Europe/Lisbon',
      dateStyle: 'full',
      timeStyle: 'medium'
    })
  };
}

function buildMessage({ definition, values, page, submittedAt }) {
  const rows = definition.fields
    .filter((field) => !isEmpty(values[field]))
    .map((field) => {
      const label = escapeHtml(field);
      const value = escapeHtml(valueToText(values[field])).replaceAll('\n', '<br>');
      return `<tr><th style="padding:10px 12px;border:1px solid #d9dce5;background:#f5f6fa;text-align:left;vertical-align:top;width:34%">${label}</th><td style="padding:10px 12px;border:1px solid #d9dce5;vertical-align:top">${value}</td></tr>`;
    })
    .join('');

  const metadataRows = [
    `<tr><th style="padding:10px 12px;border:1px solid #d9dce5;background:#f5f6fa;text-align:left">Data</th><td style="padding:10px 12px;border:1px solid #d9dce5">${escapeHtml(submittedAt)}</td></tr>`,
    page
      ? `<tr><th style="padding:10px 12px;border:1px solid #d9dce5;background:#f5f6fa;text-align:left">Página</th><td style="padding:10px 12px;border:1px solid #d9dce5">${escapeHtml(page)}</td></tr>`
      : ''
  ].join('');

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1d2340;margin:0;padding:24px;background:#f3f4f8"><div style="max-width:760px;margin:auto;background:#fff;border-radius:12px;padding:28px"><h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(definition.subject)}</h1><p style="margin:0 0 22px;color:#5d6378">Foi recebida uma nova submissão no website da Lusalink.</p><table style="width:100%;border-collapse:collapse;font-size:14px">${rows}${metadataRows}</table></div></body></html>`;

  const textLines = definition.fields
    .filter((field) => !isEmpty(values[field]))
    .map((field) => `${field}: ${valueToText(values[field])}`);
  textLines.push(`Data: ${submittedAt}`);
  if (page) textLines.push(`Página: ${page}`);

  return { html, text: textLines.join('\n') };
}

async function sendWithResend({ to, bcc, from, subject, html, text, replyTo }) {
  const apiKey = cleanString(process.env.RESEND_API_KEY);
  if (!apiKey) throw new Error('RESEND_API_KEY não está configurada.');

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    bcc: bcc.length ? bcc : undefined,
    replyTo: replyTo || undefined,
    subject,
    html,
    text
  });

  if (error) throw new Error(error.message || 'A API de email recusou o envio.');
  return data?.id || 'resend-ok';
}

async function sendWithSmtp({ to, bcc, from, subject, html, text, replyTo }) {
  const host = cleanString(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);
  const user = cleanString(process.env.SMTP_USER);
  const pass = cleanString(process.env.SMTP_PASS);
  const secure = cleanString(process.env.SMTP_SECURE).toLowerCase() === 'true' || port === 465;

  if (!host || !Number.isFinite(port) || !user || !pass) {
    throw new Error('As variáveis SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS não estão completas.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  const info = await transporter.sendMail({
    from,
    to,
    bcc: bcc.length ? bcc : undefined,
    replyTo: replyTo || undefined,
    subject,
    html,
    text
  });
  return info.messageId;
}

async function sendEmail(message) {
  const settings = getEmailSettings();
  const payload = { ...settings, ...message };

  if (settings.provider === 'smtp') return sendWithSmtp(payload);
  if (settings.provider === 'resend') return sendWithResend(payload);
  throw new Error('EMAIL_PROVIDER deve ser "resend" ou "smtp".');
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/forms/:formType', formLimiter, async (req, res) => {
  const parsed = validateAndExtract(req.params.formType, req.body || {});

  if (parsed.spam) {
    return res.status(200).json({ success: true });
  }
  if (parsed.error) {
    return res.status(422).json({ success: false, message: parsed.error });
  }

  const { definition, values } = parsed;
  const { html, text } = buildMessage(parsed);
  const subjectPrefix = cleanString(process.env.FORM_SUBJECT_PREFIX || 'Lusalink');
  const subject = `${subjectPrefix} — ${definition.subject}`;
  const replyTo = EMAIL_PATTERN.test(values.email || '') ? values.email : undefined;

  try {
    const messageId = await sendEmail({ subject, html, text, replyTo });
    console.log(`[forms] ${req.params.formType} enviado: ${messageId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[forms] erro de envio:', error);
    return res.status(500).json({
      success: false,
      message: 'Não foi possível enviar neste momento. Tente novamente mais tarde.'
    });
  }
});

app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/avaliacao.html', (req, res) => res.redirect(301, '/avaliacao'));
app.get('/blog/index.html', (req, res) => res.redirect(301, '/blog/'));
app.get('/politica-privacidade.html', (req, res) => res.redirect(301, '/politica-privacidade'));
app.get('/politica-cookies.html', (req, res) => res.redirect(301, '/politica-cookies'));

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders: (res, filePath) => {
    if (/\.(?:css|js|jpg|jpeg|png|webp|svg|woff2)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

app.get('/avaliacao', (req, res) => {
  res.sendFile(path.join(publicDir, 'avaliacao.html'));
});

app.use((req, res) => {
  if (req.accepts('html')) return res.status(404).sendFile(path.join(publicDir, '404.html'));
  return res.status(404).json({ success: false, message: 'Recurso não encontrado.' });
});

const port = Number(process.env.PORT || 10000);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Lusalink a correr na porta ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} recebido. A encerrar...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
