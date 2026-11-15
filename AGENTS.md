# AGENTS.md — Règles de développement (JavaScript)

> Ces règles s'appliquent à tout agent IA (Claude Code, Codex, Cursor…) et à toute personne qui contribue au projet.
> La section « Spécifique à ce projet », à la fin, les complète. En cas de conflit, c'est elle qui l'emporte.

## 1. Principes

- Le code doit être facile à lire pour un développeur junior. La lisibilité passe avant l'astuce.
- Une fonction fait une seule chose. Un fichier a une seule responsabilité.
- Aucun fichier de plus de 300 lignes : découper avant d'atteindre la limite (vérifié par la règle ESLint `max-lines`).
  Seuls les fichiers générés y échappent : `package-lock.json`, migrations, fichiers de build.
- JavaScript moderne : modules ES (`import` / `export`), jamais `require`. Côté Node, `"type": "module"` dans `package.json`.
- `const` par défaut, `let` seulement si la valeur change, jamais `var`. Toujours `===` et `!==`, jamais `==`.
- Types décrits en JSDoc + `"checkJs": true` dans `jsconfig.json` : l'éditeur signale les erreurs de type sans TypeScript.
- Le formatage est fait par Prettier, les erreurs de style par ESLint.

## 2. Nommage et conventions

### Langue

- Noms dans le code en **anglais** : variables, fonctions, fichiers, dossiers, tables, routes.
- Commentaires et documentation en **français**.
- Messages de commit en **français** (voir section 7).

### Casse

| Élément | Convention | Exemple |
|---|---|---|
| Variables, fonctions | camelCase | `userCount`, `getUserById` |
| Composants React, classes, `@typedef` JSDoc | PascalCase | `UserCard`, `CreateUserInput` |
| Constantes globales, variables d'environnement | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `DATABASE_URL` |
| Fichiers de composants React | PascalCase | `UserCard.jsx` |
| Autres fichiers | kebab-case + rôle | `user-profile.service.js` |
| Dossiers | kebab-case | `user-profile/` |
| Routes API | kebab-case, au pluriel | `/api/user-profiles` |
| Modèles de base de données | PascalCase, au singulier | `User`, `OrderItem` |

### Suffixes de fichiers

| Rôle | Suffixe | Exemple |
|---|---|---|
| Fonctions API (back séparé) | `.controller.js` | `user.controller.js` |
| Règles métier | `.service.js` | `user.service.js` |
| Accès base de données | `.repository.js` | `user.repository.js` |
| Schémas de validation | `.schema.js` | `user.schema.js` |
| Tests Vitest | `.test.js(x)` | `user.service.test.js` |
| Tests Playwright | `.spec.js` | `login.spec.js` |

### Règles de nommage

- Une fonction commence par un verbe : `getUser`, `createOrder`, `validateEmail`.
- Un booléen commence par `is`, `has`, `can` ou `should` : `isActive`, `hasPaid`.
- Un tableau porte un nom au pluriel : `users`, `orderItems`.
- Pas d'abréviation : `user` et non `usr`. Seul `i` est toléré comme compteur d'une boucle courte.
- Un gestionnaire d'événement commence par `handle` (`handleSubmit`), la prop qui le reçoit par `on` (`onSubmit`).

### Style de code

- Retour anticipé (early return) plutôt que des `if` imbriqués.
- Boucles classiques (`for...of`) plutôt que des chaînes de méthodes denses.
  Deux méthodes enchaînées au maximum (`.filter().map()`). Un `.map()` simple pour afficher une liste en JSX est permis.
- Pas de ternaire imbriqué, pas de valeur « magique » (la placer dans une constante nommée).
- `async/await` plutôt que `.then()`.

## 3. Structure des dossiers

L'accès à la base de données, les fonctions API et la validation vivent dans des dossiers séparés.
Une requête suit toujours ce chemin : **API** (reçoit, valide, répond) → **service** (règles métier) → **db** (requêtes ORM).

