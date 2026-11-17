---
title: 'Réserver des places sans en vendre trop'
type: feature
ticket: '2'
created: '2026-11-15'
status: built
baseline_revision: '1d7e66fd990165497822d8e603aed419aed75f65'
baseline_commit: '1d7e66fd990165497822d8e603aed419aed75f65'
route: full
route_source: auto
risk: high
review: quick
review_source: pinned
lenses_ran: [quick, blind-hunter, edge-case-hunter, verification-gap]
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/tickets/epic-reserve-and-pay/epic-reserve-and-pay.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** l'accueil affiche le dîner, mais personne ne peut encore réserver. Les places doivent être prises sans jamais en vendre trop, même quand plusieurs personnes réservent en même temps.

**Approche :** le formulaire bilingue de la maquette 2 crée la réservation dans une transaction qui verrouille l'événement (AD-5). Le code, le lien personnel, le montant, le prix et le courriel Interac sont figés à la création. Le formulaire refuse quand c'est complet ou fermé, limite les envois, puis mène à la page de paiement du lien personnel (maquette 3, sans la partie dépôt).

## Boundaries & Constraints

**Always :**
- Les couches de l'AD-1, l'enveloppe et le convertisseur d'erreurs de l'AD-2 (`handleApiError`), et des clés de dictionnaire pour tous les messages (AD-3).
- La création verrouille la ligne `Event`, puis compte les places avec `sumTakenSeats(tx)`, dans la même transaction (AD-4, AD-5).
- Argent en cents, et prix et courriel Interac copiés dans la réservation (AD-6).
- Jeton de 32 octets aléatoires en base64url, stocké en clair, jamais journalisé (AD-7).
- Limite de requêtes stockée dans Postgres, adresse IP lue par `src/lib/client-ip.js` (AD-11).
- Le service reçoit `now` en paramètre (AD-12). Les lectures se font dans des composants dynamiques sous `<Suspense>` (AD-15).
- 10 places au maximum par réservation (hypothèse de l'initiative). Données fictives dans les tests.

**Never :**
- Pas d'envoi de courriel : c'est la story 1.3.
- Pas de dépôt de capture ni de bouton « Je l'enverrai plus tard » : c'est la story 1.4.
- Pas de lien « Modifier mes informations » (hypothèse de l'initiative).
- Pas de compte participant.
- Pas de nouvelle migration : le schéma de l'AD-17 suffit.
- Pas de `console.log`, pas de push.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Erreur |
|---|---|---|---|
| Réservation valide | 2 places, champs valides, 120 places libres, avant la date limite | réservation `PENDING_PAYMENT`, code `NOEL-` + 4 chiffres, montant 5000 cents, redirection vers `/<langue>/r/<jeton>` | — |
| Page de paiement | `/fr/r/<jeton>` valide | « 50,00 $ », « 2 places × 25,00 $ », courriel Interac, code, mention « Aucun remboursement après le virement » | — |
| Course aux dernières places | 20 réservations simultanées d'une place, 3 places libres | exactement 3 créées, les autres refusées ; places prises = capacité | 409 `SOLD_OUT` |
| Pas assez de places | 3 places demandées, 2 libres | refus, aucune réservation créée | 409 `NOT_ENOUGH_SEATS` |
| Date limite passée | `now` ≥ `bookingDeadline` | refus ; accueil et formulaire affichent « Réservations fermées » | 409 `BOOKING_CLOSED` |
| Complet | 0 place libre | accueil sans bouton « Réserver ma place », formulaire remplacé par « Complet » | — |
| Champs invalides | courriel sans @, 11 places, 0 place, téléphone trop court, valeur non textuelle | messages par champ dans la langue, saisie conservée | 400 `VALIDATION_ERROR` |
| Trop d'envois | 21e envoi d'une même adresse IP en 15 minutes | refus | 429 `TOO_MANY_REQUESTS` |
| Prix changé après coup | prix de l'événement modifié après la réservation | la réservation garde son prix et son montant | — |
| Lien inconnu | `/fr/r/<jeton inexistant>` | page 404 de la langue | `notFound()` |

</frozen-after-approval>

## Code Map

- `src/server/db/reservation.repository.js` : garder `sumTakenSeats(client)`, ajouter la création, la recherche par jeton et `isCodeTaken(tx, code)`.
- `src/server/db/event.repository.js` : ajouter `lockEvent(tx)` (`SELECT … FOR UPDATE` par `$queryRaw` paramétré).
- `src/server/db/prisma-client.js` [à réutiliser] : délais de 5 s pour la connexion et de 8 s pour les requêtes, déjà en place.
- `src/server/services/event.service.js` : `getEventOverview(now)` ajoute `isBookingOpen` et `isClosedByDeadline`. Mettre à jour son test et `EventDetails.jsx`.
- `src/server/errors/handle-api-error.js`, `src/server/errors/app-error.js` [à réutiliser] : enveloppe et traduction.
- `src/app/[lang]/_components/EventDetails.jsx` [à imiter] : `await connection()`, journal sans donnée personnelle, puis `throw new Error("…_FAILED")` générique (constat BH-5 de la story 1.1).
- `src/config/load-test-env.js` [à réutiliser] : les tests base et Playwright ne lisent que `.env.test`.
- `src/i18n/dictionaries/{fr,en}.json` : nouvelles sections `reservation`, `payment`, `validation` et des codes d'erreur. Le test vérifie que les deux fichiers ont les mêmes clés.

## Tasks & Acceptance

**Exécution :**
- [ ] `src/validation/reservation.schema.js` (+ test) : schéma Zod de l'entrée (prénom et nom de 1 à 60 caractères, courriel, téléphone de 10 à 15 chiffres, places de 1 à 10, remarque de 500 caractères au maximum) et son `@typedef`. Messages sous forme de clés ; tests aussi avec des entrées de mauvais type.
- [ ] `src/server/db/transaction.js`, `event.repository.js`, `reservation.repository.js`, `rate-limit.repository.js` : `runInTransaction(work)` (`maxWait` et `timeout` de 10 s), verrou, création, lecture, compteur atomique (Design Notes).
- [ ] `src/server/services/reservation-identifiers.js` (+ test) : code `NOEL-` + 4 chiffres (`crypto.randomInt`) et jeton (`randomBytes(32)` en base64url).
- [ ] `src/server/services/reservation.service.js` (+ `.db.test.js`) : `createReservation(input, { lang, now })` et `getReservationForPayment(token)`. Le test reproduit la course de 20 réservations.
- [ ] `src/server/services/rate-limit.service.js` (+ `.db.test.js`), `src/lib/client-ip.js` (+ test) : `checkRateLimit({ key, limit, windowSeconds, now })`, 20 envois par 15 minutes pour `reserve:<ip>`.
- [ ] `src/server/actions/reservation.actions.js` (+ test) : limite → validation → service. En cas d'erreur, renvoie le corps de `handleApiError` avec la saisie ; en cas de succès, `redirect` **en dehors** du `try`.
- [ ] `src/app/[lang]/reservation/page.jsx` (+ CSS) et `src/components/reservations/ReservationForm.jsx` (+ test) : maquette 2, avec l'étape « 1 sur 2 », le sélecteur moins/plus limité au plus petit de 10 et des places libres, le total calculé, les erreurs par champ et la saisie conservée après une erreur.
- [ ] `src/app/[lang]/r/[token]/page.jsx` (+ CSS), `src/components/reservations/PaymentInstructions.jsx` (+ test), `src/components/ui/CopyButton.jsx` (+ test) : maquette 3, sans le dépôt, avec les boutons « Copier », l'étape « 2 sur 2 » et `robots: noindex`.
- [ ] `src/app/[lang]/_components/EventDetails.jsx`, `src/components/event/BookingCallToAction.jsx` (+ test) : bouton « Réserver ma place », ou « Complet » / « Réservations fermées ».
- [ ] `src/i18n/dictionaries/fr.json`, `en.json` : tous les nouveaux textes.
- [ ] `e2e/reservation.spec.js` : parcours sur téléphone de l'accueil à la page de paiement, en `fr` et en `en`, plus un champ invalide et le cas complet.

**Critères d'acceptation :**
- Étant donné l'accueil sur téléphone, quand un visiteur réserve 2 places en français, alors il arrive sur sa page de paiement en moins de 4 écrans et y voit le montant, le courriel Interac et son code.
- Étant donné une réservation créée, quand on relit la base, alors elle contient le prix, le montant et le courriel Interac de l'instant de création, et la langue de la page.
- Étant donné le code de la story, quand on lance `npm run lint`, alors aucun fichier ne dépasse 300 lignes.

## Implementation Notes

- **Course aux places validée sur la base `test`.** 20 réservations simultanées d'une place pour 3 places libres donnent exactement 3 réservations avec 3 codes distincts ; les 17 autres sont refusées en `SOLD_OUT` (`reservation.service.db.test.js`).
- **Limite de requêtes.** La clé stocke l'empreinte SHA-256 de l'adresse IP plutôt que l'adresse (`buildRateLimitKey`). C'est une pseudonymisation, pas une anonymisation : sans secret, l'adresse se retrouve par force brute. L'empreinte à clé secrète est reportée (`deferred-work.md`). Le compteur reste juste sous 10 envois simultanés.
- **Langue dans le layout.** `usePathname()` du sélecteur de langue bloquait le pré-rendu de `/[lang]/r/[token]`. Le sélecteur est donc placé sous `<Suspense>` dans `layout.jsx`, avec comme repli `LanguageLink` vers l'accueil de l'autre langue. `getOtherLanguage` a été déplacée dans `src/i18n/locales.js`, parce qu'une fonction d'un module `"use client"` ne peut pas être appelée côté serveur.
- **Composants partagés ajoutés :** `src/components/ui/FormField.jsx` (étiquette, aide et erreur reliées) et `src/components/reservations/StepIndicator.jsx`, utilisés par les deux pages.
- **Couleur.** `--color-fir-light` a été ajoutée dans `globals.css` pour le bandeau « Réservation enregistrée », afin de garder les couleurs définies une seule fois.
- **Playwright** tourne avec `workers: 1` : les parcours de réservation modifient la base que les parcours de l'accueil relisent. Chaque parcours de réservation supprime ses réservations à la fin.
- **Page de paiement pour un lien inconnu.** La page 404 de la langue s'affiche, mais le statut HTTP reste 200 : `notFound()` est appelé sous Suspense, alors que l'en-tête de la page est déjà envoyé. Le test vérifie donc le contenu.
- **Piège de Prettier sur cette machine.** `npx prettier --check .` affiche « tout est bon » même quand des fichiers sont mal formatés : le dossier `_bmad/render/…/58d463b8e01a9f6cc09a` renvoie EPERM et Prettier abandonne alors le parcours sans échouer. La vérification a été faite sur des dossiers précis (`src e2e prisma *.js *.mjs *.json *.md`), qui ont révélé puis corrigé 12 fichiers de la story.
- **Correspondance avec la matrice :**

  | Ligne | Couverte par |
  | --- | --- |
  | Réservation valide, prix changé après coup | `reservation.service.db.test.js` et `e2e/reservation.spec.js` |
  | Page de paiement | `PaymentInstructions.test.jsx` et parcours `e2e` |
  | Course aux places, pas assez de places, date limite passée | tests base |
  | Complet | `BookingCallToAction.test.jsx` et `e2e` |
  | « Réservations fermées » | `BookingCallToAction.test.jsx` et `event.service.db.test.js` |
  | Champs invalides | `reservation.schema.test.js`, `reservation.actions.test.js` et `e2e`, saisie conservée comprise |
  | Trop d'envois | `rate-limit.service.db.test.js` et `reservation.actions.test.js` |
  | Lien inconnu | `e2e` et `reservation.service.db.test.js` |

- **Vérification :**
  - `npm run lint` passe, et Prettier passe sur les dossiers précis ;
  - `npm test` : 146 tests au vert (30 fichiers), dont ceux sur la base `test` ;
  - `npm run build` réussit ;
  - `npm run test:e2e` : 15 parcours au vert.

## Plan Change Log

## Review Triage Log

Relecture `quick`, un relecteur indépendant, 15 constats.

| N° | Constat | Verdict | Preuve et décision |
| --- | --- | --- | --- |
| Q-1 | Taper dans le champ « places » : effacer ramène à 1, puis taper 3 donne 13, ramené à 10 places | high | Reproduit à la lecture du `onChange` contrôlé. Patch : le texte tapé est gardé, le nombre est recalé en quittant le champ ; tests ajoutés. |
| Q-2 | « 1 places restantes » quand il reste une place | low | Réel : le formulaire s'ouvre avec 1 place. Patch : clé `reservation.seatsHelpOne` et test. |
| Q-3 | Places affichées périmées après un refus 409 | medium | Réel : `seatsLeft` est fixé au rendu. Patch : `refresh()` de `next/cache` après `SOLD_OUT`, `NOT_ENOUGH_SEATS` ou `BOOKING_CLOSED` ; tests de l'action. |
| Q-4 | Types échangés entre couches définis dans `db/`, et l'interface qui importe un type de `db/` | medium | Contraire à AGENTS §6 et à AD-1. Patch : `NewReservation`, `ReservationForPayment` et `LockedEvent` déplacés dans `validation/*.schema.js`. |
| Q-5 | Jeton de l'adresse non validé par Zod | medium | Contraire à AGENTS §4. Patch : `personalTokenSchema` et `isValidPersonalToken` ; un jeton mal formé ne touche plus la base. La partie « `lang` de l'action » est rejetée (low) : `isLocale` est déjà une liste blanche stricte. |
| Q-6 | Message racine du schéma qui n'est pas une clé ; type de `note` | low | Racine : patch direct (`errors.validation`) et test renforcé. `note` est rejeté : aucun appelant ne peut l'atteindre, `readFormValues` ne renvoie que du texte. |
| Q-7 | Pas de tests pour `ReservationFormSection` et `PaymentDetails` | medium | Réel (AGENTS §5). Patch : deux fichiers de tests (état fermé, plafond, journal sans jeton). |
| Q-8 | Instant exact de la date limite non testé | low | Patch : tests à `now === bookingDeadline` et 1 ms avant, côté service et côté aperçu. |
| Q-9 | Nommage (`t`, `fieldError`, `nameField`) | low | Patch : renommés `getText`, `getFieldError` et `buildNameField`. |
| Q-10 | Chaînes de plus de deux méthodes | low | Patch : `client-ip.js` et `buildRateLimitKey` découpés. |
| Q-11 | JSDoc sans la phrase « ce qu'elle fait » | low | Patch : phrase ajoutée aux 10 composants exportés. |
| Q-12 | Tests qui avalent les erreurs (`.catch(() => undefined)`) | low | Patch : le test de l'action attend `NEXT_REDIRECT` ; celui de la limite vérifie le refus du 21e envoi avant la remise à zéro. |
| Q-13 | `workers: 1` dans Playwright sans accord noté | false | La liste de configuration de `AGENTS.md` §9 ne contient pas Playwright, et le changement est noté dans Implementation Notes ; il est signalé à l'utilisateur. |
| Q-14 | Zod embarqué dans le bundle du téléphone pour une seule constante | medium | Réel : import de `reservation.schema` dans un composant client. Patch : `MAX_SEATS_PER_RESERVATION` dans `reservation-limits.js`, passé en prop. |
| Q-15 | « Adresse IP jamais stockée » exagéré : un SHA-256 sans secret se renverse | medium | Réel. Patch : formulation corrigée (code, test et note). Une empreinte à clé secrète et le nettoyage des lignes sont reportés dans `deferred-work.md`, car ils demandent une nouvelle variable secrète. |

**Verdicts :** 1 high, 6 medium, 7 low, 1 false. Toutes les corrections sont des patchs ; aucun retour au plan.

**Modifications concurrentes de l'utilisateur ou d'un outil externe, gardées :**
- places de type strict (`z.preprocess`) et téléphone limité à 40 caractères, avec leurs tests ;
- attribut `required` et champs désactivés pendant l'envoi ;
- deux tests de collision de codes ;
- dates d'événement repoussées dans le futur dans le `globalSetup` de Playwright ;
- parcours du plafond de places et date de l'accueil calculée par `formatEventDateTime`.

**Vérification finale :**
- `npm run lint` passe, et Prettier passe sur les dossiers précis ;
- `npm test` : 179 tests au vert dans 32 fichiers ;
- `npm run build` réussit ;
- `npm run test:e2e` : 16 parcours au vert.

### Relecture complémentaire

| Référence | Verdict | Preuve et décision |
| --- | --- | --- |
| BH-1 | low | Deux envois explicites créent deux réservations ; aucun code ne relance automatiquement l'action. Une réponse réseau perdue est exceptionnelle et le paiement reste manuel, avec montant visible avant virement. Rejeté : ajouter une politique d'idempotence et une clé publique dépasserait une correction directe. |
| BH-2 | medium | Les champs et le sélecteur restent actifs pendant `isPending` alors que FormData est déjà envoyé. Désactiver les contrôles pendant l'envoi et tester la stabilité du total. Patch. |
| BH-3 | low | Le formulaire peut montrer un ancien tarif si le seed est modifié entre ouverture et envoi ; la réservation copie le prix courant et la page de paiement l'affiche avant tout virement manuel. Rejeté : aucune modification publique du prix n'existe encore, et une reconfirmation imposerait une nouvelle politique métier. |
| BH-4 | false | `notFound()` est bien appelé ; Next conserve 200 après démarrage du flux Suspense et affiche la page introuvable. La matrice demande cette page et `notFound()`, sans code HTTP explicite pour ce document HTML ; la page personnelle est noindex. Rejeté. |
| BH-5 | medium | `z.coerce.number()` accepte booléens et tableaux en dehors du contrat de validation. Limiter la conversion aux nombres et chaînes et tester les mauvais types. Patch. |
| BH-6 | low | Le téléphone accepte une chaîne excessivement longue de séparateurs malgré le plafond de chiffres. Ajouter directement une longueur totale maximale et son test. Patch. |
| BH-7 | low | Les champs obligatoires n'exposent pas cette sémantique aux aides techniques. Ajouter directement `required`, en conservant `noValidate` et la validation serveur. Patch. |
| BH-8 | low | Le refus du presse-papiers est géré sans afficher Copié ; la valeur reste lisible et sélectionnable. Rejeté : ce cas de permission nécessite une nouvelle branche et un nouveau message pour un effet limité. |
| BH-9 | medium | Le serveur utilise l'heure réelle tandis que le seed ferme en décembre 2026 ; les parcours nominaux échoueront ensuite. Préparer uniquement en E2E des dates relatives futures et vérifier la date de cette fixture. Patch. |
| BH-10 | medium | Aucun test n'impose collision puis code libre, ni vingt collisions suivies d'un refus sans insertion. Ajouter des tirages déterministes via la seule source aléatoire externe. Patch. |
| EH-1 | false | Aucun parcours actuel ne produit TO_VERIFY, CONFIRMED ou CANCELLED : ces transitions arrivent avec les stories suivantes. Le seul producteur de la page est la création PENDING_PAYMENT ; aucun défaut actuel atteignable n'est démontré. Rejeté. |
| EH-2 | low | Même cas de réponse perdue que BH-1. Rejeté pour le même motif ; le verrou préserve toujours la capacité totale. |
| EH-3 | low | L'heure injectée est explicitement l'instant de la demande ; elle peut précéder la fin de l'attente bornée du verrou. Rejeté : le contrat repose sur cet instant et une seconde horloge introduirait une nouvelle sémantique pour une fenêtre exceptionnelle. |
| VG-1 | medium | Lacune pré-vérifiée : aucun parcours ne prouve le plafond réel de deux places libres. Ajouter le parcours et restaurer la capacité. Patch. |
| VG-2 | medium | Lacune pré-vérifiée : les tirages réels ne garantissent pas l'exercice de la collision. Même groupe de tests déterministes que BH-10. Patch. |
| VG-autre | medium | Même dépendance à la date réelle que BH-9, confirmée dans les entrées serveur et le globalSetup. Patch, même groupe. |

Groupes retenus : contrôles pendant l'envoi, types des places, longueur du téléphone, sémantique obligatoire, dates E2E, collisions de code, plafond réel des places. Aucun changement de schéma ni de parcours métier ; aucun constat différé.

## Design Notes

**Pourquoi le verrou suffit pour le code.** Toutes les créations passent par le verrou sur `Event`, elles sont donc l'une après l'autre. Vérifier `isCodeTaken` puis insérer est sans risque : on tire un nouveau code tant qu'il est pris, 20 essais au maximum, puis on renvoie une 500.

```js
// src/server/services/reservation.service.js (forme attendue)
return runInTransaction(async (tx) => {
  const event = await lockEvent(tx);                 // null → AppError 500 EVENT_NOT_CONFIGURED
  if (now >= event.bookingDeadline) throw new AppError(409, "BOOKING_CLOSED", "errors.bookingClosed");
  const seatsLeft = event.capacity - (await sumTakenSeats(tx));
  if (seatsLeft <= 0) throw new AppError(409, "SOLD_OUT", "errors.soldOut");
  if (input.seats > seatsLeft) throw new AppError(409, "NOT_ENOUGH_SEATS", "errors.notEnoughSeats");
  // code libre, jeton, montant = seats × event.unitPriceCents, copie de interacEmail, langue FR/EN
});
```

**Compteur atomique** (`rate-limit.repository.js`) : une seule instruction `INSERT … ON CONFLICT ("key") DO UPDATE`. Elle remet `count` à 1 et `windowStart` à `now` quand la fenêtre est échue, sinon elle fait `count + 1`, puis `RETURNING "count"`. Tout passe par `$queryRaw` paramétré. Le service lève `AppError(429, "TOO_MANY_REQUESTS", …)` au-delà de la limite. La limite de 20 envois par 15 minutes tient compte du wifi partagé de l'église.

**Saisie conservée.** React 19 vide un formulaire après une action. L'action renvoie donc aussi les valeurs saisies (sans les journaliser), et le formulaire les remet en `defaultValue`.

**Rendu avec `cacheComponents`.** Les pages `reservation` et `r/[token]` lisent la base et les `params` du jeton dans un composant placé sous `<Suspense>`, qui appelle `await connection()`. `npm run build` le vérifie.

## Verification

**Commandes :**
- `npm run lint` et `npx prettier --check .` : attendu aucune erreur.
- `npm test` : attendu tous les tests au vert, dont la course de 20 réservations sur la base `test`.
- `npm run build` : attendu une construction réussie.
- `npm run test:e2e` : attendu les parcours de réservation en `fr` et en `en`, ainsi que ceux de la story 1.1.

**Vérifications manuelles :**
- Sur téléphone, le sélecteur de places et les boutons « Copier » sont faciles à toucher, et le texte reste lisible.
