---
title: 'Fondation : l''accueil bilingue affiche le dîner depuis la base, en ligne'
type: feature
ticket: '1'
created: '2026-11-15'
status: built
baseline_revision: '5731c827fc48b3a1c85d5f395afd957bd09622fd'
baseline_commit: '5731c827fc48b3a1c85d5f395afd957bd09622fd'
route: full
route_source: auto
risk: medium
review: thorough
review_source: pinned
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap]
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/tickets/epic-reserve-and-pay/epic-reserve-and-pay.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** le dépôt ne contient que le starter Next.js : pas de base de données, pas d'outils de test, pas de langues, pas de déploiement. Aucune autre story ne peut démarrer.

**Approche :** poser la fondation (squelette A de `AGENTS.md`, schéma complet exigé par AD-17) et la prouver par le chemin le plus court. L'accueil `/fr` et `/en` lit le dîner et les places restantes dans Neon, et ce chemin tourne sur Netlify.

## Boundaries & Constraints

**Always :**
- Couches de l'AD-1 respectées. Seul `src/server/db/` importe le client Prisma.
- Schéma complet de l'AD-17 (tous les modèles, toutes leurs colonnes), créé en une seule migration initiale.
- Tout texte public vient de `fr.json` / `en.json`, qui ont les mêmes clés.
- Les lectures de la base se font dans un composant dynamique qui appelle `await connection()`, placé sous `<Suspense>`. Jamais de `"use cache"` (AD-15).
- Heures stockées en UTC, conversions seulement dans `src/lib/dates.js` (`America/Toronto`). Argent en cents.
- Variables d'environnement validées par Zod dans `src/config/env.js`.
- Versions exactes, sans `^` (`prisma@7.10.1`). Données fictives uniquement. Commentaires en français, noms en anglais.

**Never :**
- Pas de formulaire de réservation ni de bouton « Réserver ma place » : c'est la story 1.2.
- Pas de courriel, de dépôt de preuve, de tableau de bord ni de connexion.
- Pas de TypeScript écrit à la main, pas de `console.log`.
- Pas de modification de `next.config.mjs`.
- Ne jamais afficher ni lire le contenu de `.env`.
- Pas de migration sur la branche Neon principale sans l'accord de l'utilisateur. Pas de push.

**Décisions de l'utilisateur (2026-11-15) :**
- Le plan est gardé en entier, malgré ses quelque 3 000 tokens.
- `.gitignore` : l'utilisateur annule lui-même sa ligne `/docs` (déjà couverte par `.git/info/exclude`). La story ajoute ensuite seulement `/src/generated/` et commite `.gitignore` avec cette seule ligne. Si `.gitignore` contient encore `/docs` au moment du commit, on s'arrête et on demande.
- Déploiement : l'utilisateur branche le site Netlify sur le dépôt GitHub et pousse `feature/foundation` quand l'agent le lui demande. L'aperçu Netlify fait partie de la vérification de la story.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Erreur |
|---|---|---|---|
| Accueil FR | `GET /fr`, événement de départ, aucune réservation | titre du dictionnaire, « samedi 19 décembre 2026 à 18 h 00 », lieu et adresse, « 25,00 $ », « 120 places restantes » | — |
| Accueil EN | `GET /en` | « Saturday, December 19, 2026 at 6:00 p.m. », « $25.00 », « 120 seats left » | — |
| Langue choisie | `GET /` avec `Accept-Language: en-CA,en;q=0.9` | redirection vers `/en` | — |
| Langue par défaut | `GET /` sans en-tête, ou en allemand | redirection vers `/fr` | — |
| Langue inconnue | `GET /de` | page 404 | `notFound()` |
| Places prises | réservations de 2, 3 et 1 places, plus une de 4 places annulée | 114 places restantes | — |
| Complet | places prises = capacité | « Complet » / « Sold out » au lieu du nombre | — |
| Base injoignable | Neon ne répond pas | page d'erreur générique bilingue, erreur journalisée sans donnée personnelle | `error.js` |
| Variable manquante | `DATABASE_URL` absente | échec immédiat qui nomme la variable manquante | Zod |

</frozen-after-approval>

## Code Map

