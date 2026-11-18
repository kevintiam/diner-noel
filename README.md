# Dîner de Noël — site de réservation

Site bilingue (français et anglais) qui permet de réserver sa place au dîner de Noël d'ICC Ottawa,
de payer par virement Interac et de déposer la preuve du virement. Quatre organisateurs vérifient
chaque paiement depuis un tableau de bord.

Guide simple des dernières améliorations : [partages, protection des IP, nettoyage, uploads et vérifications](MODIFICATIONS-TECHNIQUES.md).

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
3. `npm run security:setup` : prépare la clé HMAC privée dans `.env`, puis `npm run db:deploy` et `npm run db:seed` créent les tables et l'événement de départ (`dev`).
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
| `npm run typecheck`               | Vérifie les types du code applicatif, scripts et configuration                     |
| `npm run security:setup`          | Prépare la clé HMAC privée locale sans l'afficher                                   |
| `npm run format`                  | Prettier                                                                            |
| `npm test`                        | Vitest : tests unitaires, composants et base de test                                |
| `npm run test:e2e`                | Playwright sur la base de test (`npx playwright install chromium` la première fois) |
| `npm run db:migrate`              | Crée une migration et l'applique à la base `dev`                                    |
| `npm run db:deploy`               | Applique les migrations à la base de `.env`                                         |
| `npm run db:test:deploy`          | Applique les migrations à la base de `.env.test`                                    |
| `npm run db:seed`                 | Crée ou remet à jour l'événement de départ                                          |
| `npm run organizer:create`        | Crée un compte organisateur, ou change son mot de passe (voir plus bas)             |

## Variables d'environnement

| Variable                | Rôle                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Connexion poolée à Neon, utilisée par l'application                                                             |
| `DATABASE_URL_UNPOOLED` | Connexion directe à Neon, utilisée par les migrations                                                           |
| `DIRECT_URL`            | Autre nom accepté pour la connexion directe si `DATABASE_URL_UNPOOLED` est absente                              |
| `DATABASE_IS_TEST`      | `"true"` seulement dans `.env.test` : autorise les tests à vider la base                                        |
| `RATE_LIMIT_SECRET`     | Clé privée HMAC (32 caractères minimum), préparée localement par `npm run security:setup` ; à configurer aussi dans Netlify |
| `SITE_URL`              | Origine HTTPS publique des liens et aperçus de partage, requise au build et à l'exécution ; HTTP autorisé sur localhost |
| `SMTP_HOST`             | Nom du serveur SMTP dédié                                                                                       |
| `SMTP_PORT`             | Port SMTP : 465 pour TLS immédiat, 587 pour STARTTLS obligatoire                                                |
| `SMTP_USER`             | Identifiant SMTP privé                                                                                          |
| `SMTP_PASSWORD`         | Mot de passe SMTP privé                                                                                         |
| `EMAIL_FROM`            | Expéditeur autorisé par le fournisseur SMTP : `adresse` ou `Nom <adresse>` (nom par défaut : « Dîner de Noël ») |

Les valeurs de l'événement dans `prisma/default-event.js` sont fictives : les remplacer par les
vraies avant la mise en ligne, ou les corriger ensuite depuis l'écran Paramètres du tableau de bord.

## Comptes des organisateurs

Le tableau de bord `/admin` n'a ni inscription ni compte par défaut. Chaque compte se crée depuis
un terminal interactif, sur la base de `.env` :

```bash
npm run organizer:create -- --email orga@example.org --name "Prénom Nom"
```

Le mot de passe (12 caractères au moins) est demandé deux fois sans s'afficher. Relancer la
commande avec le même courriel change le nom et le mot de passe, et ferme les sessions ouvertes de
ce compte. Pour la production, lancer le script avec les variables de la base de production, par
exemple `node --env-file=.env.production scripts/create-organizer.js --email … --name "…"`.

La connexion est limitée à 5 essais par quart d'heure et par adresse IP ; une session dure 7 jours.

## Accusé de réception

Après le commit de la réservation, un accusé texte et HTML est envoyé dans sa langue enregistrée.
Les effectifs, le tarif, le montant et l'adresse Interac viennent de l'instantané enregistré.
Une inscription gratuite reçoit directement sa confirmation, sans demande de virement ni de preuve.
Le lien personnel est construit depuis `SITE_URL`, jamais depuis les en-têtes de la requête.

Les variables SMTP sont vérifiées à la première utilisation du courriel, indépendamment du build et
de la connexion à la base. `SITE_URL` est aussi nécessaire au build pour les aperçus de partage.
Une panne ou une configuration SMTP absente conserve la réservation et sa
redirection ; le journal `reservation_receipt_failed` contient seulement l'identifiant interne.
L'échec est aussi enregistré en base (table `EmailFailure`) et signalé aux organisateurs, voir
« Courriels non envoyés » ci-dessous.
L'envoi attend au maximum dix secondes, sans file ni nouvelle tentative automatique. Les tests
neutralisent toutes les variables SMTP héritées, locales ou présentes dans `.env.test`.

