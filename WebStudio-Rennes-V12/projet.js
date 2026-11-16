/* Assistant « Créer mon projet » : questionnaire pas à pas, dossier prêt à envoyer.
   Par défaut aucun service externe : tout reste dans le navigateur et l'envoi passe par la messagerie de la personne.
   Un envoi direct est possible seulement si window.WSR_FORM.endpoint est renseigné (voir LIRE-MOI.md, désactivé par défaut). */
(function () {
  'use strict';
  const root = document.getElementById('pj-app');
  if (!root) return;
  const MAIL = 'timothe.webdesign@gmail.com';
  const KEY = 'wsr-projet-v5';
  const OPT = KEY + '-opt';                                    // case « conserver mon brouillon » : désactivée par défaut
  const CFG = window.WSR_FORM || {};
  const LIVE = CFG.enabled === true || /[?&]envoi=test(&|$)/.test(location.search);   // envoi direct : seulement si activé dans config.js (ou essai ?envoi=test)
  const ENDPOINT = LIVE && typeof CFG.endpoint === 'string' && /^https:\/\//.test(CFG.endpoint) ? CFG.endpoint : '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const METIERS = {
    artisan: 'Artisan (bois, bâtiment, métiers d’art)', restaurant: 'Restaurant, café, traiteur', commerce: 'Commerce de proximité',
    beaute: 'Beauté, coiffure, bien-être', pro: 'Services aux entreprises, conseil', creatif: 'Créatif : photo, design, image', autre: 'Autre activité'
  };
  /* t : text | area | email | tel | one | many */
  const STEPS = [
    { id: 'entreprise', short: 'Entreprise', title: 'Comment s’appelle votre entreprise ?', hint: 'Le nom de votre marque ou de votre activité, tel qu’il doit apparaître sur le site.', fields: [
      { k: 'nom', t: 'text', l: 'Nom de l’entreprise', req: true, ph: 'Ex. Atelier Dubois', max: 80, ac: 'organization' },
      { k: 'ville', t: 'text', l: 'Ville ou zone d’intervention', ph: 'Ex. Rennes et alentours', max: 80, ac: 'address-level2' }] },
    { id: 'activite', short: 'Activité', title: 'Quel est votre métier ?', hint: 'Choisissez ce qui s’en approche le plus, vous préciserez ensuite.', fields: [
      { k: 'metier', t: 'one', l: 'Votre domaine', req: true, opts: Object.values(METIERS) },
      { k: 'precision', t: 'area', l: 'Décrivez votre activité en quelques mots', ph: 'Ex. Fabrication d’escaliers et de bibliothèques sur mesure, depuis 2014.', max: 400 }] },
    { id: 'prestations', short: 'Prestations', title: 'Que proposez-vous, et qu’est-ce qui vous distingue ?', hint: 'Quelques lignes suffisent. Vos mots comptent plus qu’un texte parfait.', fields: [
      { k: 'prestations', t: 'area', l: 'Vos prestations principales (3 à 6)', ph: 'Une par ligne, par exemple : Cuisines sur mesure, Escaliers, Rénovation de meubles', max: 500 },
      { k: 'atouts', t: 'area', l: 'Ce qui vous distingue', ph: 'Savoir-faire, matériaux, manière de travailler, engagement…', max: 500 }] },
    { id: 'objectifs', short: 'Objectifs', title: 'À quoi doit servir votre site ?', hint: 'Choisissez jusqu’à 3 objectifs, du plus important au moins important.', fields: [
      { k: 'objectifs', t: 'many', l: 'Vos objectifs', limit: 3, opts: ['Présenter mes prestations', 'Montrer mes réalisations', 'Être contacté plus facilement', 'Prendre des rendez-vous ou des réservations', 'Vendre ou prendre des commandes', 'Rassurer et inspirer confiance', 'Ouvrir ou relancer mon activité', 'Me démarquer de la concurrence'] }] },
    { id: 'clients', short: 'Clientèle', title: 'Qui souhaitez-vous convaincre ?', hint: 'Plusieurs réponses possibles.', fields: [
      { k: 'cibles', t: 'many', l: 'Vos clients', opts: ['Particuliers', 'Professionnels', 'Collectivités et associations', 'Touristes et visiteurs de passage', 'Clientèle haut de gamme'] },
      { k: 'attentes', t: 'area', l: 'Que veulent savoir vos clients avant de vous contacter ?', ph: 'Prix, délais, zone d’intervention, exemples de travaux…', max: 400 }] },
    { id: 'style', short: 'Style', title: 'Quelle ambiance souhaitez-vous ?', hint: 'Choisissez jusqu’à 3 directions : elles guident toute la conception.', fields: [
      { k: 'style', t: 'many', l: 'Ambiance', limit: 3, opts: ['Moderne et épuré', 'Chaleureux et artisanal', 'Élégant et haut de gamme', 'Audacieux et coloré', 'Sobre et rassurant', 'Naturel et doux', 'Sombre et cinématographique', 'Dynamique et jeune'] },
      { k: 'mots', t: 'text', l: 'Trois mots pour décrire l’ambiance idéale', ph: 'Ex. brut, lumineux, précis', max: 120 }] },
    { id: 'identite', short: 'Identité visuelle', title: 'Avez-vous déjà une identité visuelle ?', hint: 'Logo, couleurs, typographies : tout ce qui existe peut servir de point de départ.', fields: [
      { k: 'logo', t: 'one', l: 'Logo et charte', opts: ['Oui, un logo et une charte', 'Un logo seulement', 'Non, tout est à créer', 'Je ne sais pas'] },
      { k: 'couleurs', t: 'many', l: 'Couleurs envisagées', opts: ['Tons chauds (terre, orangé)', 'Tons froids (bleu, vert)', 'Neutres et sobres', 'Noir et blanc', 'Couleurs vives', 'Tons naturels (bois, végétal)', 'Je vous fais confiance'] },
      { k: 'couleursImposees', t: 'text', l: 'Couleurs imposées ou à éviter', ph: 'Ex. vert foncé de mon enseigne, pas de rose', max: 120 }] },
    { id: 'contenus', short: 'Contenus', title: 'Quels contenus avez-vous déjà ?', hint: 'Il n’est pas nécessaire que tout soit prêt : on avance ensemble.', fields: [
      { k: 'photos', t: 'one', l: 'Photos', opts: ['Des photos professionnelles', 'Des photos prises par moi', 'Très peu ou aucune photo', 'Je souhaite faire réaliser des photos'] },
      { k: 'textes', t: 'one', l: 'Textes', opts: ['Je rédige mes textes', 'Je préfère être aidé(e)', 'Je ne sais pas encore'] },
      { k: 'existant', t: 'text', l: 'Adresse de votre site ou page actuelle, s’il y en a une', ph: 'https://…', max: 200 }] },
    { id: 'pages', short: 'Pages', title: 'Quelles pages et fonctions vous faut-il ?', hint: 'Cochez tout ce qui vous parle. Les fonctions complexes (paiement en ligne, réservation avancée) sont chiffrées sur devis.', fields: [
      { k: 'pages', t: 'many', l: 'Pages et fonctionnalités', opts: ['Accueil', 'Présentation de l’activité', 'Prestations ou carte', 'Galerie de réalisations', 'Tarifs', 'À propos / équipe', 'Prise de rendez-vous', 'Réservation en ligne', 'Boutique ou commande', 'Formulaire de contact', 'Plan d’accès et horaires', 'Questions fréquentes', 'Actualités ou blog', 'Avis de vrais clients (que vous fournissez)', 'Réseaux sociaux'] },
      { k: 'autrePage', t: 'text', l: 'Autre besoin', ph: 'Ex. catalogue PDF à télécharger', max: 160 }] },
    { id: 'inspirations', short: 'Inspirations', title: 'Quels sites vous inspirent ?', hint: 'Même un seul exemple m’aide énormément à cerner vos goûts.', fields: [
      { k: 'inspirations', t: 'area', l: 'Sites que vous aimez, et pourquoi', ph: 'Adresses ou noms de marques, et ce qui vous plaît', max: 500 },
      { k: 'aversions', t: 'area', l: 'Ce que vous ne voulez surtout pas', ph: 'Ex. trop chargé, trop froid, trop de texte', max: 300 }] },
    { id: 'cadre', short: 'Offre et délai', title: 'Offre, échéance et nom de domaine', hint: 'Simple indication de départ : le devis précise tout, et rien ne vous engage.', fields: [
      { k: 'offre', t: 'one', l: 'Point de départ envisagé', opts: ['Site Essentiel : à partir de 490 €', 'Site Développé : à partir de 890 €', 'Refonte d’un site existant', 'Je souhaite en discuter'] },
      { k: 'delai', t: 'one', l: 'Échéance souhaitée', opts: ['Dès que possible', 'Dans 1 à 2 mois', 'Dans plus de 2 mois', 'Pas de date précise'] },
      { k: 'domaine', t: 'one', l: 'Nom de domaine (votre adresse en .fr ou .com)', opts: ['J’ai déjà un nom de domaine', 'Je n’en ai pas encore', 'Je ne sais pas ce que c’est'] }] },
    { id: 'contact', short: 'Vos coordonnées', title: 'Comment puis-je vous joindre ?', hint: 'Ces informations ne servent qu’à vous répondre à propos de ce projet.', fields: [
      { k: 'contactNom', t: 'text', l: 'Votre nom', req: true, ph: 'Prénom et nom', max: 100, ac: 'name' },
      { k: 'email', t: 'email', l: 'Votre e-mail', req: true, ph: 'vous@exemple.fr', max: 120, ac: 'email' },
      { k: 'tel', t: 'tel', l: 'Téléphone (facultatif)', ph: '06 00 00 00 00', max: 30, ac: 'tel' },
      { k: 'canal', t: 'one', l: 'Moyen de contact préféré', opts: ['E-mail', 'Téléphone'] },
      { k: 'message', t: 'area', l: 'Un dernier mot ?', ph: 'Tout ce qui vous semble utile et que je n’ai pas demandé', max: 500 }] }
  ];
  const PRIVATE = ['contactNom', 'email', 'tel', 'canal', 'message']; // jamais enregistrés dans le navigateur
  const N = STEPS.length;
  const allFields = STEPS.flatMap(s => s.fields);
  const F = Object.fromEntries(allFields.map(f => [f.k, f]));

  let A = {}, i = 0, maxI = 0, done = false, ref = '', restored = false, moved = false, resetAsk = false, note = '', keep = false, sending = false, sentOK = false, failed = false;

  /* ---------- stockage local (brouillon, hors coordonnées) ---------- */
  function load() {
    try {
      keep = localStorage.getItem(OPT) === '1';
      if (!keep) return;
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && d.A) { A = d.A; i = Math.min(d.i || 0, N - 1); maxI = Math.min(d.maxI || i, N - 1); note = d.note || ''; restored = Object.keys(A).length > 0; }
    } catch (e) { /* stockage indisponible : le questionnaire fonctionne sans */ }
  }
  function save() {
    if (!keep) return;
    try {
      const keep = {}; Object.keys(A).forEach(k => { if (!PRIVATE.includes(k)) keep[k] = A[k]; });
      localStorage.setItem(KEY, JSON.stringify({ A: keep, i, maxI, note }));
    } catch (e) { /* ignoré */ }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignoré */ } }
  function setKeep(on) { keep = on; try { if (on) { localStorage.setItem(OPT, '1'); save(); } else { localStorage.removeItem(OPT); localStorage.removeItem(KEY); restored = false; } } catch (e) { /* stockage indisponible : la case reste sans effet */ } }
  const keepHTML = () => `<label class="pj-keep"><input type="checkbox" data-keep${keep ? ' checked' : ''}><span>Conserver mon brouillon sur cet appareil <em>(facultatif, sans vos coordonnées ; décochez pour l’effacer)</em></span></label>`;

  /* ---------- rendu ---------- */
  const has = k => { const v = A[k]; return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()); };
  const stepFilled = s => s.fields.some(f => has(f.k));

  function fieldHTML(f) {
    const v = A[f.k];
    if (f.t === 'one' || f.t === 'many') {
      const many = f.t === 'many', type = many ? 'checkbox' : 'radio';
      const sub = many && f.limit ? ' <em>(jusqu’à ' + f.limit + ')</em>' : (f.req ? '' : ' <em>(facultatif)</em>');
      return `<fieldset class="pj-f" data-k="${f.k}"><legend>${esc(f.l)}${sub}</legend><div class="pj-chips">${f.opts.map((o, n) => {
        const on = many ? (v || []).includes(o) : v === o;
        return `<label><input type="${type}" name="${f.k}" value="${esc(o)}"${on ? ' checked' : ''}><span>${esc(o)}</span></label>`;
      }).join('')}</div></fieldset>`;
    }
    const id = 'pj-' + f.k, req = f.req ? ' required aria-required="true"' : '';
    const lab = `<label for="${id}">${esc(f.l)}${f.req ? '' : ' <em>(facultatif)</em>'}</label>`;
    if (f.t === 'area') return `<div class="field">${lab}<textarea id="${id}" name="${f.k}" rows="3" maxlength="${f.max}" placeholder="${esc(f.ph || '')}">${esc(v || '')}</textarea></div>`;
    return `<div class="field">${lab}<input id="${id}" name="${f.k}" type="${f.t}" maxlength="${f.max}" placeholder="${esc(f.ph || '')}"${f.ac ? ' autocomplete="' + f.ac + '"' : ''}${f.t === 'email' ? ' inputmode="email"' : ''}${f.t === 'tel' ? ' inputmode="tel"' : ''}${req} value="${esc(v || '')}" enterkeyhint="next"></div>`;
  }

  function aside() {
    return `<ol class="pj-steps" aria-label="Étapes du questionnaire">${STEPS.map((s, n) => {
      const st = done ? 'done' : n === i ? 'cur' : (n <= maxI && stepFilled(s)) ? 'done' : '';
      return `<li class="${st}"><button type="button" data-go="${n}"${n > maxI && !done ? ' disabled' : ''}${n === i && !done ? ' aria-current="step"' : ''}><b>${String(n + 1).padStart(2, '0')}</b><span>${esc(s.short)}</span></button></li>`;
    }).join('')}</ol>`;
  }

  function stepHTML() {
    const s = STEPS[i], pct = Math.round((i + 1) / N * 100), last = i === N - 1;
    const optional = !s.fields.some(f => f.req);
    return `<div class="pj-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${N}" aria-valuenow="${i + 1}" aria-label="Progression du questionnaire"><i style="width:${pct}%"></i></div>
      <form class="pj-form" novalidate>
        <p class="pj-kicker">Étape ${i + 1} sur ${N} · ${esc(s.short)}</p>
        <h3 class="pj-title" tabindex="-1">${esc(s.title)}</h3>
        <p class="pj-hint">${esc(s.hint)}</p>
        ${i === 0 && note ? `<p class="pj-note">${esc(note)}</p>` : ''}
        ${i === 0 && restored ? `<p class="pj-note">Brouillon retrouvé sur cet appareil, comme vous l’aviez demandé (vos coordonnées ne sont jamais conservées). <button type="button" class="pj-link" data-act="reset">Recommencer à zéro</button></p>` : ''}
        ${s.fields.map(fieldHTML).join('')}
        <p class="pj-err" role="alert" hidden></p>
        ${keepHTML()}
        <div class="pj-nav">
          ${i > 0 ? '<button type="button" class="pj-back" data-act="prev">Précédent</button>' : '<span></span>'}
          <div class="pj-nav-r">
            ${optional && !last ? '<button type="button" class="pj-link" data-act="skip">Passer</button>' : ''}
            <button type="submit" class="button primary pj-next">${last ? 'Voir mon dossier' : 'Continuer'}</button>
          </div>
        </div>
      </form>`;
  }

  /* ---------- dossier ---------- */
  function newRef() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return 'WSR-' + p(d.getFullYear() % 100) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  const val = k => Array.isArray(A[k]) ? A[k].join(', ') : String(A[k] || '').trim();
  function sections() {
    return STEPS.map(s => ({ title: s.short, rows: s.fields.filter(f => has(f.k)).map(f => [f.l, val(f.k)]) }));
  }
  function dossierText() {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    let t = 'DOSSIER PROJET — WEBSTUDIO-RENNES\nRéférence : ' + ref + ' · établi le ' + date + '\nQuestionnaire rempli par le client sur le site, à confirmer lors du premier échange.\n';
    sections().forEach((s, n) => {
      t += '\n' + (n + 1) + '. ' + s.title.toUpperCase() + '\n';
      t += s.rows.length ? s.rows.map(r => '- ' + r[0] + ' : ' + r[1].replace(/\n+/g, ' / ')).join('\n') + '\n' : '- (non renseigné)\n';
    });
    if (note) t += '\nNote : ' + note + '\n';
    return t;
  }
  function compactText() {
    const pick = ['nom', 'ville', 'metier', 'objectifs', 'style', 'pages', 'offre', 'delai', 'contactNom', 'email', 'tel', 'canal'];
    let t = 'DOSSIER PROJET — WEBSTUDIO-RENNES (version abrégée)\nRéférence : ' + ref + '\n\n';
    pick.filter(has).forEach(k => { t += '- ' + F[k].l + ' : ' + val(k) + '\n'; });
    return t + '\n[Le dossier complet est dans mon presse-papiers : je le colle ici si le message est tronqué.]\n';
  }
  function mailHref() {
    const subject = 'Dossier projet — ' + (val('nom') || 'nouveau projet') + ' (' + ref + ')';
    let body = dossierText();
    if (encodeURIComponent(body).length > 1800) body = compactText();
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function summaryHTML() {
    const secs = sections();
    return `<div class="pj-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${N}" aria-label="Questionnaire terminé"><i style="width:100%"></i></div>
      <div class="pj-form pj-done">
        <p class="pj-kicker">Dossier prêt · réf. ${esc(ref)}</p>
        <h3 class="pj-title" tabindex="-1">Voici votre dossier${val('nom') ? ', ' + esc(val('nom')) : ''}.</h3>
        <p class="pj-hint">${sentOK ? 'Votre dossier a bien été envoyé. Je reviens vers vous pour un premier échange, sans engagement. Vous pouvez encore le copier ou le consulter ci-dessous.' : 'Relisez, corrigez si besoin, puis envoyez-le-moi : je reviens vers vous pour un premier échange, sans engagement. Rien n’a été envoyé pour l’instant.'}</p>${ENDPOINT ? `<p class="pj-small" style="margin:-8px 0 16px">En cliquant sur « Envoyer mon dossier », vous acceptez que ces informations me soient transmises par un prestataire de réception de formulaires, uniquement pour répondre à votre demande (<a class="pj-link" href="mentions-legales.html#confidentialite">détails</a>).</p>` : ''}
        <div class="pj-actions">
          ${ENDPOINT ? `<button type="button" class="button primary" data-act="post"${sending || sentOK ? ' disabled' : ''}>${sentOK ? 'Dossier envoyé' : sending ? 'Envoi en cours…' : 'Envoyer mon dossier'}</button>` : ''}
          ${!ENDPOINT || failed ? `<a class="button ${ENDPOINT ? 'secondary' : 'primary'} pj-send" href="${esc(mailHref())}">${ENDPOINT ? 'Ou par e-mail' : 'Envoyer par e-mail'}</a>
          <button type="button" class="button secondary" data-act="copy">Copier le dossier</button>` : ''}
          <button type="button" class="button secondary" data-act="dl">Télécharger (.txt)</button>
        </div>
        <p class="pj-status" role="status" aria-live="polite"></p>
        ${ENDPOINT && !failed ? `<p class="pj-small">Un seul clic suffit : votre dossier arrive directement dans ma boîte e-mail et je vous réponds personnellement. Vous pouvez aussi écrire à <b>${MAIL}</b>.</p>` : `<p class="pj-small">« ${ENDPOINT ? 'Ou par e-mail' : 'Envoyer par e-mail'} » ouvre votre messagerie avec le dossier prêt à partir (une messagerie configurée est nécessaire). Si le message est tronqué, collez le dossier copié. Vous pouvez aussi écrire à <b>${MAIL}</b>.</p>`}
        <div class="pj-sum">${secs.map((s, n) => `<section><h4><span>${String(n + 1).padStart(2, '0')}</span>${esc(s.title)}</h4>${s.rows.length ? `<dl>${s.rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>` : '<p class="pj-empty">Non renseigné</p>'}<button type="button" class="pj-link" data-go="${n}">Modifier</button></section>`).join('')}</div>
        ${keepHTML()}
        <details class="pj-raw"><summary>Voir le dossier en texte brut</summary><pre>${esc(dossierText())}</pre></details>
        <div class="pj-nav"><button type="button" class="pj-back" data-go="${N - 1}">Revenir aux questions</button>${resetAsk ? '<span class="pj-confirm">Effacer toutes les réponses ? <button type="button" class="pj-link" data-act="reset-yes">Oui, effacer</button> <button type="button" class="pj-link" data-act="reset-no">Annuler</button></span>' : '<button type="button" class="pj-link" data-act="reset-ask">Effacer mes réponses</button>'}</div>
      </div>`;
  }

  function render() {
    root.innerHTML = `<aside class="pj-aside">${aside()}</aside><div class="pj-main">${done ? summaryHTML() : stepHTML()}</div>`;
    const main = root.querySelector('.pj-main');
    if (moved) {
      if (!reduce.matches) { main.classList.add('in'); }
      const t = main.querySelector('.pj-title'); if (t) t.focus({ preventScroll: true });
      const r = root.getBoundingClientRect();
      if (r.top < 70 || r.top > innerHeight * .5) root.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function go(n, user) { done = false; i = Math.max(0, Math.min(N - 1, n)); maxI = Math.max(maxI, i); moved = !!user; resetAsk = false; save(); render(); }

  /* ---------- validation et navigation ---------- */
  function validate() {
    const s = STEPS[i], err = root.querySelector('.pj-err');
    for (const f of s.fields) {
      if (!f.req) continue;
      const v = val(f.k);
      if (!v) { return fail(f, f.t === 'one' ? 'Choisissez une réponse pour continuer.' : 'Ce champ est nécessaire pour continuer.'); }
      if (f.t === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return fail(f, 'Cette adresse e-mail semble incomplète.');
    }
    err.hidden = true; return true;
    function fail(f, msg) {
      err.textContent = msg; err.hidden = false;
      const el = root.querySelector(f.t === 'one' || f.t === 'many' ? '[data-k="' + f.k + '"] input' : '[name="' + f.k + '"]');
      if (el) { el.focus({ preventScroll: false }); if (el.setAttribute) el.setAttribute('aria-invalid', 'true'); }
      return false;
    }
  }
  function next() {
    if (!validate()) return;
    if (i === N - 1) { ref = ref || newRef(); done = true; moved = true; save(); render(); return; }
    go(i + 1, true);
  }

  /* ---------- événements ---------- */
  root.addEventListener('submit', e => { e.preventDefault(); next(); });
  root.addEventListener('input', e => {
    const el = e.target, k = el.name;
    if (!k || !F[k]) return;
    if (el.type === 'radio' || el.type === 'checkbox') return;
    A[k] = el.value; el.removeAttribute('aria-invalid');
    const err = root.querySelector('.pj-err'); if (err) err.hidden = true; save();
  });
  root.addEventListener('click', e => {
    const el = e.target;
    if (el.matches && el.matches('input[type=radio]')) {          // un second clic désélectionne
      const k = el.name;
      if (A[k] === el.value) { A[k] = ''; el.checked = false; } else A[k] = el.value;
      afterChoice(); return;
    }
    if (el.matches && el.matches('input[data-keep]')) { setKeep(el.checked); root.querySelectorAll('input[data-keep]').forEach(c => { c.checked = keep; }); status(keep ? 'Brouillon conservé sur cet appareil.' : 'Brouillon effacé de cet appareil.'); return; }
    if (el.matches && el.matches('input[type=checkbox]')) {
      const k = el.name, f = F[k], arr = A[k] ? A[k].slice() : [], at = arr.indexOf(el.value);
      if (el.checked) {
        if (f.limit && arr.length >= f.limit) { el.checked = false; const err = root.querySelector('.pj-err'); err.textContent = 'Vous pouvez choisir ' + f.limit + ' réponses au maximum : décochez-en une d’abord.'; err.hidden = false; return; }
        if (at < 0) arr.push(el.value);
      } else if (at >= 0) arr.splice(at, 1);
      A[k] = arr; afterChoice(); return;
    }
    const b = el.closest && el.closest('[data-act],[data-go]');
    if (!b) return;
    if (b.dataset.go !== undefined) { go(+b.dataset.go, true); return; }
    const act = b.dataset.act;
    if (act === 'prev') go(i - 1, true);
    else if (act === 'skip') go(i + 1, true);
    else if (act === 'copy') copy();
    else if (act === 'post') post();
    else if (act === 'dl') download();
    else if (act === 'reset') { A = {}; note = ''; restored = false; ref = ''; sentOK = false; failed = false; clear(); go(0, true); }
    else if (act === 'reset-ask') { resetAsk = true; moved = false; render(); }
    else if (act === 'reset-no') { resetAsk = false; moved = false; render(); }
    else if (act === 'reset-yes') { A = {}; note = ''; restored = false; ref = ''; sentOK = false; failed = false; maxI = 0; clear(); go(0, true); }
  });
  function afterChoice() { const err = root.querySelector('.pj-err'); if (err) err.hidden = true; save(); }
  root.addEventListener('click', e => {                           // envoi : copie aussi le dossier complet, au cas où la messagerie tronque
    if (e.target.closest && e.target.closest('.pj-send')) { copy(true); }
  });

  function status(msg) { const s = root.querySelector('.pj-status'); if (s) s.textContent = msg; }
  async function copy(silent) {
    const text = dossierText();
    try { await navigator.clipboard.writeText(text); status(silent ? 'Dossier complet copié : collez-le dans l’e-mail s’il apparaît tronqué.' : 'Dossier copié. Collez-le dans un e-mail à ' + MAIL + '.'); return; } catch (e) { /* repli ci-dessous */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
      if (ok) { status('Dossier copié. Collez-le dans un e-mail à ' + MAIL + '.'); return; }
    } catch (e) { /* ignoré */ }
    if (!silent) { const d = root.querySelector('.pj-raw'); if (d) d.open = true; status('La copie automatique est indisponible : sélectionnez le texte affiché ci-dessous.'); }
  }
  async function post() {
    if (!ENDPOINT || sending || sentOK) return;
    sending = true; failed = false; moved = false; render(); status('Envoi en cours…');
    try {
      const body = Object.assign({}, CFG.fields || {}, { ref, nom: val('nom'), metier: val('metier'), contact: val('contactNom'), email: val('email'), _replyto: val('email'), subject: 'Nouveau dossier ' + ref + ' : ' + (val('nom') || 'sans nom'), _subject: 'Nouveau dossier WSR ' + ref + ' : ' + (val('nom') || 'sans nom'), message: dossierText() });
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('http ' + r.status);
      sentOK = true; sending = false; render(); status('Dossier envoyé (réf. ' + ref + '). Je vous réponds à ' + val('email') + '.');
    } catch (e) {
      sending = false; failed = true; render(); status('L’envoi direct n’a pas abouti. Rien n’est perdu : utilisez « Ou par e-mail » ou « Copier le dossier » ci-dessous.');
    }
  }
  function download() {
    try {
      const slug = (val('nom') || 'projet').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projet';
      const url = URL.createObjectURL(new Blob([dossierText()], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'dossier-projet-' + slug + '.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      status('Fichier préparé. S’il ne se télécharge pas, utilisez « Copier le dossier ».');
    } catch (e) { status('Téléchargement indisponible ici : utilisez « Copier le dossier ».'); }
  }

  /* ---------- pré-remplissage depuis l'essai en direct ---------- */
  window.pjPrefill = function (d) {
    d = d || {};
    if (d.nom && !has('nom')) A.nom = d.nom;
    if (d.metier && METIERS[d.metier] && !has('metier')) A.metier = METIERS[d.metier];
    if (d.note) note = d.note;
    if (!done && i === 0) { moved = false; save(); render(); } else { save(); }
  };

  load(); render();
})();
