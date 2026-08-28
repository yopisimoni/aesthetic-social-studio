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

const newsletterForm = document.querySelector('.newsletter-form');
const newsletterStatus = document.querySelector('.newsletter-status');
const newsletterButton = document.querySelector('.newsletter-submit');

if (newsletterForm) {
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
