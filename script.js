const form = document.querySelector('#project-form');
const email = 'diegofiatt.software.developer@gmail.com';
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const formStatus = document.querySelector('#form-status');

document.querySelector('#year').textContent = new Date().getFullYear();

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('span').textContent = open ? '×' : '+';
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = '+';
}));

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
    `Timeline: ${data.get('timeline')}`,
    '',
    'Project brief:',
    data.get('brief'),
    '',
    'Please send me the recommended next step, a quote, and a project-specific contract if we are a fit.'
  ].join('\n');
  formStatus.textContent = 'Opening your email app with the full project request.';
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
