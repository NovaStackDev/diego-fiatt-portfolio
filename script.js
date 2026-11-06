const form = document.querySelector('#project-form');
const email = 'diegofiatt.software.developer@gmail.com';

document.querySelector('#year').textContent = new Date().getFullYear();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const subject = `Project inquiry: ${data.get('service')}`;
  const body = [
    'Hello Diego,',
    '',
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Service: ${data.get('service')}`,
    '',
    'Project brief:',
    data.get('brief'),
    '',
    'Please send me the recommended next step, a quote, and a project-specific contract if we are a fit.'
  ].join('\n');
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