- `package.json` : `"type": "module"`, scripts (`dev`, `build`, `lint`, `format`, `test`, `test:e2e`, `db:migrate`, `db:deploy`, `db:seed`, `db:test:deploy`), `postinstall: prisma generate`, dépendances exactes.
- `jsconfig.json` : garder `paths` ; ajouter `checkJs: true`, `allowImportingTsExtensions: true` (le client Prisma généré est en `.ts`) et `noEmit: true` (exigé par l'option précédente).
- `eslint.config.mjs` : ajouter `max-lines` (300), `no-console` (sauf `src/lib/logger.js`), `eslint-config-prettier`, et ignorer `src/generated/**`.
- `next.config.mjs` [ADOPTED] : ne pas toucher (`cacheComponents`, `reactCompiler`).
- `src/app/layout.js`, `src/app/page.js`, `src/app/page.module.css` : fichiers du starter **à supprimer**. `src/app/[lang]/layout.js` devient le layout racine.
- `src/app/globals.css` : remplacer les couleurs du starter par celles du brief §10 (crème, vert sapin, bordeaux, doré), sans mode sombre ; grandes tailles de texte. `favicon.ico` est gardé.
- `.env` existe déjà : ne pas le lire. `.env.test` est créé par l'utilisateur (branche Neon `test`). `.gitignore` : voir les décisions de l'utilisateur.
- Remote GitHub `origin` présent : Netlify pourra s'y brancher.

## Tasks & Acceptance

**Exécution :**
- [x] `package.json`, `jsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore` : outils et scripts listés dans la Code Map. Installer en versions exactes :
  - dépendances : `prisma`, `@prisma/client` et `@prisma/adapter-pg` en 7.10.1, `zod` 4.6.7, `@date-fns/tz` 1.5.0 ;
  - dépendances de développement : `vitest` 5.1.0, `@vitejs/plugin-react` 6.3.0, `jsdom` 31.0.1, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/jest-dom` 7.0.1, `@playwright/test` 1.65.1, `prettier` 3.10.1, `eslint-config-prettier` 10.1.8.
- [x] `prisma/schema.prisma`, `prisma.config.js`, `prisma/migrations/` (migration initiale), `prisma/seed.js` : schéma complet (Design Notes), événement de départ fictif du brief §13, insertion idempotente.
- [x] `src/config/env.js`, `src/lib/logger.js`, `src/lib/dates.js`, `src/lib/format.js`, `src/server/errors/app-error.js`, `src/server/errors/handle-api-error.js` : socle transverse, avec un test à côté de chacun.
- [x] `src/server/db/prisma-client.js`, `src/server/db/event.repository.js` (`getEvent`), `src/server/db/reservation.repository.js` (`sumTakenSeats(client)`, utilisable dans une transaction), `src/server/services/event.service.js` (`getEventOverview()`) : chemin des données. Tests sur la branche Neon `test`.
- [x] `src/i18n/locales.js`, `src/i18n/pick-locale.js`, `src/i18n/get-dictionary.js`, `src/i18n/dictionaries/fr.json`, `src/i18n/dictionaries/en.json`, `src/proxy.js` : langues et redirection. Un test vérifie que les deux dictionnaires ont les mêmes clés.
- [x] `src/app/[lang]/layout.js` (`generateStaticParams`, `<html lang>`, polices EB Garamond et Source Sans 3), `page.js`, `error.js`, `not-found.js`, `_components/EventDetails.jsx`, `src/components/event/EventSummary.jsx` (+ test), `src/components/ui/LanguageSwitcher.jsx` : l'accueil simple.
- [x] `vitest.config.js`, `playwright.config.js`, `e2e/home.spec.js` : configuration des tests et parcours de bout en bout de l'accueil.
- [x] `netlify.toml` (build `npm run build`, `NODE_VERSION = "24"`), `.env.example`, `README.md` : déploiement et documentation (but, installation, commandes, variables).

**Critères d'acceptation :**
- Étant donné un clone neuf avec `.env` rempli, quand on lance `npm install`, `npm run db:deploy` puis `npm run db:seed`, alors la base `dev` contient exactement un événement, même si le seed est relancé.
- Étant donné la branche poussée par l'utilisateur, quand Netlify construit l'aperçu, alors `/fr` et `/en` affichent les données lues dans Neon.
- Étant donné le code de la story, quand on lance `npm run lint`, alors aucun fichier écrit à la main ne dépasse 300 lignes et aucune erreur n'apparaît.

## Implementation Notes

- **Reprise du 15 novembre 2026.** L'utilisateur confirme que `.env` pointe sur Neon `dev` et que `.env.test` est créé. La migration initiale et le seed sur dev et test sont autorisés par le plan approuvé. Ne jamais lire ni afficher les fichiers d'environnement. L'accord « on continue » sur le retrait de `/docs` et les exclusions ESLint est appliqué, avec maintien de l'exclusion locale de `docs`. Aucun push.
- **Nom de la variable.** Le contrôle de présence après chargement par Node constate `DATABASE_URL` et `DIRECT_URL` dans dev et test ; `DATABASE_URL_UNPOOLED` est absente. `prisma.config.js` accepte les deux noms de connexion directe, en donnant priorité à `DATABASE_URL_UNPOOLED`. Les fichiers d'environnement ne sont pas modifiés et leurs contenus ne sont jamais affichés.
- **Vérification de `prisma generate`.** Le client a été généré sans `DATABASE_URL`, `DIRECT_URL` ni `DATABASE_URL_UNPOOLED` depuis un dossier temporaire sans `.env`, avec le chemin explicite vers `prisma.config.js`. Aucun fichier d'environnement n'a été renommé ni lu par l'agent.
- **jsdom 31.0.1** déclare Node ≥ 24.15. Il fonctionne sur le Node local (24.7.0), mais le README recommande 24.15 ou plus. Netlify utilise Node 24 à jour.
- **Extensions `.jsx`.** Les fichiers Next qui contiennent du JSX (`layout`, `page`, `error`, `not-found` sous `[lang]`) sont en `.jsx` : Vite 8 (oxc) refuse le JSX dans un `.js`.
- **Nettoyage des tests.** `vitest.setup.js` appelle `cleanup()` de Testing Library après chaque test, ce qui n'est pas automatique sans `globals`.
- **Exceptions à l'exclusion `.env*`.** `.gitignore` reçoit `!.env.example`, sinon le modèle de variables exigé par `AGENTS.md` serait ignoré. `.prettierignore` exclut `AGENTS.md` et `CLAUDE.md`, des contenus validés à ne pas reformater.
- **Sorties de Playwright** : rangées dans `node_modules/.cache/playwright`, déjà ignoré. Aucune autre ligne n'a été ajoutée à `.gitignore`.
- **`[lang]/[...rest]/page.js`** appelle `notFound()`, pour que toute adresse inconnue affiche la page 404 de la langue.
- **`npm run lint`** passe globalement après les exclusions autorisées du script personnel non suivi `verifier-bmad.mjs` et du rendu généré `_bmad/render/**`. Le script personnel reste hors du commit.
- **Fichiers touchés :**
  - configuration : `package.json`, `package-lock.json`, `jsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `netlify.toml`, `.env.example`, `README.md` ;
  - base : `prisma/` ;
  - code : `src/config`, `src/lib`, `src/i18n`, `src/validation`, `src/server`, `src/components`, `src/app/[lang]`, `src/proxy.js` ;
  - tests : `vitest.config.js`, `vitest.setup.js`, `playwright.config.js`, `e2e/`.
  - Suppressions : `src/app/layout.js`, `page.js` et `page.module.css`.

## Plan Change Log

- **Reprise après accord utilisateur.** Le message « on continue » répond à la demande d'accord sur le retrait de `/docs` et les deux exclusions ESLint (`verifier-bmad.mjs`, `_bmad/render/**`). Modifications appliquées ; `docs` reste exclu par `.git/info/exclude` et `npm run lint` global passe. La relecture puis le commit local précèdent le push utilisateur et l'aperçu Netlify, selon l'ordre demandé dans le message de reprise initial ; l'acceptation Netlify reste explicitement ouverte.
## Review Triage Log

| Référence | Verdict | Preuve et décision |
| --- | --- | --- |
| BH-1 | high | `loadEnvFile` conserve DATABASE_URL héritée et charge le drapeau du fichier ; le nettoyage utilise cette connexion. Corriger le chargement de test afin que toutes ses variables de base proviennent exclusivement de `.env.test`, y compris en présence de variables héritées ou d'un fichier incomplet. Patch. |
| BH-2 | low | Deux seeds simultanés peuvent créer deux lignes, mais le parcours autorisé est un seed manuel séquentiel, hors build. Rejeté : concurrence exceptionnelle et correction nécessitant une nouvelle politique de singleton ; les relances séquentielles sont testées. |
| BH-3 | low | Les dates impossibles sont normalisées ; le seul appelant actuel est le seed aux dates fixes valides. Rejeté : ajouter une validation calendaire et des règles DST pour des entrées qui ne sont pas encore exposées complexifierait ce parcours. |
| BH-4 | medium | Le client ne définit aucun délai et pg désactive `query_timeout` par défaut ; un serveur PostgreSQL qui accepte sans répondre peut maintenir le chargement. Borner les délais de connexion et requête, avec preuve locale contrôlée. Patch. |
| BH-5 | high | Le gestionnaire RSC Next installé transmet l'erreur originale au rapporteur et au traceur ; relancer l'erreur du pilote laisse donc sortir son message malgré notre journal sûr. Relancer une nouvelle erreur générique sans cause ni données externes. Patch. |
| BH-6 | false | Le Design Notes approuvé prévoit explicitement une validation au premier appel et une construction sans variables. L'absence provoque déjà un échec nommé au premier accès ; le démarrage paresseux n'est pas une dérive de cette implémentation. Rejeté. |
| BH-7 | medium | Les tests isolés vérifient journal et messages, mais ne traversent pas ensemble la frontière d'erreur Next et le bouton de reprise. Ajouter un parcours d'échec contrôlé puis de récupération sur les deux langues. Patch. |
| BH-8 | low | Les clés `constructor` et `__proto__` trouvent des propriétés héritées au lieu du repli promis ; correction directe du lookup et tests de ces valeurs. Patch. |
| BH-9 | false | Aucun état de l'accueil ne dépend de la query ni du fragment ; les seules pages actuelles sont les accueils et 404, et le chemin est conservé. La perte d'un état applicatif alléguée n'a pas d'appelant actuel. Rejeté. |
| BH-10 | low | Une qualité hors intervalle est acceptée, mais ces en-têtes invalides ne sont pas émis par les navigateurs du parcours et la langue reste sélectionnable. Rejeté : ajout d'une garde pour une entrée exceptionnelle sans impact significatif sur ce parcours. |
| EH-1 | high | Même défaut de mélange d'environnement que BH-1, confirmé avec un fichier fictif par le relecteur. Patch, même groupe. |
| EH-2 | medium | Même attente PostgreSQL non bornée que BH-4, confirmée par la configuration du pilote installé. Patch, même groupe. |
| EH-3 | low | Même concurrence exceptionnelle du seed que BH-2. Rejeté pour le même motif ; aucune modification de migration appliquée. |
| EH-4 | low | Même normalisation de valeurs locales impossibles que BH-3 ; aucune saisie publique actuelle ne l'appelle. Rejeté pour le même motif. |
| EH-5 | low | Même qualité Accept-Language invalide que BH-10. Rejeté pour le même motif. |
| VG-1 | medium | Lacune pré-vérifiée : les E2E voient seulement le seed inchangé ; ils ne détectent pas un aperçu mémorisé entre deux requêtes. Ajouter une mutation de la base test suivie d'un rechargement et d'une restauration. Patch. |
| VG-2 | medium | Lacune pré-vérifiée : `count=1` ne prouve pas la remise à jour des valeurs par un second seed. Vérifier les champs restaurés et l'identifiant conservé. Patch. |

Groupes retenus : isolation de test (BH-1, EH-1), délais PostgreSQL (BH-4, EH-2), erreur publique neutralisée (BH-5), parcours de reprise (BH-7), dictionnaire sans propriétés héritées (BH-8), fraîcheur HTTP (VG-1), mise à jour par le seed (VG-2). Ces corrections internes n'ajoutent ni parcours métier ni surface publique ; elles sont traitées comme patches. Aucun constat différé.

**Résolution :** les sept groupes sont corrigés et vérifiés. Les tests fictifs reproduisent d'abord le mélange d'environnement ; le chargeur commun refuse désormais les fichiers de test absents ou incomplets et neutralise les connexions héritées. Deux serveurs TCP locaux prouvent les délais de connexion (5 s) et requête (8 s). Next ne reçoit qu'une erreur générique sans cause. Les nouveaux parcours ont aussi reproduit puis corrigé l'absence de relecture serveur au clic Réessayer, désormais couplé à un rafraîchissement de route. Les vérifications finales passent : 88 tests Vitest, 10 parcours Playwright avec build de production, lint global et Prettier. Aucun constat retenu ne reste ouvert localement.

## Design Notes

**Schéma (AD-17), à écrire en entier dès maintenant :**
- **Énumérations :**
  - `ReservationStatus` : `PENDING_PAYMENT`, `TO_VERIFY`, `CONFIRMED`, `CANCELLED`
  - `DecisionType` : `CONFIRM`, `REFUSE`, `CANCEL`, `AUTO_CANCEL`
  - `RefusalReason` : `NO_TRANSFER`, `INCOMPLETE_AMOUNT`, `UNREADABLE_PROOF`
  - `Language` : `FR`, `EN`
- **`Event` :** `startsAt`, `bookingDeadline`, `capacity`, `unitPriceCents`, `venueName`, `venueAddress`, `interacEmail`, `alertSentAt?`, horodatages.
- **`Reservation` :** `code` (unique), `token` (unique), `status`, `firstName`, `lastName`, `email`, `phone`, `seats`, `note?`, `language`, `unitPriceCents`, `amountCents`, `interacEmail`, `confirmedAt?`, horodatages. Index sur `status`.
- **`Proof` :** `reservationId`, `data` (Bytes), `mimeType`, `byteSize`, `createdAt`.
- **`ReservationDecision` :** `reservationId`, `type`, `reasonCode?`, `organizerId?`, `createdAt`.
- **`Organizer` :** `email` (unique), `name`, `passwordHash`, `createdAt`.
- **`Session` :** `tokenHash` (unique), `organizerId`, `expiresAt`, `createdAt`.
- **`RateLimit` :** `key` (clé primaire), `windowStart`, `count`.
- **Identifiants :** `String @id @default(cuid())`.

**Prisma 7 en projet JavaScript :** un essai fait le 15 novembre 2026 avec la version 7.10.1 donne les résultats suivants.
- Le générateur `prisma-client` produit uniquement des fichiers `.ts`. Node 24 sait les importer directement, et `prisma.config.js` est accepté.
- On utilise donc `provider = "prisma-client"`, `output = "../src/generated/prisma"` et `moduleFormat = "esm"`. Le dossier généré est ignoré par git et recréé par `postinstall`.
- Prisma 7 ne charge plus `.env` tout seul. `prisma.config.js` appelle `process.loadEnvFile('.env')` seulement si `DIRECT_URL` n'est pas déjà définie et si le fichier existe. `db:test:deploy` lance donc la CLI Prisma avec `node --env-file=.env.test`, et `seed` lance `node --env-file-if-exists=.env prisma/seed.js`.
- `prisma.config.js` lit `process.env.DIRECT_URL` directement, sans le helper `env()` qui échoue quand la variable manque. Raison : `postinstall` (`prisma generate`) doit réussir sans aucune variable, sur un clone neuf comme pendant le build Netlify.

**Variables lues à la demande.** `src/config/env.js` expose `getEnv()`, qui valide au premier appel. Le client Prisma est créé au premier usage. Ainsi les tests unitaires sans base et le build Netlify n'ont besoin d'aucune variable.

**Tests et base de données.**
- Vitest et Playwright chargent **seulement** `.env.test` avec `src/config/load-test-env.js`, qui neutralise les connexions PostgreSQL héritées avant lecture et refuse un fichier absent ou incomplet. Ce fichier contient `DATABASE_URL`, la connexion directe utilisée pour les migrations et `DATABASE_IS_TEST=true`.
- Les tests qui touchent la base vident les tables au début avec `src/server/db/reset-test-database.js`. Ce helper **refuse de tourner** si `DATABASE_IS_TEST !== 'true'`, pour ne jamais vider `dev` ni la production.
- Ces tests tournent un fichier à la fois.
- Playwright charge aussi `.env.test` avant de démarrer `next start`. Les variables de connexion absentes sont définies à vide pour empêcher Next de les compléter depuis `.env`. Un `globalSetup` vide la base puis lance le seed, ce qui rend « 120 places restantes » déterministe.
- `Intl` met des espaces insécables dans les montants et les dates : les tests les normalisent avant de comparer.

**Seed et migration.**
- `prisma/seed.js` crée l'unique événement, ou le met à jour s'il existe déjà. Les valeurs fictives sont regroupées en tête de fichier, pour que l'utilisateur les remplace par les vraies avant la mise en ligne.
- Approuver ce plan autorise à créer la migration initiale et à l'appliquer aux branches `dev` et `test` seulement. Jamais à la branche principale.

**Proxy.** `src/proxy.js` laisse passer `/_next`, `/api`, `/admin` et les fichiers avec une extension. Il redirige tout autre chemin sans langue vers `/<langue><chemin>`.

**Imports relatifs.** Les modules que `prisma/seed.js` charge (`src/server/db/`, `src/config/`, `src/lib/`) s'importent entre eux en relatif, avec l'extension, parce que Node ne connaît pas l'alias `@/`.

**Exemple d'entrée dynamique (AD-15) :**
```js
// src/app/[lang]/_components/EventDetails.jsx
export default async function EventDetails({ lang, dictionary }) {
  await connection(); // rendu à la demande : places toujours à jour
  const overview = await getEventOverview();
  return <EventSummary overview={overview} lang={lang} dictionary={dictionary} />;
}
```

## Verification

**Audit local de la matrice :** accueil FR/EN et leurs dates/prix/places, redirections et 404 couverts par `e2e/home.spec.js` ; calcul de 114 places avec annulation et capacité atteinte couverts par `event.service.db.test.js` ; libellés Complet/Sold out couverts par `EventSummary.test.jsx` ; échec de lecture journalisé et message générique bilingue couverts par `EventDetails.test.jsx` et `error.test.jsx` ; variable manquante couverte par `env.test.js`. Tous ces fichiers ont tourné dans les suites réussies.

**Clôture en attente :** relecture locale terminée, corrections vérifiées et commit local autorisé par l'exception de `AGENTS.md`. La story conserve le statut `in-review` jusqu'au push utilisateur et à la validation de l'aperçu Netlify ; ne pas confondre fin des contrôles locaux et acceptation complète. Le script personnel reste exclu du commit. Aucun fichier modifié écrit à la main ne dépasse 300 lignes.

**Résultats locaux du 15 novembre 2026 :** migration initiale appliquée à Neon `dev` et `test`, seed dev réussi ; 88 tests Vitest dans 19 fichiers et 10 parcours Playwright mobiles réussis, avec build Next.js. Le second seed restaure les champs attendus sans changer l'identifiant ni créer de doublon. Les erreurs journalisées et relancées ne contiennent plus les détails d'un pilote externe. La génération Prisma sans variable réussit. Lint global et Prettier passent. L'aperçu Netlify attend le branchement et le push utilisateur. La vérification supplémentaire `tsc --project jsconfig.json`, effectuée avant les patches de revue, échouait dans les dépendances Prisma/React ; elle n'a pas été élargie ni masquée.

**Commandes :**
- `npm run lint` : attendu aucune erreur.
- `npx prisma generate`, lancé sans `DATABASE_URL` ni `DIRECT_URL` : attendu un client généré sans erreur.
- Avec `DATABASE_IS_TEST` absent, un appel à `reset-test-database.js` : attendu un refus, et aucune table vidée.
- `npm test` : attendu tous les tests au vert, dont ceux de la branche Neon `test`.
- `npm run build` : attendu une construction réussie, sans erreur `cacheComponents`.
- `npm run test:e2e` : attendu l'accueil `/fr` et `/en`, et la redirection depuis `/`.

**Vérifications manuelles :**
- Sur l'aperçu Netlify, `/fr` et `/en` sur un téléphone : texte lisible, choix de langue présent, places restantes justes.
