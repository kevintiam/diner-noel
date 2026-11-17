---
title: 'Déposer la preuve de paiement'
type: feature
ticket: '4'
created: '2026-11-15'
status: in-progress
baseline_commit: '249eb34d79a58d62f174cbc29b4bb0ca2cc6b1ae'
baseline_revision: 'cd900f3a9d3f3af58a603f9cc34096e5d1b9348c'
route: dispatch
route_source: auto
risk: medium
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/tickets/epic-reserve-and-pay/epic-reserve-and-pay.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** le participant voit les instructions de paiement mais ne peut pas encore envoyer la preuve de son virement. Les organisateurs n'ont donc rien à vérifier.

**Approche :**
- **Dépôt.** La page du lien personnel reçoit une capture JPG, PNG ou WEBP de 4 Mo au maximum (maquettes 3 et 5).
- **Contrôle du fichier.** Le serveur vérifie le vrai type par la signature du fichier puis par le décodage, réencode l'image en WebP et la stocke en privé (AD-8).
- **Changement de statut.** La réservation passe « À vérifier » par le service unique des changements de statut (AD-4). Pour cela, une mise à jour conditionnelle et la capture sont écrites dans la même transaction (AD-5).
- **Après le dépôt.** La page affiche « Preuve de paiement reçue » (maquette 6) et refuse tout autre dépôt tant que la réservation n'est pas revenue « En attente de paiement ».

## Boundaries & Constraints

**Always :**
- **Dépôt.**
  - Le dépôt passe par le Route Handler `POST /api/reservations/[token]/proofs` (multipart), jamais par une Server Action (AD-8).
  - Les champs reçus sont validés par Zod, et la réponse suit l'enveloppe de l'AD-2, traduite dans la langue envoyée.
  - Les envois sont limités, avec la clé `proof:<empreinte>` (AD-11).
  - La taille est refusée **avant** la lecture du corps quand `content-length` dépasse la limite.
- **Image.**
  - `sharp` ne travaille qu'après la vérification de la signature (JPEG, PNG ou WEBP) ; on refuse tout le reste, y compris le SVG et le HEIC.
  - L'image est réencodée en WebP, côté long de 2 000 px au maximum, sans métadonnées EXIF.
  - Aucun `sharp` ni aucun appel externe ne se fait dans la transaction.
- **Stockage.** La capture n'est jamais modifiée ni supprimée, et une nouvelle n'écrase jamais l'ancienne (AD-8).
- **Statuts.** Toutes les transitions de l'AD-4 sont définies dans un seul fichier, `reservation-status.service.js`. Cette story n'utilise que `PENDING_PAYMENT` → `TO_VERIFY`.
- **Données personnelles.** La page du lien n'affiche que le **prénom** du participant, et ni le nom ni le courriel.
- **Journal.** Le jeton n'apparaît jamais dans le journal.

**Never :**
- Aucune route qui lise ou affiche une capture : c'est la story 2.2, réservée aux organisateurs.
- Ni courriel (story 1.3), ni confirmation ou refus (story 2.3).
- Pas de nouvelle migration, et pas de modification de `next.config.mjs`.
- Pas de `console.log`, pas de push.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Erreur |
|---|---|---|---|
| Dépôt valide | PNG de 1 Mo, case cochée, réservation `PENDING_PAYMENT` | 201, statut `TO_VERIFY`, une ligne `Proof` en `image/webp`, la page affiche « Preuve de paiement reçue » | — |
| Image très grande | JPEG de 4 000 × 3 000 px | stockée à 2 000 px au plus sur le côté long, sans EXIF | — |
| Faux PNG | fichier texte renommé `capture.png` | refus, statut inchangé, aucune ligne `Proof` | 415 `PROOF_INVALID_TYPE` |
| Format refusé | SVG, HEIC, GIF ou image corrompue | refus, statut inchangé | 415 `PROOF_INVALID_TYPE` |
| Fichier trop lourd | 5 Mo ; ou `content-length` supérieur à la limite | refus, sans lire le corps dans le second cas | 413 `PROOF_TOO_LARGE` |
| Sans fichier ou sans la case | champ `proof` absent, ou case non cochée | message par champ, dans la langue | 400 `VALIDATION_ERROR` |
| Second dépôt | réservation déjà `TO_VERIFY` | refus, une seule capture en base ; la page n'affiche plus de formulaire | 409 `RESERVATION_STATUS_CHANGED` |
| Deux dépôts simultanés | deux envois valides en même temps | un seul réussit, une seule capture | 409 pour l'autre |
| Lien inconnu | jeton mal formé ou inexistant | refus ; un jeton mal formé ne touche jamais la base | 404 `RESERVATION_NOT_FOUND` |
| Réservation annulée ou confirmée | statut `CANCELLED` ou `CONFIRMED` | la page affiche l'état, sans formulaire ; un dépôt direct est refusé | 409 |
| Trop d'envois | 21e envoi d'une même adresse IP en 15 minutes | refus | 429 `TOO_MANY_REQUESTS` |
| « Je l'enverrai plus tard » | clic sur le bouton | message « votre place reste réservée… revenez avec ce lien », sans requête | — |

