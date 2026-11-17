- source_plan: `_bmad-output/initiative-reservation-diner-noel/tickets/epic-reserve-and-pay/tickets/story-reserver-des-places-sans-en-vendre-trop-plan.md`
  summary: Remplacer l'empreinte SHA-256 de l'adresse IP de la limite de requêtes par une empreinte à clé secrète (HMAC), et vider régulièrement les lignes `RateLimit` échues.
  evidence: Relecture de la story 1.2. Une empreinte SHA-256 sans secret d'une adresse IPv4 se retrouve en essayant les quelque 4 milliards d'adresses, c'est donc une pseudonymisation et non une anonymisation. Les lignes `RateLimit` restent en base indéfiniment. Corriger demande une nouvelle variable secrète (`.env` et Netlify, à demander à l'utilisateur) et une tâche de nettoyage, à prévoir séparément : la tâche horaire de clôture a été retirée du périmètre le 16 novembre 2026.
- source_plan: none
  summary: Ajouter sur la fiche admin un bouton « Renvoyer l'accusé de réception » qui renvoie le même accusé, dans la langue de la réservation.
  evidence: Séparé le 17 novembre 2026 de la correction « lien personnel introuvable » (choix de l'utilisateur : livrer d'abord l'affichage du lien sur la fiche). Livrable indépendant : il touche l'action et le service d'envoi, et demande une limite contre les envois répétés.
- source_plan: none
  summary: Créer une page publique « Retrouver ma réservation » qui renvoie le lien personnel au courriel de la réservation.
  evidence: Séparé le 17 novembre 2026 de la même correction. Livrable indépendant et plus risqué : il envoie un courriel à une adresse saisie par n'importe qui, donc il exige une limite d'envoi, une réponse identique que l'adresse existe ou non, et l'accord du propriétaire au regard de la contrainte §6 (aucun autre courriel aux participants).
- source_plan: `_bmad-output/initiative-reservation-diner-noel/plan-fiche-admin-lien-personnel.md`
  summary: Dans `src/components/admin/EmailFailureNotice.jsx`, inviter à transmettre le lien personnel, avec un lien vers `#personal-link` (`PERSONAL_LINK_ANCHOR` de `PersonalLinkPanel.jsx`), et adapter son test.
  evidence: Critère 3 du plan non rempli. L'avis appartient à la session qui construit le suivi des échecs de courriel ; l'utilisateur a choisi le 17 novembre 2026 de lui laisser cette phrase.
