const form = document.querySelector('#project-form');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const formStatus = document.querySelector('#form-status');
const briefButton = document.querySelector('#brief-button');
const briefStage = document.querySelector('#brief-stage');
const ideaField = form.elements.idea;
const finalBrief = form.elements.final_brief;
const apiBase = 'https://finlike-argue-matchbox.ngrok-free.dev';
const briefModal = document.querySelector('#brief-modal');
const modalTitle = document.querySelector('#brief-modal-title');
const modalCopy = document.querySelector('#brief-modal-copy');
const modalAction = document.querySelector('#brief-modal-action');
let generatedBrief = false;

function openBriefModal({ title, copy, action, onAction }) {
  modalTitle.textContent = title;
  modalCopy.textContent = copy;
  modalAction.innerHTML = action;
  modalAction.onclick = () => { briefModal.hidden = true; onAction?.(); };
  briefModal.hidden = false;
  modalAction.focus();
}

async function requestWithTimeout(url, options, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

document.querySelector('#year').textContent = new Date().getFullYear();

const matrixCanvas = document.querySelector('#matrix-canvas');
const matrixContext = matrixCanvas.getContext('2d');
const matrixCharacters = '01<>/{}[]#$%*+-=SYSTEM'.split('');
let matrixColumns = [];
let matrixFrame;

function prepareMatrix() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  matrixCanvas.width = matrixCanvas.clientWidth * scale;
  matrixCanvas.height = matrixCanvas.clientHeight * scale;
  matrixContext.setTransform(scale, 0, 0, scale, 0, 0);
  matrixColumns = Array.from({ length: Math.ceil(matrixCanvas.clientWidth / 15) }, () => Math.random() * -28);
}

function drawMatrix(animate = true) {
  const { clientWidth: width, clientHeight: height } = matrixCanvas;
  matrixContext.fillStyle = 'rgba(2, 8, 5, .16)';
  matrixContext.fillRect(0, 0, width, height);
  matrixContext.font = '12px "DM Mono", monospace';
  matrixColumns.forEach((drop, index) => {
    const x = index * 15;
    const y = drop * 15;
    matrixContext.fillStyle = index % 9 === 0 ? '#e6ffef' : '#74e7a8';
    matrixContext.fillText(matrixCharacters[(Math.random() * matrixCharacters.length) | 0], x, y);
    matrixColumns[index] = y > height && Math.random() > .975 ? Math.random() * -18 : drop + .48 + Math.random() * .45;
  });
  if (animate) matrixFrame = requestAnimationFrame(drawMatrix);
}

prepareMatrix();
const matrixMotionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
drawMatrix(matrixMotionAllowed);
window.addEventListener('resize', () => { cancelAnimationFrame(matrixFrame); prepareMatrix(); drawMatrix(matrixMotionAllowed); });

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
    openBriefModal({
      title: 'Generating your brief',
      copy: 'Continue browsing the page — we will notify you when it is ready.',
      action: 'Continue browsing <span>↓</span>',
      onAction: () => document.querySelector('#services').scrollIntoView({ behavior: 'smooth' })
    });
    try {
      const response = await requestWithTimeout(`${apiBase}/v1/brief`, {
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
      openBriefModal({
        title: 'Your brief is ready',
        copy: 'Review it, edit anything you want, then send the approved version to Diego.',
        action: 'View brief <span>→</span>',
        onAction: () => { document.querySelector('#project').scrollIntoView({ behavior: 'smooth' }); finalBrief.focus(); }
      });
    } catch (error) {
      briefButton.disabled = false;
      briefButton.innerHTML = 'Create project brief <span>→</span>';
      formStatus.textContent = 'The brief service did not respond in time. Please try once more or email Diego directly.';
      openBriefModal({ title: 'Brief unavailable', copy: 'The brief service did not respond in time. You can try once more or email Diego directly.', action: 'Back to brief <span>↑</span>', onAction: () => ideaField.focus() });
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
    const response = await requestWithTimeout(`${apiBase}/v1/leads`, {
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
