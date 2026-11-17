---
type: epic
title: "Les participants réservent et paient en ligne"
parent: initiative-reservation-diner-noel
covers: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R22, R23]
sources: [_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md]
after: []
refined: true
risk: high
---

# Les participants réservent et paient en ligne

## Description

Cette épopée ouvre le site. Elle met en place la fondation technique (déployée sur Netlify, avec la base Neon), l'accueil simple et bilingue, la réservation sans place vendue en trop, l'accusé de réception et le dépôt de la preuve avec le lien personnel. Pour les exigences partagées avec d'autres épopées, elle livre la partie participant :
- les pages et l'accusé de réception bilingues (R1) ;
- l'accueil sans photos ni compte à rebours (R2) ;
- le stockage privé des captures (R22) ;
- la limite des envois sur la réservation et le dépôt (R23).

## Outcome

Un participant réserve et dépose sa preuve seul depuis son téléphone, en français ou en anglais, sur le site en production.

## Requirements

- R1 (parent R1): partie participant. Les pages publiques et l'accusé de réception existent en français et en anglais ; le participant choisit sa langue sur chaque page publique.
- R2 (parent R2): partie simple. La page d'accueil présente la date, l'heure, le lieu, le prix et les places restantes, et mène à la réservation par « Réserver ma place ».
- R3 (parent R3): un participant réserve une ou plusieurs places au même prix (maximum à confirmer : 10) avec prénom, nom, courriel, téléphone, nombre de places et remarque facultative, sans créer de compte.
- R4 (parent R4): les places sont prises dès la création de la réservation et aucune réservation ne dépasse les places restantes, même quand plusieurs arrivent en même temps : zéro place vendue en trop.
- R5 (parent R5): les réservations ferment automatiquement à la date limite ou quand les places sont épuisées.
- R6 (parent R6): chaque réservation reçoit un code unique, court et lisible (ex. NOEL-4821) et un montant = places × prix d'une place ; le prix et le courriel Interac en vigueur à la création restent figés pour elle.
- R7 (parent R7): après la réservation, le participant voit sur une page dont l'adresse est son lien personnel le montant, le courriel Interac, le code à écrire dans le message du virement et la mention « Aucun remboursement après le virement ».
- R8 (parent R8): le participant reçoit dans sa langue un accusé de réception avec le code, le montant, les instructions Interac, la mention « Aucun remboursement après le virement » et son lien personnel.
- R9 (parent R9): avec son lien personnel, le participant dépose une capture JPG, PNG ou WEBP (vrai type vérifié, 4 Mo au maximum) tant que la réservation est « En attente de paiement » ; elle passe « À vérifier » et il voit « Preuve reçue — en attente de vérification » ; une nouvelle capture ne remplace jamais la précédente.
- R10 (parent R10): le lien personnel est impossible à deviner et n'accepte aucune preuve pendant « À vérifier », ni après une confirmation ou une annulation.
- R11 (parent R22): partie stockage. Les captures sont stockées en privé, sans aucune adresse publique.
- R12 (parent R23): partie réservation et dépôt. Le formulaire de réservation et le dépôt de preuve limitent les envois en masse.

## Constraints

- Celles de l'initiative s'appliquent toutes :
  - Interac seulement, aucun remboursement ;
  - trois courriels au plus pour les participants ;
  - collecte minimale ;
  - design sobre, pensé pour le téléphone ;
  - la stack du §11 ;
  - aucune donnée réelle dans les tests ;
  - dépôt automatique Interac ;
  - budget de 0 $.
- Échéance : en production le jeudi 19 novembre 2026 au soir (§17).

## Done when

- En production (Netlify et Neon), un participant réserve en français et en anglais et arrive sur la page de paiement de son lien personnel.
- Un test de réservations simultanées ne vend aucune place en trop.
- L'accusé de réception arrive dans une vraie boîte, dans la langue de la réservation.
- Une capture déposée fait passer la réservation « À vérifier », et aucune adresse publique ne mène à elle.
- `lint`, `test` et `test:e2e` passent sur la branche fusionnée dans `main`.

## Boundaries

- Hors de cette épopée :
  - la lecture des captures et la connexion des organisateurs (epic-verify-payments) ;
  - les photos, la présentation, le programme, le compte à rebours et les animations (epic-lively-home).
- Touch point: Netlify, Neon et le serveur SMTP sont configurés ici, pas développés ; owner: epic-reserve-and-pay.

## References

- parent — _bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md, section Requirements
- architecture — _bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md, en particulier AD-3, AD-5 à AD-8, AD-10, AD-11, AD-15 à AD-17
- design — docs/maquettes/ : 1. Accueil, 2. Réservation, 3. Paiement Interac et preuve, 4. Courriel d'accusé de réception, 5. Dépôt de la preuve plus tard, 6. Preuve reçue

## Notes

- Decision (2026-11-15): les exigences sont reprises des seules lignes de l'initiative ; l'architecture règle le reste.
- Decision (2026-11-15): le tracer bullet est la story 1, « Fondation ». Elle fait le chemin le plus court à travers toutes les couches (page → service → base Neon, déployée sur Netlify), et sa mise en place est faite par l'utilisateur. La story 2 (concurrence) suit parce que c'est la moins sûre.
- Decision (2026-11-15): les stories 3 et 4 avancent en parallèle. Elles ne partagent que les dictionnaires : chacune ajoute ses clés dans sa propre section (`email.*` pour la 3, `proof.*` pour la 4), et un conflit de fusion simple est accepté.
- Decision (2026-11-15): le nettoyage (story 5) passe après la mise en ligne.
