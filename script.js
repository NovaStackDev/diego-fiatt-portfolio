const form = document.querySelector('#project-form');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const formStatus = document.querySelector('#form-status');
const briefButton = document.querySelector('#brief-button');
const briefStage = document.querySelector('#brief-stage');
const chatComposer = document.querySelector('#chat-composer');
const chatSendStage = document.querySelector('#chat-send-stage');
const visitorMessage = document.querySelector('#visitor-message');
const visitorMessageText = document.querySelector('#visitor-message-text');
const ideaField = form.elements.idea;
const finalBrief = form.elements.final_brief;
const apiBase = 'https://finlike-argue-matchbox.ngrok-free.dev';
const briefModal = document.querySelector('#brief-modal');
const modalTitle = document.querySelector('#brief-modal-title');
const modalCopy = document.querySelector('#brief-modal-copy');
const modalAction = document.querySelector('#brief-modal-action');
let generatedBrief = false;
let originalIdea = '';

function fallbackBrief(idea) {
  return `Project goal:
${idea}

Suggested scope:
• Define a first version around the main user workflow.

Key considerations:
• Confirm the users, data sources, integrations, timeline, and constraints.

What Diego should confirm:
• Primary users and their roles.
• The core workflow and expected outcome.
• Existing systems, data, and integrations.
• Timeline, budget range, and constraints.

Diego will review this brief and provide a proper project-specific quote.`;
}

function safeBrief(raw, idea) {
  const brief = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const leakedInstruction = /(we have to|visitor said|the visitor|write the project goal|system prompt|instructions?|analysis|reasoning|let'?s (?:write|think))/i;
  const hasHeading = /^(?:#{1,3}\s*)?(?:project\s*(?:goal|brief)|objetivo(?:\s+del\s+proyecto)?)/im.test(brief);
  return !brief || leakedInstruction.test(brief) || !hasHeading ? fallbackBrief(idea) : brief;
}

function resizeBrief() {
  finalBrief.style.height = '0px';
  finalBrief.style.height = `${finalBrief.scrollHeight}px`;
}

function resizeIdeaInput() {
  ideaField.style.height = '0px';
  ideaField.style.height = `${ideaField.scrollHeight}px`;
}

finalBrief.addEventListener('input', resizeBrief);
ideaField.addEventListener('input', resizeIdeaInput);
requestAnimationFrame(resizeIdeaInput);

function openBriefModal({ title, copy, action, onAction }) {
  modalTitle.textContent = title;
  modalCopy.textContent = copy;
  modalAction.innerHTML = action;
  modalAction.onclick = () => { briefModal.hidden = true; onAction?.(); };
  briefModal.hidden = false;
  modalAction.focus();
}

document.querySelector('#year').textContent = new Date().getFullYear();
const brandLoader = document.querySelector('#brand-loader');
window.addEventListener('load', () => window.setTimeout(() => brandLoader.classList.add('is-done'), 1650));

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
    briefButton.classList.add('is-loading');
    briefButton.setAttribute('aria-busy', 'true');
    briefButton.innerHTML = 'Preparing briefing… <span>↻</span>';
    originalIdea = ideaField.value.trim();
    visitorMessageText.textContent = originalIdea;
    visitorMessage.hidden = false;
    ideaField.value = '';
    resizeIdeaInput();
    formStatus.textContent = 'Preparing your briefing. You can continue browsing while Qwen works.';
    openBriefModal({
      title: 'Generating your brief',
      copy: 'Preparing briefing. Continue browsing the app and Qwen will notify you when it is ready.',
      action: 'Continue browsing <span>↓</span>',
      onAction: () => document.querySelector('#services').scrollIntoView({ behavior: 'smooth' })
    });
    try {
      const response = await fetch(`${apiBase}/v1/brief`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: originalIdea })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Brief unavailable');
      finalBrief.value = safeBrief(result.brief, originalIdea);
      generatedBrief = true;
      ideaField.readOnly = true;
      briefStage.hidden = false;
      requestAnimationFrame(resizeBrief);
      chatComposer.hidden = true;
      chatSendStage.hidden = false;
      briefButton.classList.remove('is-loading');
      briefButton.removeAttribute('aria-busy');
      formStatus.textContent = 'Qwen prepared the briefing. Review it, edit it, and add your contact information.';
      openBriefModal({
        title: 'Your brief is ready',
        copy: 'Qwen added the briefing to the chat. Review and edit it before sending it to Diego.',
        action: 'View brief <span>→</span>',
        onAction: () => { document.querySelector('#project').scrollIntoView({ behavior: 'smooth' }); finalBrief.focus(); }
      });
    } catch (error) {
      briefButton.disabled = false;
      briefButton.classList.remove('is-loading');
      briefButton.removeAttribute('aria-busy');
      briefButton.innerHTML = 'Send <span>→</span>';
      visitorMessage.hidden = true;
      formStatus.textContent = 'The brief service is unavailable. Please try again or email Diego directly.';
      openBriefModal({ title: 'Brief unavailable', copy: 'The brief service is unavailable. You can try again or email Diego directly.', action: 'Back to chat <span>↑</span>', onAction: () => ideaField.focus() });
    }
    return;
  }

  if (!form.elements.name.checkValidity() || !form.elements.company.checkValidity() || !form.elements.email.checkValidity() || !form.elements.phone.checkValidity() || !finalBrief.value.trim()) {
    form.reportValidity();
    return;
  }
  const sendBriefButton = document.querySelector('#send-brief-button');
  sendBriefButton.disabled = true;
  formStatus.textContent = 'Sending your approved brief…';
  try {
    const approvedBrief = `${finalBrief.value.trim()}\n\nContact information:\nName: ${form.elements.name.value.trim()}\nCompany: ${form.elements.company.value.trim()}\nEmail: ${form.elements.email.value.trim()}\nPhone: ${form.elements.phone.value.trim()}\nBudget: ${form.elements.budget.value.trim() || 'Not provided'}`;
    const response = await fetch(`${apiBase}/v1/leads`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), final_brief: approvedBrief, original_idea: originalIdea })
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'received') throw new Error(result.error || 'Lead unavailable');
    formStatus.textContent = 'Received — Diego will review your brief and reply to the contact details you provided.';
    sendBriefButton.innerHTML = 'Brief sent <span>✓</span>';
  } catch (error) {
    sendBriefButton.disabled = false;
    formStatus.textContent = 'Unable to send right now. Please use the email link above.';
  }
});