</frozen-after-approval>

## Code Map

- `src/app/[lang]/r/[token]/_components/PaymentDetails.jsx` [à étendre] : choisit l'affichage selon `reservation.status` et passe le jeton au formulaire de dépôt.
- `src/components/reservations/PaymentInstructions.jsx` [à réutiliser] : reste tel quel ; le formulaire de dépôt s'affiche dessous quand le statut est `PENDING_PAYMENT`.
- `src/server/db/reservation.repository.js` : ajouter `firstName` à la lecture pour la page de paiement, ainsi que `findReservationStatusByToken(tx, token)` et `updateReservationStatus(tx, id, from, to)` (`updateMany` conditionnel, qui renvoie le nombre de lignes).
- `src/validation/reservation.schema.js` [à réutiliser] : `isValidPersonalToken` ; ajouter `firstName` au type `ReservationForPayment`.
- `src/server/services/rate-limit.service.js`, `src/lib/client-ip.js`, `src/server/errors/handle-api-error.js` et `src/server/db/transaction.js` [à réutiliser].
- `sharp` 0.35.5 est déjà installé avec Next.js : l'ajouter en dépendance **directe** et exacte dans `package.json`.
- `src/lib/read-limited-form-data.js` (+ test) : lecture bornée du corps multipart, même sans `content-length`, avant son décodage. Réutiliser les API Web du Route Handler documentées dans `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- `src/server/services/organizer.service.js` : les décisions et la consultation admin existent maintenant. Les préserver ; la correction du refus et l'unification des décisions organisateurs relèvent de 2.3, pas du dépôt.
- `src/components/reservations/FreeReservationConfirmation.jsx` : préserver la confirmation gratuite existante ; aucun dépôt pour un montant nul.

## Tasks & Acceptance

**Exécution :**
- [ ] `package.json` : `sharp` 0.35.5 en dépendance directe.
- [ ] `src/lib/image-signature.js` (+ test) : `detectImageType(bytes)` renvoie `jpeg`, `png`, `webp` ou `null`, d'après les octets du début du fichier.
- [ ] `src/validation/proof.schema.js` (+ test) : constantes `MAX_PROOF_BYTES` (4 Mo) et `ACCEPTED_PROOF_TYPES`, plus un schéma Zod des champs du dépôt (`proof` est un `File` non vide de 4 Mo au plus, `confirmTransfer` vaut `on`, `lang` vaut `fr` ou `en`). Messages sous forme de clés ; entrées de mauvais type testées.
- [ ] `src/server/services/proof-image.service.js` (+ test avec de vraies images créées par `sharp`) : `normalizeProofImage(bytes)` renvoie `{ data, mimeType: "image/webp", byteSize }`, ou lève 415.
- [ ] `src/server/services/reservation-status.service.js` (+ test) : table des transitions de l'AD-4 et `transitionReservationStatus(tx, { reservationId, from, to })`, avec 409 si aucune ligne n'a changé.
- [ ] `src/server/db/proof.repository.js`, `src/server/db/reservation.repository.js`, `src/server/services/proof.service.js` (+ `.db.test.js`) : `submitProof({ token, imageBytes })`, dont deux dépôts simultanés et un second dépôt.
- [ ] `src/app/api/reservations/[token]/proofs/route.js` (+ test) : limite → `content-length` → `formData` → Zod → service → 201 `{ data: { status } }`, ou erreur par `handleApiError`.
- [ ] `src/lib/read-limited-form-data.js` (+ test) : plafonner réellement les octets lus, annuler le flux au dépassement et refuser le multipart malformé ; couvrir l'absence d'en-tête et l'en-tête mensonger.
- [ ] `src/components/reservations/ProofUploadForm.jsx` (+ CSS et test) : zone de dépôt, nom et taille du fichier, contrôle de taille et de type avant l'envoi, case de confirmation, envoi par `fetch`, puis `router.refresh()`, et bouton « Je l'enverrai plus tard ».
- [ ] `src/components/reservations/ProofReceived.jsx`, `ReservationStatusNotice.jsx` (+ CSS et tests) : maquette 6 (prénom, code, statut, places, montant, « Et maintenant ? ») et états confirmé ou annulé.
- [ ] `src/lib/format.js` : `formatFileSize(bytes, lang)` (« 1,2 Mo » / « 1.2 MB ») ; `src/i18n/dictionaries/{fr,en}.json` : sections `proof`, `received`, `status` et les codes d'erreur.
- [ ] `e2e/proof.spec.js` : réserver, déposer un PNG puis voir « Preuve de paiement reçue » ; faux PNG refusé ; fichier de 5 Mo refusé ; second dépôt refusé par l'API ; aucune capture ni URL de capture dans la page.

**Critères d'acceptation :**
- Étant donné une réservation déposée, quand on relit la base, alors la capture est en `image/webp`, fait 2 000 px au plus et ne contient aucune métadonnée EXIF.
- Étant donné la page d'une réservation `TO_VERIFY`, `CONFIRMED` ou `CANCELLED`, quand on l'ouvre, alors aucun formulaire de dépôt n'est affiché.
- Étant donné le code de la story, quand on lance `npm run lint`, alors aucun fichier ne dépasse 300 lignes.

## Implementation Notes

- Implémentation du dépôt disponible sur `feature/payment-proof-upload` : normalisation privée, lecture bornée, route API, transaction conditionnelle, formulaire bilingue et affichage des statuts. Aucune migration, aucun commit de cette story, aucun fichier d'environnement réel modifié.
- Lint et build réussis. La suite globale valide 470 tests unitaires et composants. Les 69 cas de base échouent dès leur préparation : Neon refuse l'authentification (`P1000` / `28P01`), y compris hors du bac à sable. Ils ne prouvent donc pas encore l'atomicité/concurrence en base. Les quatre nouveaux parcours Playwright sont découverts mais leur exécution reste à faire après rétablissement de l'accès test.
- Sorties conservées localement dans `node_modules/.cache/proof-verification/` : `vitest.log`, `database.log`, `lint.log`, `build.log`, `prettier.log`, `e2e-list.log`. Prettier global signale cinq fichiers extérieurs à cette story ; ils sont préservés.
- Le statut reste `in-progress` : audit complet de la matrice, revue finale et clôture attendent la validation DB/E2E. Les cases restent ouvertes pour éviter de confondre code écrit et acceptation vérifiée.

## Plan Change Log

- Reprise du 16 novembre 2026 : intention et matrice historiques conservées intégralement. Adaptation des éléments techniques à la gratuité et aux travaux organisateurs présents. La branche `feature/reservation-receipt` contient des modifications non commitées ; l'approbation du plan propose de les conserver et de créer `feature/payment-proof`, sans commit global ni push. Les fichiers personnels et autres stories restent hors du périmètre.
- L'ajout direct de `sharp@0.35.5` est proposé à l'approbation, conformément à AGENTS.md ; version vérifiée dans `node_modules/sharp/package.json`. Aucune autre dépendance, configuration d'outils ou variable d'environnement ne sera modifiée.

## Review Triage Log

## Design Notes

**Ordre de traitement dans le Route Handler :**
1. Limite de requêtes.
2. `content-length` au-delà de `MAX_PROOF_BYTES` + 64 Ko : 413, avant toute lecture du corps.
3. `request.formData()` : une erreur de lecture donne 400.
4. Validation Zod des champs : le fichier est refusé s'il dépasse la limite, avant `arrayBuffer()`.
5. Le service, dont la langue des messages est celle du champ `lang`.

**Précisions de reprise.** Entre les étapes 2 et 3, lire le flux avec un plafond de 4 × 1 024 × 1 024 + 64 × 1 024 octets, puis décoder uniquement ce corps borné ; un en-tête absent ou mensonger ne doit pas contourner le plafond. Le fichier lui-même reste limité à 4 Mio. Valider aussi le jeton et le type multipart ; langue invalide ou illisible : réponse française par défaut. Les journaux utilisent le chemin modèle `/api/reservations/[token]/proofs`, jamais l'adresse réelle. Ne retourner ni octets, ni nom du fichier, ni identifiant de capture, ni coordonnées dans la réponse.

Les transitions conditionnelles du dépôt et l'insertion `Proof` doivent être atomiques ; aucune capture ne doit subsister si l'insertion ou le changement de statut échoue. Conserver le montant et les places. Les changements de statut organisateurs préexistants ne sont pas réécrits dans cette story ; tester le rejet du dépôt dès que le statut n'est plus `PENDING_PAYMENT`. Dans la page, traiter d'abord `CANCELLED`, puis `TO_VERIFY`, puis la confirmation gratuite ou payante, enfin `PENDING_PAYMENT` : une inscription gratuite annulée ne doit pas apparaître confirmée. Ne pas afficher de formulaire et refuser aussi l'envoi direct d'une preuve pour une réservation gratuite.

Les images de test sont synthétiques ; aucun virement réel, aucune capture privée dans `public/`, les fixtures ou les captures de contrôle. Conserver la palette et les composants du formulaire actuel, les deux langues et les focus/messages accessibles. La lecture/visualisation des captures admin reste la story 2.2.

**Service :** contrôle de l'image d'abord, transaction ensuite.

```js
// src/server/services/proof.service.js (forme attendue)
if (!isValidPersonalToken(token)) throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
const image = await normalizeProofImage(imageBytes);          // 415 si ce n'est pas une vraie image
return runInTransaction(async (tx) => {
  const reservation = await findReservationStatusByToken(tx, token);   // null → 404
  await transitionReservationStatus(tx, { reservationId: reservation.id, from: "PENDING_PAYMENT", to: "TO_VERIFY" }); // 0 ligne → 409
  await insertProof(tx, { reservationId: reservation.id, ...image });
  return { status: "TO_VERIFY" };
});
```

**Image.** `sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 })`, puis `.rotate()` (orientation EXIF), `.resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })` et `.webp({ quality: 80 })`. Une erreur de `sharp` devient une 415 : l'erreur est traitée, pas avalée.

**États de la page du lien :**

| Statut | Affichage |
| --- | --- |
| `PENDING_PAYMENT` | instructions et formulaire de dépôt |
| `TO_VERIFY` | `ProofReceived` |
| `CONFIRMED` / `CANCELLED` | `ReservationStatusNotice` |

Texte sous le formulaire (décision D, qui remplace celui de la maquette 5) : « Votre place reste réservée en attendant. Votre capture d'écran est visible seulement par les organisateurs. Sans paiement confirmé, la réservation sera annulée la veille du dîner. »

## Verification

**Commandes :**
- `npm run lint` et `npx prettier --check src e2e prisma "*.js" "*.mjs" "*.json" "*.md"` : attendu aucune erreur (la vérification sur `.` ne fonctionne pas sur cette machine).
- `npm test` : attendu tous les tests au vert, dont `proof.service.db.test.js` sur la base `test`.
- `npm run build` : attendu une construction réussie.
- `npm run test:e2e` : attendu les parcours de dépôt, ainsi que ceux des stories 1.1 et 1.2.
