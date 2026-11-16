---
type: initiative
title: "Les participants réservent et paient leur place au dîner de Noël en ligne, et les organisateurs vérifient chaque paiement"
parent: none
sources: [docs/projet-brief.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md, docs/maquettes/]
after: []
risk: high
---

# Les participants réservent et paient leur place au dîner de Noël en ligne, et les organisateurs vérifient chaque paiement

## Description

Aujourd'hui, les réservations et les paiements du dîner de Noël d'ICC Ottawa se suivent à la main. À la fin de cette initiative, un site bilingue est en production. Les participants y réservent leurs places, paient par virement Interac et déposent la preuve de leur virement. Les quatre organisateurs vérifient chaque virement, confirment ou refusent, et suivent les places et l'argent. Les tâches de fin d'événement (alerte, annulation de la veille, export) tournent seules. Source : `docs/projet-brief.md`. Décisions techniques : l'architecture adoptée en compagnon.

## Outcome

Les participants réservent et paient seuls depuis leur téléphone, et les organisateurs ne suivent plus rien à la main. Le brief mesure la réussite ainsi (§2, §16) : moins de 5 minutes pour réserver et envoyer sa preuve, moins d'une minute pour vérifier un paiement, et zéro place vendue en trop.

## Requirements

- R1 (§3, §4.1, §6): toutes les pages publiques et les courriels aux participants existent en français et en anglais ; le participant choisit sa langue sur chaque page publique.
- R2 (§4.2, §6, §13, §14): la page d'accueil présente le dîner (photos, présentation, compte à rebours vers la date et l'heure du dîner avec la date limite à côté, date, heure, lieu, prix, programme, places restantes) et mène à la réservation par « Réserver ma place ».
- R3 (§3, §4.4, §8, §9): un participant réserve une ou plusieurs places au même prix (maximum à confirmer : 10) avec prénom, nom, courriel, téléphone, nombre de places et remarque facultative, sans créer de compte.
- R4 (§8, §16): les places sont prises dès la création de la réservation et aucune réservation ne dépasse les places restantes, même quand plusieurs arrivent en même temps : zéro place vendue en trop.
- R5 (§6, §8): les réservations ferment automatiquement à la date limite ou quand les places sont épuisées.
- R6 (§4.5, §8): chaque réservation reçoit un code unique, court et lisible (ex. NOEL-4821) et un montant = places × prix d'une place ; le prix et le courriel Interac en vigueur à la création restent figés pour elle.
- R7 (§4.5, §6): après la réservation, le participant voit sur une page dont l'adresse est son lien personnel le montant, le courriel Interac, le code à écrire dans le message du virement et la mention « Aucun remboursement après le virement ».
- R8 (§4.6, §6): le participant reçoit dans sa langue un accusé de réception avec le code, le montant, les instructions Interac, la mention « Aucun remboursement après le virement » et son lien personnel.
- R9 (§4.8, §4.9, §8, §12): avec son lien personnel, le participant dépose une capture JPG, PNG ou WEBP (vrai type vérifié, 4 Mo au maximum) tant que la réservation est « En attente de paiement » ; elle passe « À vérifier » et il voit « Preuve reçue — en attente de vérification » ; une nouvelle capture ne remplace jamais la précédente.
- R10 (§8): le lien personnel est impossible à deviner et n'accepte aucune preuve pendant « À vérifier », ni après une confirmation ou une annulation.
- R11 (§3, §5.1, §6): les quatre organisateurs, avec les mêmes droits, se connectent à un tableau de bord protégé ; sans connexion, aucune page ni donnée du tableau de bord n'est accessible.
- R12 (§5.3, §5.4, §6): un organisateur voit la liste des réservations, filtrable par statut et cherchable par nom ou code, et ouvre une fiche avec les informations du participant, le montant attendu, le code et toutes les captures agrandissables.
- R13 (§5.6, §5.7, §6, §8): un organisateur confirme le paiement d'une réservation « À vérifier » ; le participant reçoit dans sa langue le courriel de confirmation avec le récapitulatif.
- R14 (§4.11, §5.6, §5.7, §8): un organisateur refuse une preuve avec un motif choisi dans une liste (dont « Montant incomplet ») ; la réservation revient « En attente de paiement » sans libérer ses places, et le participant reçoit dans sa langue l'avis de refus avec le motif et le même lien.
- R15 (§6, §8): un organisateur annule une réservation (désistement, doublon), y compris confirmée ; ses places sont libérées et aucun courriel ne part.
- R16 (§8): chaque décision (confirmer, refuser, annuler, annulation automatique) garde la date, l'organisateur quand il y en a un et, pour un refus, le motif.
- R17 (§5.2, §6, §8): le tableau de bord affiche les places confirmées sur le total, les réservations à vérifier et en attente de paiement, le montant encaissé (réservations confirmées + annulées après confirmation) et le montant en attente.
- R18 (§5.8, §6, §8): un organisateur modifie la date et l'heure, la date limite, le nombre de places, le prix, le lieu et le courriel Interac ; la date limite reste avant le dîner, le nombre de places jamais sous les places prises, et les changements ne touchent que les nouvelles réservations.
- R19 (§5.9, §6, §8): deux jours avant l'annulation automatique, s'il reste des réservations « À vérifier », les quatre organisateurs reçoivent un courriel d'alerte et un bandeau s'affiche dans le tableau de bord jusqu'à l'annulation.
- R20 (§8): la veille de l'événement, les réservations « En attente de paiement » et « À vérifier » sont annulées automatiquement, sans courriel au participant.
- R21 (§6): un organisateur exporte en CSV la liste des participants confirmés pour l'accueil le soir du dîner.
- R22 (§12): les captures ne sont visibles que par un organisateur connecté, jamais par une adresse publique, et restent protégées après le dîner.
- R23 (§12): le formulaire de réservation, le dépôt de preuve et la connexion limitent les envois en masse.