- Seul le dossier `db/` importe l'ORM (Prisma, Drizzle, Mongoose…).
- Les fonctions API ne contiennent ni règle métier ni requête à la base.
- Les services ne connaissent pas `Request` ni `Response`.
- Tous les schémas Zod sont dans `validation/`, avec les `@typedef` des données qu'ils valident.

### Squelette A — Next.js full-stack (App Router)

```
src/
├── app/                    # Pages et routes, gardées minces
│   ├── (auth)/login/page.jsx
│   ├── api/users/route.js  # Fonctions API : valide, appelle le service, répond
│   └── layout.jsx
├── components/
│   ├── ui/                 # Boutons, champs, cartes réutilisables
│   └── users/              # Composants d'une fonctionnalité
├── hooks/                  # Hooks React personnalisés
├── validation/             # Schémas Zod + @typedef, partagés par les formulaires et le serveur
├── server/                 # Code exécuté seulement côté serveur
│   ├── actions/            # Server Actions : même rôle que les fonctions API
│   ├── services/           # Règles métier
│   ├── db/                 # Accès base de données (ORM)
│   └── errors/             # Classe AppError et transformation des erreurs
├── config/                 # Variables d'environnement vérifiées au démarrage
└── lib/                    # Utilitaires sans logique métier (logger, dates…)
e2e/                        # Tests Playwright
prisma/schema.prisma
jsconfig.json               # "checkJs": true
```

### Squelette B — Front React + back Node séparés

```
client/                     # React + Vite
├── jsconfig.json           # "checkJs": true
└── src/
    ├── pages/              # Un fichier par écran
    ├── components/
    │   ├── ui/
    │   └── users/
    ├── hooks/
    ├── api/                # Appels HTTP vers le serveur
    ├── validation/         # Schémas Zod des formulaires
    └── lib/
server/                     # Node + Express, "type": "module"
├── jsconfig.json           # "checkJs": true
└── src/
    ├── routes/             # Associe chaque URL à un contrôleur
    ├── controllers/        # Fonctions API : valide, appelle le service, répond
    ├── services/           # Règles métier
    ├── db/                 # Accès base de données (ORM)
    ├── validation/         # Schémas Zod + @typedef
    ├── middlewares/        # Authentification, erreurs, journalisation
    ├── errors/             # Classe AppError
    ├── config/             # Variables d'environnement vérifiées au démarrage
    ├── lib/                # Utilitaires (logger…)
    ├── app.js              # Création de l'application Express
    └── server.js           # Démarrage du serveur
e2e/                        # Tests Playwright (interface et API)
```

## 4. API et gestion des erreurs

### Routes

| Action | Méthode et route | Succès |
|---|---|---|
| Lister | `GET /api/users?page=1&limit=20` | 200 |
| Lire un élément | `GET /api/users/:id` | 200 |
| Créer | `POST /api/users` | 201 |
| Modifier en partie | `PATCH /api/users/:id` | 200 |
| Supprimer | `DELETE /api/users/:id` | 204 |

- Pas de verbe dans l'URL : `POST /api/users`, et non `/api/createUser`.
- Les listes sont paginées : `page` (1 par défaut) et `limit` (20 par défaut, 100 au maximum).
- Clés JSON en camelCase. Dates en ISO 8601 UTC : `2026-11-15T19:30:00Z`.

### Format des réponses

```json
{ "data": { "id": "u_123", "email": "alice@example.com" } }
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 134 } }
{ "error": { "code": "VALIDATION_ERROR", "message": "Le courriel est invalide.",
             "details": [{ "field": "email", "message": "Format invalide" }] } }
```

