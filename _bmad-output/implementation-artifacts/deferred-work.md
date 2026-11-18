
- source_spec: `spec-home-noel-de-grace.md`
  summary: Définir le format des adresses ou une ville explicite avant de supporter province et code postal dans getAddressCity.
  evidence: Le helper existant prend le dernier segment après virgule ; le seed actuel fonctionne, mais une adresse étendue afficherait le mauvais lieu.

- source_spec: `spec-home-noel-de-grace.md`
  summary: Aligner le plan historique de lively-home et ses cases sur la nouvelle direction Noël de Grâce.
  evidence: L’ancien plan interdit photo et compte à rebours et exige un bandeau vert avec verset ; la demande actuelle et sa nouvelle spécification les remplacent. Les cases restent décochées malgré les notes de réalisation.

- source_spec: `spec-home-noel-de-grace.md`
  summary: Remplacer le contact fictif du pied de page avant la publication.
  evidence: La relecture du 16 novembre constate que SITE_CONTACT_EMAIL vaut encore contact@example.org ; le propriétaire doit fournir l'adresse réelle. Valeur préexistante, hors correction du compte à rebours.

- source_spec: `spec-home-noel-de-grace.md`
  summary: Compléter les parcours E2E par une fermeture des réservations à la date limite dans les deux langues.
  resolution: Parcours ajoutés dans e2e/booking-deadline.spec.js, y compris un formulaire déjà ouvert avant la fermeture.
  evidence: Les composants couvrent l'état fermé, mais les parcours navigateur ne modifient pas encore bookingDeadline pour vérifier ensemble les deux appels à réserver. Lacune de couverture préexistante, sans défaut applicatif démontré.
- source_spec: `story-deposer-la-preuve-de-paiement-plan.md`
  summary: Vérifier le délai effectif de lecture des uploads suspendus sur le déploiement avant de choisir une échéance applicative (medium non vérifié).
  resolution: Budget applicatif global de 30 s et budget navigateur de 45 s ajoutés, avec tests de flux suspendus, lents et annulation bloquée. Le comportement effectif du runtime hébergé reste à observer après publication.

- source_spec: `spec-partages-maintenance-et-verification.md`
  summary: Limiter l’acquittement des échecs de courriel aux identifiants réellement affichés à l’organisateur.
  evidence: Revue Blind 1 / Edge 1 : resolveOpenEmailFailures acquitte toutes les lignes ouvertes, même une ligne arrivée depuis la lecture. Comportement du chantier courriel antérieur à cette tâche, à corriger dans celui-ci.

- source_spec: `spec-partages-maintenance-et-verification.md`
  summary: Conserver un avis immédiat de secours quand le courriel et l’enregistrement EmailFailure échouent tous deux.
  evidence: Revue Blind 2 / Edge 2 : l’ancien avis a été supprimé dans les modifications de courriel initiales ; recordEmailFailure absorbe sa panne et la fiche peut ne montrer aucun avertissement malgré emailSent=false.

- source_spec: `spec-partages-maintenance-et-verification.md`
  summary: Borner l’affichage des échecs de courriel de la vue d’ensemble en conservant le compteur total.
  evidence: Revue Blind 7 : la liste complète est chargée par le chantier EmailFailure préexistant ; une panne SMTP durable peut allonger fortement l’accueil admin.
  evidence: La lecture multipart borne les octets mais pas sa durée ; la rétention indéfinie dépend du timeout du runtime hébergé, encore non établi. Les deux revues signalent le même scénario ; reproduire un flux suspendu sur un environnement contrôlé permettrait de le qualifier.
