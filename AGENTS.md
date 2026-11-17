<!-- bmad:context -->
<!-- Verified 2026-11-16 against 249eb34d79a58d62f174cbc29b4bb0ca2cc6b1ae. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Dîner de Noël

Système de réservation bilingue (ICC Ottawa). Next.js 16 (App Router), Prisma 7 (Postgres/Neon), Zod, Vitest/Playwright. Planning dans `_bmad-output/`, architecture dans `_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/`.

## Policy

- **Langue** : Code/anglais, documentation/commentaires/commits/UI en français.
- **Sécurité** : Secrets dans `.env` uniquement. Validation Zod systématique côté serveur.
- **Architecture** : Flux strict API/Actions -> Services -> DB (Repositories). Seul `src/server/db/` importe le client Prisma.
- **Qualité** : Aucun fichier > 300 lignes (ESLint). JSDoc avec types obligatoire sur les fonctions exportées.
- **Git** : Conventional Commits en français. `bmad-build` peut committer localement.

## Where things are

- **Entrées API/Actions** : `src/app/api/` et `src/server/actions/`
- **Logique métier** : `src/server/services/`
- **Accès Données** : `src/server/db/` (Repositories)
- **Validation/Types** : `src/validation/` (Schémas Zod + @typedef)
- **Erreurs** : `src/server/errors/app-error.js` (Classe AppError)

## Running and verifying

- **Tests** : `npm test` (Vitest) et `npm run test:e2e` (Playwright).
- **Base de test** : Nécessite `.env.test` avec `DATABASE_IS_TEST="true"`.
- **Migrations** : `npm run db:migrate` (dev). Ne jamais modifier une migration appliquée.

## Conventions that differ from defaults

- **Noms de fichiers** : Kebab-case par défaut, sauf composants React et @typedef (PascalCase).
- **Erreurs** : Utiliser `AppError` avec une clé de traduction (`messageKey`), pas de message en dur.
- **Journalisation** : Utiliser `src/lib/logger.js`, jamais `console.log`.

## Known pitfalls

- **SMTP** : Les variables SMTP sont neutralisées en test. La validation SMTP est asynchrone (max 10s).
- **Dates** : Toujours en ISO 8601 UTC.
- **Next.js** : Suivre les conventions v16 (experimental.agentFeedback activé).

<!-- /bmad:context -->
