const form = document.querySelector('#project-form');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const formStatus = document.querySelector('#form-status');
const briefButton = document.querySelector('#brief-button');
const briefStage = document.querySelector('#brief-stage');
const ideaField = form.elements.idea;
const finalBrief = form.elements.final_brief;
const apiBase = 'https://psyvit-all-series.tail5d3579.ts.net';
let generatedBrief = false;

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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!generatedBrief) {
    if (!ideaField.checkValidity()) {
      ideaField.reportValidity();
      return;
    }
    briefButton.disabled = true;
    briefButton.innerHTML = 'Preparing your brief… <span>↻</span>';
    formStatus.textContent = 'Creating one project brief. This can take a moment.';
    try {
      const response = await fetch(`${apiBase}/v1/brief`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: ideaField.value.trim() })
      });
      const result = await response.json();
      if (!response.ok || !result.brief) throw new Error(result.error || 'Brief unavailable');
      finalBrief.value = result.brief;
      generatedBrief = true;
      ideaField.readOnly = true;
      briefStage.hidden = false;
      briefButton.disabled = false;
      briefButton.innerHTML = 'Send approved brief <span>→</span>';
      formStatus.textContent = 'Review and edit the brief, then add your contact details to send it.';
      finalBrief.focus();
    } catch (error) {
      briefButton.disabled = false;
      briefButton.innerHTML = 'Create project brief <span>→</span>';
      formStatus.textContent = 'The brief service is temporarily unavailable. You can email Diego directly instead.';
    }
    return;
  }
  if (!form.elements.name.checkValidity() || !form.elements.email.checkValidity() || !finalBrief.value.trim()) {
    form.reportValidity();
    return;
  }
  briefButton.disabled = true;
  formStatus.textContent = 'Sending your approved brief…';
  try {
    const response = await fetch(`${apiBase}/v1/leads`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), final_brief: finalBrief.value.trim(), original_idea: ideaField.value.trim() })
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'received') throw new Error(result.error || 'Lead unavailable');
    formStatus.textContent = 'Received — Diego will review your brief and reply to the email you provided.';
    briefButton.innerHTML = 'Brief sent <span>✓</span>';
  } catch (error) {
    briefButton.disabled = false;
    formStatus.textContent = 'Unable to send right now. Please use the email link above.';
  }
});
