/* Réglages du site : seul fichier à modifier pour brancher les services. Aucun service n'est appelé tant qu'il n'est pas renseigné ici.
   Ne jamais mettre de clé secrète dans ce fichier : il est public. Les liens de paiement et l'adresse de réception, eux, peuvent l'être. */

/* 1. Réception des demandes (contact + questionnaire) : arrivent dans votre boîte e-mail.
      Service : FormSubmit, sans compte. Première utilisation : envoyer une demande de test depuis le site en ligne
      puis cliquer le lien d'activation reçu par e-mail. Pour désactiver : enabled: false (le site prépare alors un e-mail). */
window.WSR_FORM = {
  /* true : les boutons « Envoyer » envoient directement dans votre boîte, sans copier ni ouvrir la messagerie (le message
     prêt à copier n'apparaît qu'en cas d'échec). Pour tester sans l'ouvrir : false + ?envoi=test à la fin de l'adresse.
     IMPORTANT : tant que le lien d'activation reçu par e-mail n'a pas été cliqué, les demandes ne parviennent pas.
     Après publication, envoyer immédiatement une demande de test et activer le service AVANT de diffuser le lien. */
  enabled: false,
  endpoint: 'https://formsubmit.co/ajax/timothe.webdesign@gmail.com',
  fields: {
    _captcha: 'false',
    _template: 'table',
    _honey: '',
    _autoresponse: 'Bonjour, merci pour votre message : je l’ai bien reçu et je vous réponds personnellement dès que possible. Timothé, WebStudio-Rennes'
  }
};

/* 2. Règlement en ligne : l'argent arrive sur VOTRE compte chez le prestataire de paiement, puis est reversé sur votre compte bancaire.
      Mode d'emploi complet dans LIRE-MOI.md (section « Recevoir un paiement »).
      - links : un ou plusieurs liens de paiement https créés dans votre compte (Stripe, PayPal, SumUp, etc.).
                Exemple : { label: 'Régler un acompte ou une facture', url: 'https://buy.stripe.com/…', note: 'Montant indiqué sur votre devis' }
      - virement : renseignez vos vraies coordonnées bancaires professionnelles, ou laissez vide pour ne pas proposer le virement.
      - provider : nom du prestataire de paiement (affiché sur la page et à reporter dans les mentions légales).
      Tant que « links » et « virement.iban » sont vides, le lien « Régler un devis » n'apparaît pas dans le pied de page. */
window.WSR_PAY = {
  provider: '',
  links: [],
  virement: { titulaire: '', iban: '', bic: '' }
};
