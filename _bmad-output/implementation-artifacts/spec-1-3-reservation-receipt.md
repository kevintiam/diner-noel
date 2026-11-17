---
title: Envoyer l’accusé de réception après la réservation
type: feature
ticket: '1.3'
created: '2026-11-16'
status: in-progress
route: dispatch
baseline_commit: 249eb34d79a58d62f174cbc29b4bb0ca2cc6b1ae
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Envoyer après réservation un accusé dans la langue enregistrée : code, montant et lien personnel. Préserver la réservation si le courriel échoue.

## Boundaries & Constraints

- Payant : effectifs, montant et adresse Interac figés, code à inscrire au virement, « Aucun remboursement après le virement », lien personnel et paiement en attente de vérification.
- Gratuit : inscription déjà confirmée, effectifs et lien ; aucun virement ni preuve demandés.
- Français/anglais, texte et HTML avec échappement des valeurs ; ni téléphone, nom de famille, ni remarque.
- SMTP après transaction, avant retour du service, avec délais bornés ; aucune file ni relance automatique.
- Adaptateur unique `sendEmail({ to, subject, text, html })`, réutilisable. Nodemailer seulement dans `server/email/` ; services sans Next.
- Échec journalisé avec événement stable et identifiant interne seulement ; aucune donnée personnelle, secret, URL, erreur brute ou contenu de message.
- Ajouter `nodemailer@10.6.0`, vérifié au registre ; exemples fictifs uniquement. Aucun `.env` réel, réglage d’outils, déploiement, push, migration ou changement du formulaire.
- Préserver les fichiers externes à la story, notamment le travail organisateurs apparu pendant la session.

## I/O & Edge-Case Matrix

| Situation | Entrée | Résultat attendu | Erreur |
| --- | --- | --- | --- |
| Payant | FR/EN | Accusé et lien dans la langue enregistrée | — |
| Gratuit | Montant nul | Confirmation sans paiement | — |
| Transaction refusée | Validation, capacité ou base | Aucun envoi | Erreur existante |
| SMTP indisponible | Refus, délai ou configuration absente | Réservation conservée | Journal confidentiel |
| Caractères HTML | Prénom spécial | Texte littéral | Aucune injection |
| Tarif modifié | Après insertion | Valeurs figées | Aucun recalcul |
| Tests | SMTP réel hérité | Aucune connexion SMTP réelle | Isolation |

</frozen-after-approval>

## Code Map

- `src/server/services/reservation.service.js` : notifier après résolution de `runInTransaction`, retour public `{ code, token }` préservé.
- `src/server/db/reservation.repository.js` : étendre seulement la sélection interne d’insertion ; lecture publique inchangée.
- `src/validation/reservation.schema.js`, nouveau `email.schema.js` : types échangés et validation.
- Nouveau `src/server/services/reservation-receipt.service.js` : notification et échec non annulant.
- Nouveaux `src/server/email/send-email.js`, `templates/reservation-receipt.js` : transport et modèle ; réutiliser dictionnaires, `formatMoney`, `logger`.
- `src/config/env.js` : validation séparée à première utilisation de `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. URL fiable, jamais issue des en-têtes.
- `src/config/load-test-env.js` : neutraliser SMTP hérité/développement ; URL locale fictive, isolation de base inchangée.
- `src/i18n/dictionaries/{fr,en}.json` : textes, clés identiques.
- `package.json`, `package-lock.json`, `.env.example`, `README.md` : dépendance et configuration fictive/documentée.

## Tasks & Acceptance

- [ ] Dépendance, types et configuration : tests normaux, limites, types invalides et confidentialité.
- [ ] Modèle : tests de la matrice FR/EN, gratuité, valeurs figées, lien et échappement.
- [ ] Transport : TLS selon port, délais explicites, journaux techniques désactivés ; Nodemailer simulé.
- [ ] Notification après commit : tests d’ordre, succès, transaction refusée et panne ; simuler les frontières externes.
- [ ] Tests voisins des fichiers ci-dessus et tests base existants : préserver concurrence, fermeture, gratuité et redirection sans envoi réel.
- [ ] Documentation des variables et réception manuelle sur aperçu.

Étant donné une réservation anglaise, quand elle est enregistrée, alors son courriel et son lien sont anglais et la redirection fonctionne.

Étant donné une panne SMTP, quand la réservation est enregistrée, alors ses places et son montant sont conservés sans détail personnel journalisé.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

SMTP hors transaction libère le verrou avant le réseau. Utiliser les valeurs insérées sans relire l’événement. Configuration courriel indépendante du build. Services testés avec `sendEmail` simulé ; navigateur avec SMTP neutralisé pour vérifier la poursuite malgré son indisponibilité.

## Verification

- Lint, Prettier, maximum 300 lignes par fichier source/test.
- `npm test -- --maxWorkers 1` : nouveaux cas et régressions, base dédiée comprise.
- `npm run test:e2e` : build et parcours bilingues payants/gratuits.
- Après configuration par le propriétaire : réception anglaise réelle sur aperçu et ouverture du lien. Aucun secret dans le chat ; acceptation externe ouverte jusque-là.
- Référence technique : [transport SMTP Nodemailer](https://nodemailer.com/smtp).
