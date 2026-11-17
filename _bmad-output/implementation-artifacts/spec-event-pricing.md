---
title: Présenter les informations réelles du dîner et appliquer les tarifs par âge
type: feature
created: 2026-11-16
status: in-progress
route: dispatch
baseline_commit: 7885cd5a3fb759bbb1154f71ce6b969f0973736d
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Le propriétaire fournit les informations de l'événement : tenue « Tous aux couleurs de Noël », tarif des personnes de 15 ans et plus de 30 $ pendant une promotion de deux semaines puis de 35 $, et gratuité pour les enfants de 0 à 14 ans. L'accueil et le montant demandé lors de la réservation doivent rester cohérents.

Le site facture actuellement chaque place au tarif unique de l'événement. La nouvelle demande remplace la contrainte historique de tarif unique. Présenter les informations en français et en anglais, distinguer les effectifs payants et gratuits dans la réservation, et calculer le montant côté serveur selon le calendrier confirmé.

Décisions du propriétaire du 16 novembre 2026 : la promotion commence vendredi 20 novembre et dure deux semaines, soit du 20 novembre à 00 h au 4 décembre à 00 h (borne de fin exclue), heure d'Ottawa. Les enfants sont inclus dans les réservations et décomptés de la capacité. Aucune personne de 15 ans et plus n'est obligatoire dans une réservation.

Le propriétaire a répondu « oui » à la confirmation suivante : masquer les compteurs publics de places restantes et de capacité, conserver les quantités adultes/enfants dans le formulaire, et autoriser la création et l'application de la migration proposée sur les bases de développement et de test. Le plan est approuvé ; aucun commit ni push n'est autorisé. Cette autorisation exclut la production.

## Boundaries & Constraints

- Préserver les modifications existantes et la consigne explicite : aucun commit ni push.
- Garder le prix appliqué et le montant figés sur chaque réservation existante ; aucun recalcul rétroactif au changement de tarif.
- Ne collecter ni date de naissance ni identité d'enfant : seuls les effectifs par tranche sont nécessaires.
- Maintenir la validation serveur, la limitation des envois et la protection transactionnelle contre la surréservation.
- Conserver le français/anglais et les états ouvert, complet et fermé.
- Créer une nouvelle migration additive et l'appliquer sur les seules bases de développement et de test, conformément à l'accord reçu. Ne pas modifier une migration appliquée, toucher à la production, ni relancer un seed qui écraserait les autres paramètres de l'événement de développement.
- Ne modifier ni dépendance, ni configuration d'outils, ni fichier d'environnement. Ne pas réinitialiser les bases de développement ou de production.

## I/O & Edge-Case Matrix

| Situation | Entrée | Résultat attendu | Erreur |
| --- | --- | --- | --- |
| Promotion active | 2 personnes de 15 ans et plus et 2 enfants | Montant de 60 $, enfants gratuits | — |
| Promotion terminée | Mêmes effectifs | Montant de 70 $ | — |
| Réservation gratuite | 0 personne de 15 ans et plus et 2 enfants | Montant de 0 $, deux places prises ; confirmation sans virement ni dépôt de preuve | — |
| Ancienne réservation | Réservation créée avant le changement de tarif | Montant et prix conservés | — |
| Effectifs invalides | Nombre négatif, fraction, texte ou effectifs tous nuls | Réservation refusée sans insertion | Validation par champ |
| Capacité insuffisante | Effectif dépassant les places selon la politique confirmée | Refus sans dépassement, y compris en concurrence | Conflit métier |
| Affichage bilingue | Accueil français ou anglais | Tenue, seuil de 15 ans, gratuité jusqu'à 14 ans et tarifs concordants | — |
| Compteurs masqués | Accueil et formulaire, dans chaque langue | Aucun compteur de places restantes, capacité ou barre de progression ; les quantités adultes/enfants restent disponibles et les états complet/fermé sont conservés | — |

</frozen-after-approval>

## Code Map

