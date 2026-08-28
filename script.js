document.getElementById('year').textContent = new Date().getFullYear();

const SUPABASE_URL = 'https://himqukzzshptwjhoryav.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_w7gOzUZCERTZ4SMxmL1jcA_JcaVqxos';
const LEADS_ENDPOINT = `${SUPABASE_URL}/rest/v1/leads`;

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');

if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      copyStatus.textContent = 'Email copied.';
      copyButton.textContent = 'Copied';
      setTimeout(() => {
        copyButton.textContent = 'Copy email';
        copyStatus.textContent = '';
      }, 2200);
    } catch (error) {
      copyStatus.textContent = `Copy this email: ${email}`;
    }
  });
}

function removeLegacyFormSubmitFallback(form) {
  if (!form) return;

  // Forms are handled exclusively by Supabase. Remove the obsolete FormSubmit
  // transport and metadata so no submission can be routed to FormSubmit after
  // this script initializes.
  form.removeAttribute('action');
  form.removeAttribute('method');

  const legacyFields = ['_subject', '_template', '_captcha', '_next', '_autoresponse'];
  legacyFields.forEach((name) => {
    form.querySelectorAll(`input[name="${name}"]`).forEach((field) => field.remove());
  });
}

function addHoneypot(form) {
  if (!form || form.querySelector('input[name="_honey"]')) return;
  const honey = document.createElement('input');
  honey.type = 'text';
  honey.name = '_honey';
  honey.tabIndex = -1;
  honey.autocomplete = 'off';
  honey.setAttribute('aria-hidden', 'true');
  honey.style.position = 'absolute';
  honey.style.left = '-9999px';
  form.appendChild(honey);
}

function addPrivacyLink(container) {
  if (!container || container.querySelector('a[href="privacy.html"]')) return;
  container.appendChild(document.createTextNode(' '));
  const link = document.createElement('a');
  link.href = 'privacy.html';
  link.textContent = 'Privacy notice';
  container.appendChild(link);
}

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
    referrer: document.referrer || null
  };
}

async function saveLead(payload) {
  const response = await fetch(LEADS_ENDPOINT, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      ...payload,
      ...getAttribution()
    })
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody.message || errorBody.details || '';
    } catch (_) {
      detail = await response.text().catch(() => '');
    }
    throw new Error(detail || `Lead submission failed (${response.status}).`);
  }
}

const newsletterForm = document.querySelector('.newsletter-form');
const newsletterStatus = document.querySelector('.newsletter-status');
const newsletterButton = document.querySelector('.newsletter-submit');

if (newsletterForm) {
  removeLegacyFormSubmitFallback(newsletterForm);
  addHoneypot(newsletterForm);
  addPrivacyLink(newsletterForm.querySelector('.form-note'));

  newsletterForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!newsletterForm.checkValidity()) {
      newsletterForm.reportValidity();
      return;
    }

    if (newsletterForm.querySelector('input[name="_honey"]')?.value) {
      newsletterForm.reset();
      newsletterStatus.textContent = 'You’re on the list — welcome to Clinic Content Notes.';
      return;
    }

    const originalLabel = newsletterButton.textContent;
    newsletterButton.disabled = true;
    newsletterButton.textContent = 'Joining…';
    newsletterStatus.textContent = '';

    try {
      const name = newsletterForm.querySelector('input[name="First name"]').value.trim();
      const clinic = newsletterForm.querySelector('input[name="Clinic name"]').value.trim();
      const email = newsletterForm.querySelector('input[name="Email"]').value.trim();
      const consent = newsletterForm.querySelector('input[name="Consent"]').checked;

      await saveLead({
        name,
        email,
        phone: null,
        service_interest: 'Clinic Content Notes newsletter',
        message: clinic ? `Clinic name: ${clinic}` : null,
        source: 'aesthetic-social-studio-landing-page',
        form_type: 'newsletter',
        status: 'new',
        consent
      });

      newsletterForm.reset();
      newsletterStatus.textContent = 'You’re on the list — welcome to Clinic Content Notes.';
      newsletterButton.textContent = 'Joined';
      setTimeout(() => {
        newsletterButton.textContent = originalLabel;
        newsletterButton.disabled = false;
      }, 2600);
    } catch (error) {
      console.error('Newsletter signup error:', error);
      newsletterStatus.textContent = 'Signup is temporarily unavailable. Please try again shortly.';
      newsletterButton.textContent = originalLabel;
      newsletterButton.disabled = false;
    }
  });
}

const trialForm = document.querySelector('.trial-form');
if (trialForm) {
  removeLegacyFormSubmitFallback(trialForm);
  addHoneypot(trialForm);
  addPrivacyLink(trialForm.querySelector('.form-note'));

  const websiteOrInstagram = trialForm.querySelector('input[name="Website or Instagram"]');
  if (websiteOrInstagram) {
    websiteOrInstagram.type = 'text';
    websiteOrInstagram.placeholder = 'https://... or @clinicname';
    websiteOrInstagram.inputMode = 'url';
  }

  const trialButton = trialForm.querySelector('.trial-submit');
  const trialNote = trialForm.querySelector('.form-note');

  trialForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!trialForm.checkValidity()) {
      trialForm.reportValidity();
      return;
    }

    if (trialForm.querySelector('input[name="_honey"]')?.value) {
      window.location.href = 'thank-you.html';
      return;
    }

    const originalLabel = trialButton.textContent;
    trialButton.disabled = true;
    trialButton.textContent = 'Sending…';

    try {
      const name = trialForm.querySelector('input[name="Contact name"]').value.trim();
      const clinic = trialForm.querySelector('input[name="Clinic name"]').value.trim();
      const email = trialForm.querySelector('input[name="email"]').value.trim();
      const website = trialForm.querySelector('input[name="Website or Instagram"]').value.trim();
      const service = trialForm.querySelector('input[name="Main service or topic"]').value.trim();
      const notes = trialForm.querySelector('textarea[name="Project notes"]').value.trim();
      const consent = trialForm.querySelector('input[name="Project contact consent"]').checked;

      await saveLead({
        name,
        email,
        phone: null,
        service_interest: service,
        message: [
          `Clinic name: ${clinic}`,
          `Website or Instagram: ${website}`,
          notes ? `Project notes: ${notes}` : null
        ].filter(Boolean).join('\n'),
        source: 'aesthetic-social-studio-landing-page',
        form_type: 'trial',
        status: 'new',
        consent
      });

      window.location.href = 'thank-you.html';
    } catch (error) {
      console.error('Trial submission error:', error);
      if (trialNote) {
        trialNote.textContent = 'We couldn’t send your request right now. Please try again or email aestheticsocialstudio.co@gmail.com.';
      }
      trialButton.textContent = originalLabel;
      trialButton.disabled = false;
    }
  });
}

const footerLinks = document.querySelector('.footer-links');
if (footerLinks && !footerLinks.querySelector('a[href="privacy.html"]')) {
  const privacyLink = document.createElement('a');
  privacyLink.href = 'privacy.html';
  privacyLink.textContent = 'Privacy';
  footerLinks.appendChild(privacyLink);
}
