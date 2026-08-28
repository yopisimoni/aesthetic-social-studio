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

const params = new URLSearchParams(window.location.search);
const newsletterStatus = document.querySelector('.newsletter-status');
if (newsletterStatus && params.get('newsletter') === 'thanks') {
  newsletterStatus.textContent = 'Thanks — your signup was submitted. Check your inbox for any confirmation message.';
}