Pour la recette manuelle sur l'aperçu, le propriétaire configure les six variables du courriel
dans l'environnement privé de l'hébergeur et vérifie une réservation anglaise fictive : réception
texte et HTML, montant, instructions, absence de remboursement et lien ouvrant `/en/r/...`.
Vérifier également qu'une inscription gratuite n'exige aucun paiement. Ne pas publier le lien
personnel ni les identifiants SMTP dans un ticket ou une capture. Cette réception réelle reste
à valider après la configuration du propriétaire.

## Confirmation et avis de refus

Sur la fiche d'une réservation « À vérifier », un organisateur confirme le paiement ou le refuse
avec un motif. Les règles suivent l'architecture (AD-4, AD-5) :

- **Confirmer** : la réservation passe « Confirmée » et le participant reçoit la confirmation
  (code, places, montant payé, date et lieu du dîner).
- **Refuser** : la réservation revient « En attente de paiement » sans libérer ses places. Le
  participant reçoit l'avis de refus avec le motif, le montant attendu et son lien personnel pour
  envoyer une nouvelle preuve.
- **Annuler** : possible seulement avant la confirmation (« En attente de paiement » ou « À
  vérifier ») ; les places sont libérées et aucun courriel ne part. Une réservation confirmée est
  définitive : le bouton n'apparaît plus et le serveur refuse l'annulation.
- Si deux organisateurs décident en même temps, une seule décision est appliquée ; l'autre voit
  « Cette réservation a changé entre-temps ».

Chaque courriel part dans la langue de la réservation, après l'enregistrement de la décision.
Si l'envoi échoue, la décision reste valide et le journal `reservation_confirmation_failed` ou
`reservation_refusal_failed` contient seulement l'identifiant interne.

### Courriels non envoyés

Un accusé, une confirmation ou un avis de refus qui n'a pas pu partir est enregistré dans la table
`EmailFailure` (AD-10). Tant qu'aucun organisateur ne l'a traité :

- la vue d'ensemble affiche le bandeau « N courriels non envoyés », avec un lien vers chaque fiche ;
- la fiche affiche « Un courriel n'a pas pu partir », avec le type de courriel et sa date.

Après avoir prévenu la personne, l'organisateur clique sur **J'ai prévenu la personne** : l'alerte
disparaît, et la ligne garde qui l'a traitée et quand. Le site ne renvoie pas le courriel tout seul.

## Paramètres de l'événement et état des comptes

L'onglet « Paramètres » (`/admin/parametres`) modifie la date et l'heure d'accueil, la date
limite, le lieu, le nombre de places, le prix normal d'une place de 15 ans et plus, le prix promo
et sa période, et le courriel Interac.
Les heures sont celles d'Ottawa ; les réservations ferment à 23 h 59 le jour de la date limite.
Un seul service applique les règles (AD-14), sous le verrou de l'événement :

- la date limite tombe avant le jour du dîner ;
- le nombre de places ne descend jamais sous les places déjà prises ;
- une nouvelle adresse Interac exige de confirmer que son dépôt automatique est activé ;
- le prix promo reste plus bas que le prix normal, et son dernier jour ne précède pas le premier ;
- les réservations déjà faites gardent leur prix et leur adresse Interac.

La promo est facultative : la case « Proposer un prix promo pendant une période » affiche son prix
et ses dates, du premier au dernier jour inclus, heure d'Ottawa. Sans elle, le prix normal
s'applique toujours. Les inscrits ne sont pas prévenus d'un changement.

Sur la vue d'ensemble, « Encaissé » additionne les réservations confirmées (une confirmation est
définitive), et « À recevoir » celles en attente de paiement ou à vérifier.
Ces deux sommes n'existent que dans `accounting.service.js` (AD-6).

## Export des participants confirmés

Sur la page « Réservations », le bouton « Exporter les confirmés (CSV) » télécharge
`participants-confirmes-AAAA-MM-JJ.csv`, lu dans la base au moment du clic (AD-15). Une ligne par
réservation confirmée, rangée par nom : nom, prénom, code, places (15 ans et plus et enfants),
courriel, téléphone, langue, montant payé, date de confirmation et remarque. Les réservations
annulées, même après confirmation, n'y figurent pas.

Le fichier est en UTF-8 avec sa marque d'octets, pour que les accents s'affichent dans Excel, et
ses colonnes sont séparées par des points-virgules, comme l'attend Excel en français. Google Sheets
et LibreOffice le lisent aussi. Une cellule qui commencerait par `=`, `+`, `-` ou `@` est
précédée d'une apostrophe, pour qu'aucun tableur ne l'exécute comme une formule. La route
`/api/admin/exports/confirmed-participants` exige une session d'organisateur.

## Déploiement

Netlify construit le site avec `netlify.toml`. Dans Netlify, définir `DATABASE_URL` pour chaque
contexte : branche `dev` pour les aperçus, branche principale pour la production. Les migrations
se lancent à la main avant le déploiement qui en a besoin, jamais pendant le build.

## Gestion de fin d’événement

Les organisateurs gèrent manuellement les réservations non confirmées. L’alerte avant clôture et l’annulation automatique de la veille ont été retirées des exigences le 16 novembre 2026. L’export CSV des confirmés reste disponible.