- `src/components/home/PracticalInfoCards.jsx`, `HeroEventFacts.jsx`, leurs styles et `src/i18n/dictionaries/{fr,en}.json` : tenue et présentation des tarifs ; remplacer le texte actuel « par place » de façon cohérente.
- `src/components/reservations/ReservationForm.jsx`, `PaymentInstructions.jsx` : saisie des effectifs et détail du montant ; conserver le parcours réel, les contrôles pendant l'envoi et les montants figés.
- `src/validation/reservation.schema.js`, `event.schema.js` : validations et types JSDoc des effectifs, du calendrier et des données échangées.
- `src/server/services/event.service.js`, `reservation.service.js` : exposer le prix effectif et calculer le montant côté serveur, dans le parcours transactionnel existant.
- `src/server/db/event.repository.js`, `reservation.repository.js` : lectures et écritures des données de tarification ; maintenir le verrou et le calcul des places.
- `prisma/schema.prisma`, `prisma/default-event.js` : le modèle actuel ne conserve ni calendrier promotionnel ni décompte par tranche ; préparer l'évolution et la préservation des anciennes réservations après les réponses. Ne pas créer de migration avant autorisation.
- `src/components/home/FinalCallToAction.jsx` : supprimer le compteur et la barre, conserver l'appel à réserver. `SeatsProgress.jsx` reste sur disque ; aucun retrait de fichier n'est demandé.
- `src/server/actions/reservation.actions.js` : lire les deux effectifs dans le formulaire et conserver la saisie en cas d'erreur ; la redirection vers le lien personnel reste commune aux réservations gratuites et payantes.
- `src/app/[lang]/r/[token]/_components/PaymentDetails.jsx` : choisir une confirmation gratuite (sans instructions Interac ni dépôt) pour les réservations de montant nul. Conserver l'affichage du code et des effectifs.
- `src/server/services/event-pricing.service.js` et son test : isoler le choix du prix normal/promotionnel pour le réutiliser dans l'aperçu public et la transaction de réservation. Avant le 20 novembre et dès le 4 décembre, le prix normal est de 35 $ ; afficher distinctement la période à 30 $ pour éviter de promettre une promotion active hors période.
- `e2e/home.spec.js`, `e2e/reservation.spec.js` et les tests voisins des composants/services/schémas : adapter les assertions remplacées par les nouvelles exigences, sans retirer ni désactiver les scénarios de fermeture, concurrence, erreurs ou navigation. Garder chaque fichier sous 300 lignes et découper en nouveaux fichiers de tests si nécessaire.

## Tasks & Acceptance

- [x] Confirmer les règles, le retrait des compteurs publics et l'autorisation de migration en développement/test.
- [ ] Adapter les schémas, services et dépôts ; ajouter les tests des tarifs, bornes de dates, effectifs et capacité avant de corriger le comportement.
- [ ] Adapter l'accueil, le formulaire et le récapitulatif de paiement avec leurs tests de composants dans les deux langues.
- [ ] Créer et appliquer la migration additive autorisée en développement et test, vérifier les nouvelles colonnes et la conservation des anciennes réservations sans afficher leurs données.
- [ ] Compléter les parcours Playwright avec une réservation mixte et les deux tarifs.

Étant donné l'accueil dans chaque langue, quand le visiteur consulte les informations pratiques, alors il comprend la tenue demandée et le tarif de chaque tranche d'âge.

Étant donné un formulaire valide, quand la réservation est créée, alors le montant présenté et celui stocké suivent la même règle serveur, sans modifier les réservations antérieures.

## Implementation Notes

Accord explicite reçu sur les compteurs, le plan et la création/application de la migration aux seules bases de développement et de test. Le dépôt contient déjà l'accueil refait et ses corrections non commitées ; les préserver, ainsi que le script personnel et les autres documents. Ne pas ajouter de dépendance ni modifier de configuration d'outils. Toute commande réseau refusée dans le bac à sable doit être relancée avec la demande d'escalade adaptée.

## Design Notes

Proposition concrète pour l'évolution additive de la base :

- `Event` : conserver `unitPriceCents` comme tarif normal (3 500 cents) et ajouter `promotionalUnitPriceCents`, `promotionStartsAt`, `promotionEndsAt`, tous facultatifs pour préserver les usages sans promotion. Pour cet événement : 3 000 cents, début `2026-11-20T05:00:00Z`, fin `2026-12-04T05:00:00Z`.
- `Reservation` : conserver `seats` comme total et ajouter `childSeats Int @default(0)`. Les personnes de 15 ans et plus sont calculées par `seats - childSeats`. Les anciennes réservations ont zéro enfant et gardent intégralement leur montant, tarif, statut et preuve.
- La nouvelle migration ajoute ces colonnes et initialise les nouveaux tarifs/calendrier de l'événement, sans réinitialiser ni supprimer de table. Elle ne modifie pas les réservations existantes. Les anciens montants, prix et statuts sont préservés ; `childSeats` vaut zéro sur les anciennes lignes. Pour un nouvel événement, le seed reprend les mêmes tarifs et dates.
- La gratuité complète crée directement une réservation `CONFIRMED`, avec `confirmedAt` renseigné ; le lien personnel affiche une confirmation gratuite à la place des instructions Interac. Les réservations payantes restent `PENDING_PAYMENT`. Cette distinction évite de demander un virement de zéro dollar ou d'annuler ultérieurement une inscription gratuite pour absence de preuve.
- Les effectifs adultes/enfants doivent être entiers et positifs ou nuls, avec un total de 1 à 10 ; le plafond existant de dix participants est préservé. Le serveur valide leur somme et compte adultes et enfants sous le même verrou de capacité.

## Spec Change Log

## Review Triage Log

## Verification

- `npm run lint` : aucune erreur et respect de 300 lignes par fichier.
- `npm test -- --maxWorkers 1` : services, validation, composants et base dédiée réussis.
- `npm run test:e2e` : build et parcours bilingues réussis ; contrôle mobile et ordinateur de l'affichage des tarifs et de la tenue.