## Constraints

- §1, §7 : paiement uniquement par virement Interac ; aucun paiement par carte ni prestataire en ligne.
- §7, §8 : aucun remboursement après un virement, annoncé avant le paiement.
- §6 : aucun autre courriel aux participants que l'accusé de réception, la confirmation et l'avis de refus.
- §9 : collecte minimale ; ni date de naissance, ni adresse, ni information bancaire saisie.
- §10 : sobre et digne, sans emoji ni dégradé ni effet « généré par IA » ; pensé d'abord pour le téléphone, lisible par des personnes âgées ; animations désactivées sous « réduire les animations ».
- §11 : Next.js App Router en JavaScript selon `AGENTS.md`, PostgreSQL + Prisma sur Neon, Zod, Vitest, Testing Library, Playwright.
- §12 : aucune donnée réelle dans les tests ni dans les jeux de données.
- §13 : le courriel Interac a le dépôt automatique activé.
- §17 : mise en ligne le vendredi 20 novembre 2026, première version prête le jeudi 19 novembre ; le reste livré selon l'échéance où il devient utile.
- Décision de l'utilisateur du 2026-11-15 : budget de 0 $ par mois pour l'hébergement et les services.

## Done when

- Le vendredi 20 novembre 2026, le site bilingue est en production. Un participant y réserve et dépose sa preuve sur téléphone, sans aide, en moins de 5 minutes, en français ou en anglais.
- En production, les organisateurs confirment ou refusent chaque paiement depuis le tableau de bord en moins d'une minute, et chaque participant reçoit son accusé de réception puis sa confirmation.
- Aucune place n'est vendue en trop, y compris dans un test de réservations simultanées.
- Avant le dîner, l'alerte et l'annulation de la veille ont tourné en production, et l'export CSV des confirmés est prêt pour l'accueil.
- Aucune capture n'est accessible sans la connexion d'un organisateur.

## Boundaries

- Hors périmètre (§7) :
  - le paiement par carte ou par un prestataire ;
  - les remboursements ;
  - les comptes participants, l'historique et la modification d'une réservation par le participant ;
  - la liste d'attente ;
  - les billets avec code QR ;
  - les tarifs différents ;
  - plusieurs événements ;
  - tout autre courriel aux participants.
- Touch point: virements Interac — les organisateurs les vérifient à la main dans leur banque, et le site ne s'y connecte jamais ; owner: hors du site.
- Touch point: Netlify, Neon et le serveur SMTP — ils sont configurés, pas développés ; owner: epic-reserve-and-pay.
- Parcours de bout en bout : un participant réserve et dépose sa capture (epic-reserve-and-pay) ; un organisateur la confirme et le participant reçoit sa confirmation (epic-verify-payments).

## References

- brief — docs/projet-brief.md, §3 à §17
- architecture — _bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md, AD-1 à AD-17
- design — docs/maquettes/, 9 maquettes ; le brief l'emporte sur elles (§10)
- règles de code — AGENTS.md

## Notes

- Assumption: maximum de 10 places par réservation (brief §15.1).
- Assumption: l'annulation automatique se fait la veille à 0 h, heure d'Ottawa (brief §15.4, architecture AD-12).
- Assumption: le dépôt automatique Interac est exigé, sans question de sécurité (brief §15.6, architecture AD-14).
- Assumption: le lien « Modifier mes informations » de la maquette 3 est retiré (brief §15.5).
- Assumption: le tableau de bord est en français seulement (architecture AD-3).
- Assumption: une confirmation n'est possible que pour une réservation « À vérifier », jamais sans capture (architecture AD-4).
- Open question: liste des motifs de refus en français et en anglais (proposition : aucun virement reçu, montant incomplet, capture illisible ou incorrecte) ; elle attend les organisateurs.
- Open question: l'église contrôle-t-elle un nom de domaine, pour passer les courriels de Gmail à Resend ? Ça ne bloque pas jeudi.
- Open question: les vraies valeurs de l'événement (§13) et les textes de la page d'accueil en français et en anglais sont à fournir d'ici le mercredi 18 novembre. La story de fondation les attend pour son jeu de données de départ.
- Decision (2026-11-15): une capture fait 4 Mo au maximum. C'est le choix de l'utilisateur ; le brief proposait 5 Mo (§15.2), mais 4 Mo reste sous la limite des fonctions serveur (architecture AD-8).
- Decision (2026-11-15): 5 épopées, découpées par capacité et alignées sur les échéances du §17. Les épopées 1 et 2 sont prévues pour jeudi, les épopées 3 et 4 pour la semaine du 23 novembre, l'épopée 5 pour avant le 16 décembre.
- Decision (2026-11-15): l'épopée 5 attend aussi l'épopée 3, parce que les deux modifient la page du tableau de bord (constat de la vérification des dépendances).
- Decision (2026-11-15): les nettoyages (refactor sweep) et la suite de bout en bout passent après la mise en ligne, pour protéger jeudi.
- Decision (2026-11-15): `docs/` reste ignoré par git, volontairement. Le brief et les maquettes ne sont pas dans le dépôt.
- Decision (2026-11-15): toute la maquette 1 de l'accueil est livrée avant la mise en ligne de vendredi (choix de l'utilisateur). L'épopée 4 passe de la semaine du 23 novembre à jeudi 19, juste après l'épopée 1. Les textes sont ceux de la maquette, à titre provisoire, et des cadres photo tiennent lieu de photos en attendant les vraies.