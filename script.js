document.getElementById('year').textContent = new Date().getFullYear();

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

const newsletterForm = document.querySelector('.newsletter-form');
const newsletterStatus = document.querySelector('.newsletter-status');
const newsletterButton = document.querySelector('.newsletter-submit');

if (newsletterForm) {
  addHoneypot(newsletterForm);
  addPrivacyLink(newsletterForm.querySelector('.form-note'));

  newsletterForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!newsletterForm.checkValidity()) {
      newsletterForm.reportValidity();
      return;
    }

    const originalLabel = newsletterButton.textContent;
    newsletterButton.disabled = true;
    newsletterButton.textContent = 'Joining…';
    newsletterStatus.textContent = '';

    try {
      const response = await fetch('https://formsubmit.co/ajax/7bf54497e1267fa60846acee60aaa00c', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: new FormData(newsletterForm)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Signup could not be completed.');
      }

      newsletterForm.reset();
      newsletterStatus.textContent = 'You’re on the list — welcome to Clinic Content Notes.';
      newsletterButton.textContent = 'Joined';
      setTimeout(() => {
        newsletterButton.textContent = originalLabel;
        newsletterButton.disabled = false;
      }, 2600);
    } catch (error) {
      newsletterStatus.textContent = 'Signup is temporarily unavailable. Please try again shortly.';
      newsletterButton.textContent = originalLabel;
      newsletterButton.disabled = false;
    }
  });
}

const trialForm = document.querySelector('.trial-form');
if (trialForm) {
  addHoneypot(trialForm);
  addPrivacyLink(trialForm.querySelector('.form-note'));

  const websiteOrInstagram = trialForm.querySelector('input[name="Website or Instagram"]');
  if (websiteOrInstagram) {
    websiteOrInstagram.type = 'text';
    websiteOrInstagram.placeholder = 'https://... or @clinicname';
    websiteOrInstagram.inputMode = 'url';
  }
}

const footerLinks = document.querySelector('.footer-links');
if (footerLinks && !footerLinks.querySelector('a[href="privacy.html"]')) {
  const privacyLink = document.createElement('a');
  privacyLink.href = 'privacy.html';
  privacyLink.textContent = 'Privacy';
  footerLinks.appendChild(privacyLink);
}
