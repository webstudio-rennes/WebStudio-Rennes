'use strict';
document.documentElement.classList.add('js');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const stages = document.querySelectorAll('.project-stage');
const runningAnimations = new Set();

function changeView(stage, value) {
  const device = stage.querySelector('.project-device');
  const before = device.getBoundingClientRect();
  stage.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === value)));
  stage.dataset.view = value;
  const labels = { perspective: 'Perspective', desktop: 'Ordinateur', mobile: 'Téléphone' };
  const status = stage.querySelector('[data-view-status]');
  if (status) status.textContent = 'Vue ' + labels[value] + ' affichée.';
  const after = device.getBoundingClientRect();
  device.getAnimations().forEach(animation => animation.cancel());
  if (!motion.matches && typeof device.animate === 'function') {
    const animation = device.animate([
      { translate: (before.left - after.left) + 'px ' + (before.top - after.top) + 'px', scale: (before.width / after.width) + ' ' + (before.height / after.height), opacity: .8 },
      { translate: '0 0', scale: '1 1', opacity: 1 }
    ], { duration: 650, easing: 'cubic-bezier(.22,.7,.18,1)' });
    runningAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => runningAnimations.delete(animation));
  }
}
stages.forEach(stage => {
  const buttons = [...stage.querySelectorAll('.device-switch button')];
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => changeView(stage, button.dataset.view));
    button.addEventListener('keydown', event => {
      const offsets = { ArrowRight: 1, ArrowLeft: -1 };
      if (!(event.key in offsets) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + offsets[event.key] + buttons.length) % buttons.length;
      buttons[target].focus();
      changeView(stage, buttons[target].dataset.view);
    });
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: .15 });
  document.querySelectorAll('.project-stage,.approach-steps article,[data-reveal]').forEach(element => observer.observe(element));
}
const progress = document.querySelector('.progress');
const navLinks = [...document.querySelectorAll('[data-nav]')];
const navSections = navLinks.map(link => document.getElementById(link.dataset.nav));
const mobileContact = document.querySelector('.mobile-contact');
const contact = document.getElementById('contact');
const heroActions = document.querySelector('.hero-actions');
const header = document.querySelector('.header');
let framePending = false;
function onScroll() {
  const total = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (total > 0 ? Math.max(0, Math.min(100, scrollY / total * 100)) : 0) + '%';
  let current = -1;
  navSections.forEach((section, i) => { if (section.getBoundingClientRect().top <= innerHeight * .4) current = i; });
  navLinks.forEach((link, i) => { if (i === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  const pj = document.getElementById('projet'), pr = pj ? pj.getBoundingClientRect() : null;
  mobileContact.hidden = heroActions.getBoundingClientRect().bottom > 0 || contact.getBoundingClientRect().top < innerHeight * .8 || !!(pr && pr.top < innerHeight && pr.bottom > 0);
  header.classList.toggle('scrolled', scrollY > 40);
  framePending = false;
}
addEventListener('scroll', () => { if (!framePending) { framePending = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();
motion.addEventListener('change', () => { if (motion.matches) runningAnimations.forEach(animation => animation.cancel()); });

async function copyText(text, status, success) {
  try { await navigator.clipboard.writeText(text); status.textContent = success; }
  catch { status.textContent = 'La copie automatique est indisponible. Sélectionnez le texte affiché pour le copier.'; }
}
document.querySelector('.copy-email').addEventListener('click', () => copyText('timothe.webdesign@gmail.com', document.querySelector('.copy-status'), 'Adresse copiée.'));
document.querySelectorAll('[data-offer]').forEach(link => link.addEventListener('click', () => { document.getElementById('offer').value = link.dataset.offer; invalidateDraft(); }));

/* Envoi direct (désactivé si window.WSR_FORM.endpoint est absent) : même réglage que le questionnaire. */
const CFG = window.WSR_FORM || {};
const LIVE = CFG.enabled === true || /[?&]envoi=test(&|$)/.test(location.search);   // envoi direct : seulement si activé dans config.js (ou essai ?envoi=test)
const ENDPOINT = LIVE && typeof CFG.endpoint === 'string' && /^https:\/\//.test(CFG.endpoint) ? CFG.endpoint : '';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function createDraft(values) {
  const reach = (values.reach || '').trim();
  const message = 'Bonjour,\n\nJe m’appelle ' + values.name.trim() + '.\nMon activité : ' + values.activity.trim() + '\nMon projet : ' + values.offer + (reach ? '\nPour me répondre : ' + reach : '') + '\n\n' + values.message.trim() + '\n\nMerci !';
  const url = 'mailto:timothe.webdesign@gmail.com?subject=' + encodeURIComponent('Projet de site — ' + values.activity.trim()) + '&body=' + encodeURIComponent(message);
  return { message, url };
}
const form = document.querySelector('.contact-form');
let currentDraft = '';
const sendStatus = form.querySelector('.send-status'), submitBtn = form.querySelector('button[type="submit"]'), reachInput = document.getElementById('reach');
let sending = false, sentRef = '';
if (ENDPOINT) {                                   // mode envoi direct : le moyen de réponse devient obligatoire
  submitBtn.textContent = 'Envoyer ma demande';
  reachInput.required = true; reachInput.closest('.field').querySelector('label').innerHTML = 'Comment vous répondre ?';
  const sub = form.querySelector('.form-heading p'); if (sub) sub.textContent = 'Quelques mots suffisent : je vous réponds personnellement, sans engagement.';
  const note = form.querySelector('.form-note');
  note.innerHTML = 'Votre demande n’est transmise que lorsque vous cliquez sur « Envoyer », par un prestataire de réception de formulaires, uniquement pour vous répondre. Si l’envoi échoue, vous pouvez passer par votre messagerie. <a class="pj-link" href="mentions-legales.html#confidentialite">Confidentialité</a>';
}
function showDraft(values) {
  const draft = createDraft(values);
  currentDraft = draft.message;
  document.querySelector('.mail-open').href = draft.url;
  document.querySelector('.message-preview').textContent = draft.message;
  document.querySelector('.message-status').textContent = '';
  document.querySelector('.mail-result').hidden = false;
  return draft;
}
async function sendDirect(values) {
  const reach = (values.reach || '').trim();
  const body = Object.assign({}, CFG.fields || {}, { name: values.name.trim(), activity: values.activity.trim(), project: values.offer, contact: reach, message: values.message.trim(), subject: 'Nouvelle demande : ' + values.activity.trim(), _subject: 'Nouvelle demande de site : ' + values.activity.trim() });
  if (EMAIL_RE.test(reach)) { body.email = reach; body._replyto = reach; }
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('http ' + r.status);
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity() || sending) return;
  const values = Object.fromEntries(new FormData(form).entries());
  if (!ENDPOINT) { showDraft(values); return; }
  sending = true; submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours…'; sendStatus.textContent = '';
  try {
    await sendDirect(values);
    sendStatus.className = 'send-status ok'; sendStatus.textContent = 'Merci, votre demande est bien partie. Je vous réponds ' + (EMAIL_RE.test((values.reach || '').trim()) ? 'à ' + values.reach.trim() : 'au moyen indiqué') + '.';
    form.reset(); invalidateDraft(); if (area && counter) { counter.textContent = '0 / ' + area.maxLength; }
    sendStatus.setAttribute('tabindex', '-1'); sendStatus.focus({ preventScroll: true });
  } catch (e) {
    sendStatus.className = 'send-status err'; sendStatus.textContent = 'L’envoi direct n’a pas abouti. Rien n’est perdu : votre message est prêt ci-dessous, envoyez-le depuis votre messagerie.';
    showDraft(values);
  } finally { sending = false; submitBtn.disabled = false; submitBtn.textContent = 'Envoyer ma demande'; }
});
// Editing invalidates the old draft so the displayed email never silently goes stale.
function invalidateDraft() { document.querySelector('.mail-result').hidden = true; currentDraft = ''; if (sendStatus && sendStatus.classList.contains('err')) { sendStatus.textContent = ''; sendStatus.className = 'send-status'; } }
form.addEventListener('input', invalidateDraft);
submitBtn.disabled = false;
document.querySelector('.copy-message').addEventListener('click', () => copyText(currentDraft, document.querySelector('.message-status'), 'Message copié. Collez-le dans un email à timothe.webdesign@gmail.com.'));

// Textarea counter
const area = document.getElementById('message'), counter = document.getElementById('count');
if (area && counter) {
  const update = () => { counter.textContent = area.value.length + ' / ' + area.maxLength; counter.classList.toggle('near', area.value.length > area.maxLength * .9); };
  area.addEventListener('input', update); update();
}
// After preparing the email, bring the result into view and move focus there (keyboard / screen reader users)
form.addEventListener('submit', () => {
  const result = document.querySelector('.mail-result');
  if (!result.hidden) { result.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'nearest' }); document.querySelector('.mail-open').focus({ preventScroll: true }); }
});
// Offer buttons: preselect the offer, then focus the name field once the scroll starts
document.querySelectorAll('[data-offer]').forEach(link => link.addEventListener('click', () => setTimeout(() => document.getElementById('name').focus({ preventScroll: true }), 600)));

// Pointer effects (fine pointers, no reduced motion)
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !motion.matches) {
  document.querySelectorAll('.offer,.contact-form').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true }));
  stages.forEach(stage => {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      stage.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); });
  });
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => {
    hero.style.setProperty('--hx', (e.clientX / innerWidth - .5).toFixed(3));
    hero.style.setProperty('--hy', (e.clientY / innerHeight - .5).toFixed(3));
  }, { passive: true });
}

/* Lien « Régler un devis » : visible seulement si un moyen de paiement est renseigné dans config.js */
(function () {
  const pay = window.WSR_PAY || {}, link = document.querySelector('.pay-link');
  const ok = (pay.links || []).some(l => l && /^https:\/\//.test(l.url || '')) || !!(pay.virement && pay.virement.iban);
  if (link && ok) link.hidden = false;
})();
