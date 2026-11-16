# Dîner de Noël — site de réservation

Site bilingue (français et anglais) qui permet de réserver sa place au dîner de Noël d'ICC Ottawa,
de payer par virement Interac et de déposer la preuve du virement. Quatre organisateurs vérifient
chaque paiement depuis un tableau de bord.

- Besoin : `docs/projet-brief.md` (hors du dépôt)
- Règles de code : `AGENTS.md`
- Architecture : `_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/`

## Pile technique

Next.js 16 (App Router) en JavaScript, PostgreSQL sur Neon par Prisma 7, Zod, Vitest, Testing
Library et Playwright. Hébergement sur Netlify.

## Installation

Prérequis : Node.js 24 (24.15 ou plus récent recommandé) et un projet Neon avec les branches `dev`
et `test`.

1. `npm install` : installe les dépendances et génère le client Prisma dans `src/generated/`.
2. Copier `.env.example` en `.env` (branche `dev`) et en `.env.test` (branche `test`, avec
   `DATABASE_IS_TEST="true"`).
3. `npm run db:deploy` puis `npm run db:seed` : crée les tables et l'événement de départ (`dev`).
4. `npm run db:test:deploy` : crée les tables sur la base de test.
5. `npm run dev`, puis ouvrir http://localhost:3000.

Les tests exigent un fichier `.env.test` complet avec `DATABASE_IS_TEST="true"`. Leurs connexions
proviennent exclusivement de ce fichier : les connexions PostgreSQL héritées du terminal sont ignorées.

## Commandes

| Commande                          | Rôle                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement                                                            |
| `npm run build` / `npm run start` | Construction et démarrage de production                                             |
| `npm run lint`                    | ESLint (dont 300 lignes au maximum par fichier)                                     |
| `npm run format`                  | Prettier                                                                            |
| `npm test`                        | Vitest : tests unitaires, composants et base de test                                |
| `npm run test:e2e`                | Playwright sur la base de test (`npx playwright install chromium` la première fois) |
| `npm run db:migrate`              | Crée une migration et l'applique à la base `dev`                                    |
| `npm run db:deploy`               | Applique les migrations à la base de `.env`                                         |
| `npm run db:test:deploy`          | Applique les migrations à la base de `.env.test`                                    |
| `npm run db:seed`                 | Crée ou remet à jour l'événement de départ                                          |

## Variables d'environnement

| Variable                | Rôle                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Connexion poolée à Neon, utilisée par l'application                                |
| `DATABASE_URL_UNPOOLED` | Connexion directe à Neon, utilisée par les migrations                              |
| `DIRECT_URL`            | Autre nom accepté pour la connexion directe si `DATABASE_URL_UNPOOLED` est absente |
| `DATABASE_IS_TEST`      | `"true"` seulement dans `.env.test` : autorise les tests à vider la base           |

Les valeurs de l'événement dans `prisma/default-event.js` sont fictives : les remplacer par les
vraies avant la mise en ligne.

## Déploiement

Netlify construit le site avec `netlify.toml`. Dans Netlify, définir `DATABASE_URL` pour chaque
contexte : branche `dev` pour les aperçus, branche principale pour la production. Les migrations
se lancent à la main avant le déploiement qui en a besoin, jamais pendant le build.