- `code` : en anglais, en UPPER_SNAKE_CASE, stable (le front s'en sert pour réagir).
- `message` : lisible par l'utilisateur, dans la langue de l'application.
- `details` : seulement pour les erreurs de validation.

### Codes HTTP

| Code | Situation | `code` d'erreur |
|---|---|---|
| 400 | Données invalides (échec Zod) | `VALIDATION_ERROR` |
| 401 | Utilisateur non connecté | `UNAUTHENTICATED` |
| 403 | Connecté, mais sans le droit | `FORBIDDEN` |
| 404 | Ressource introuvable | `USER_NOT_FOUND`… |
| 409 | Conflit (courriel déjà utilisé…) | `EMAIL_ALREADY_USED`… |
| 429 | Trop de requêtes | `TOO_MANY_REQUESTS` |
| 500 | Erreur imprévue | `INTERNAL_ERROR` |

### Erreurs

- Toute donnée qui entre (body, params, query) est validée côté serveur avec Zod. Sans TypeScript, c'est la seule barrière.
- Une erreur prévue est lancée avec la classe `AppError(statusCode, code, message)`.
- Un seul endroit transforme les erreurs en réponse : le middleware d'erreurs (Express) ou `handleApiError()` (Next.js).
- Jamais de trace de pile, de requête SQL ni de message brut de la base envoyé au client. Une erreur 500 renvoie un message générique.
- Pas de `catch` vide : une erreur est gérée, relancée ou journalisée.

### Journalisation (logs)

- Utiliser `lib/logger.js`, jamais `console.log` dans le code commité.
- Journaliser chaque erreur 500 avec son contexte : route, méthode, identifiant de l'utilisateur.
- Jamais de mot de passe, de token, de numéro de carte ni de donnée personnelle (nom, courriel, téléphone) dans les logs.

## 5. Tests

Outils : **Vitest** (unitaires), **Testing Library** (composants React), **Playwright** (bout en bout et API).

| Type | Ce qu'on teste | Emplacement |
|---|---|---|
| Unitaire | Services, validation, utilitaires | À côté du fichier : `user.service.test.js` |
| Composant | Ce que l'utilisateur voit et fait | À côté du composant : `UserCard.test.jsx` |
| API | Une route complète, avec une base de test | `e2e/api/users.spec.js` (Playwright `request`) |
| Bout en bout | Les parcours critiques (connexion, paiement…) | `e2e/login.spec.js` |

- Chaque fonctionnalité ou correction arrive avec ses tests.
- Pour un bogue : écrire d'abord le test qui le reproduit, puis corriger.
- Chaque fonction de `services/` et de `validation/` a au moins un cas normal, un cas limite et un cas d'erreur.
- Sans TypeScript, tester aussi les entrées de mauvais type (`null`, nombre au lieu de texte…) sur les schémas de validation.
- Structure Préparer / Agir / Vérifier (Arrange / Act / Assert).
- Descriptions en français : `it("refuse un courriel sans @")`.
- Testing Library : chercher les éléments comme un utilisateur (`getByRole`, `getByLabelText`), pas par classe CSS.
- Simuler (mock) les services externes (courriel, paiement, API tierces), jamais le code testé.
- Données fictives uniquement. Les tests qui touchent la base utilisent une base de test dédiée.
- Un test qui échoue n'est ni supprimé ni désactivé (`.skip`) pour faire passer la suite.
- Avant chaque commit : `lint` et `test` passent. Avant chaque fusion dans `main` : `test:e2e` passe aussi.

## 6. Documentation

- Chaque fonction exportée a un commentaire JSDoc en français **avec les types** :
  ce qu'elle fait, `@param {type} nom`, `@returns {type}`, `@throws {AppError}`.
- Les objets échangés entre couches sont décrits par un `@typedef` dans le fichier `.schema.js` correspondant.
- Les commentaires expliquent le **pourquoi**, pas le quoi.
- Chaque projet a un `README.md` : but de l'application, installation, commandes, variables d'environnement.
- `.env.example` liste toutes les variables, avec des valeurs fictives.
- Une décision technique importante est notée en quelques lignes dans `docs/decisions/`.

## 7. Git

- Ne jamais travailler directement sur `main`. `main` fonctionne toujours.
- Une branche par sujet, nommée en anglais : `feature/user-login`, `fix/cart-total`, `docs/readme`, `refactor/user-service`.
- Conventional Commits, description en français, à l'infinitif, sans majuscule ni point final :
  `feat: ajouter la page de connexion`, `fix: corriger le calcul du total du panier`.
  Types : `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `perf`, `chore`.
- Un commit = un changement logique.
- Jamais de `.env`, de secret, de `node_modules` ni de fichier de build dans un commit.
- Fusion dans `main` par pull request, avec : ce qui change, pourquoi, comment tester.

## 8. Sécurité

- Secrets (clés, mots de passe, tokens) uniquement dans `.env` : jamais en dur dans le code, jamais affichés.
- Avec Next.js, jamais de secret dans une variable `NEXT_PUBLIC_` : elle est envoyée au navigateur.
- Les variables d'environnement sont vérifiées au démarrage avec Zod (`config/`). S'il en manque une, l'application ne démarre pas.
- Chaque route protégée vérifie, côté serveur, que l'utilisateur est connecté **et** qu'il a le droit sur cette ressource précise.
- Mots de passe hachés (bcrypt ou argon2), jamais stockés en clair.
- Accès à la base uniquement par l'ORM ou des requêtes paramétrées, jamais en concaténant du texte.
- Aucune vraie donnée personnelle dans le code, les tests, les seeds, les captures d'écran ou les logs.
- Collecter le minimum de données personnelles.
- Paiements : aucun numéro de carte stocké ni journalisé ; tout passe par le prestataire de paiement.
- Lancer `npm audit` avant chaque mise en production.

## 9. Règles pour les agents IA

### Avant de coder

- Lire ce fichier et le `README.md`. Respecter la structure existante.
- Si la demande est ambiguë, poser la question avant d'écrire du code.
- Écrire en JavaScript : ne pas convertir le projet en TypeScript sans demande explicite.

### Demander avant de

- faire un commit ou un `git push` ;
- ajouter, retirer ou mettre à jour une dépendance ;
- supprimer ou renommer des fichiers ;
- créer ou lancer une migration, ou remettre la base à zéro ;
- modifier la configuration (`jsconfig.json`, ESLint, Prettier, Vite, Next.js, CI) ;
- modifier un fichier `.env`.

### Ne jamais

- pousser sur `main`, ni utiliser `push --force`, `rebase` ou `reset --hard` sans demande explicite ;
- modifier une migration déjà appliquée (en créer une nouvelle) ;
- afficher le contenu d'un `.env` ou un secret ;
- désactiver un test, une règle ESLint ou la vérification des types (`// @ts-ignore`, `// @ts-nocheck`, `eslint-disable`) pour faire passer le code ;
- inventer une fonction, une option ou une version de bibliothèque : vérifier dans la documentation ou dans `node_modules`.

### Avant de dire « terminé »

- `lint` et `test` passent, et aucun fichier ne dépasse 300 lignes.
- Résumer en français : ce qui a changé, les fichiers touchés, comment tester, ce qui reste à faire.
- Si une règle ne peut pas être respectée, le dire au lieu de la contourner.

## 10. Commandes standard

Scripts attendus dans `package.json` : `dev`, `build`, `lint` (ESLint), `format` (Prettier),
`test` (Vitest) et `test:e2e` (Playwright).

---

## Spécifique à ce projet

> À remplir pour chaque projet. Remplacer chaque `[...]`.

- **Description** : [Ce que fait l'application, en deux phrases]
- **Stack** : [Squelette A ou B, ORM, base de données, hébergement]
- **Commandes différentes des commandes standard** : [ou « aucune »]
- **Zones interdites** : [fichiers ou dossiers à ne pas modifier : fichiers générés, contenus validés…]
- **Données sensibles particulières** : [ex. : données de mineurs, paiements, ou « aucune »]
- **Données sensibles** : les captures d'écran de virements Interac (stockage privé, jamais d'URL publique).
**Exception** : bmad-build peut faire des commits locaux, en français, jamais de push. (Dans la version 6.12.4, il fait un commit local à la fin de chaque story.)
- **Documents de référence** : [cahier des charges, maquettes, wiki, ou « aucun »]
