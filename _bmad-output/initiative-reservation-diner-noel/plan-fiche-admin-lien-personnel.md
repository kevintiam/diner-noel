---
title: 'La fiche admin affiche le lien personnel avec un bouton « Copier »'
type: feature
ticket: ''
created: '2026-11-17'
status: built
baseline_revision: 'ca9d1029bf9fb6ffe47685791e8fb5eb83cfa736'
route: full
route_source: auto
risk: low
review: quick
review_source: pinned
lenses_ran: [quick]
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Un participant qui perd son lien personnel (ou dont le courriel n'est jamais arrivé) ne peut plus déposer sa preuve, et la fiche admin ne montre pas ce lien ; quand un courriel échoue, la fiche dit « Prévenez la personne directement » sans rien à lui donner.

**Approach:** Sur la fiche `/admin/reservations/[id]`, un panneau « Lien personnel » affiche l'adresse complète de la page de la réservation, construite depuis `SITE_URL` dans la langue de la réservation, avec un bouton « Copier le lien ». L'avis d'échec de courriel renvoie vers ce panneau.

## Boundaries & Constraints

**Always:** lien construit uniquement depuis `SITE_URL` (AD-7), jamais depuis les en-têtes de la requête ; affiché seulement après `requireOrganizer()` ; langue = celle de la réservation ; textes en français ; JSDoc typée sur chaque fonction exportée ; aucun fichier au-delà de 300 lignes ; journal via `src/lib/logger.js`.

**Never:** pas de bouton « Renvoyer l'accusé » ni de page publique « Retrouver ma réservation » (reportés dans `deferred-work.md`) ; pas de migration ni de dépendance ; ne pas lire `getEmailEnv()` pour la fiche (une configuration SMTP absente ne doit pas masquer le lien) ; ne jamais journaliser le jeton ni l'adresse ; ne pas modifier les fichiers en cours dans une autre session : `DecisionPanel.jsx`, `ReservationDetail.test.jsx`, `reservation-status.service(.test).js`, `reservation-decision.service.db.test.js`, `README.md`, `MANUEL-ADMIN.md`, le document d'architecture.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Réservation FR | `SITE_URL=https://diner.example.test/`, langue `FR` | `https://diner.example.test/fr/r/<jeton>` affiché, bouton « Copier le lien » | — |
| Réservation EN | langue `EN` | même adresse avec `/en/r/` | — |
| SMTP absent | `SITE_URL` valide, variables SMTP vides | lien affiché normalement | — |
| `SITE_URL` absente ou invalide | variable vide, ou `http://` hors localhost | « Lien indisponible : l'adresse publique du site (SITE_URL) n'est pas configurée. », aucun bouton | `personal_link_unavailable` journalisé avec `reservationId` seul |
| Presse-papiers refusé | `writeText` rejette | le lien reste lisible et sélectionnable à côté du bouton | comportement existant de `CopyButton` |
| Courriel de décision échoué | `?emailNotice=failed` | l'avis invite à donner le lien du panneau « Lien personnel » | — |

</frozen-after-approval>

## Code Map

- `src/config/env.js` -- `emailEnvSchema.SITE_URL` (l. 45-57) contient la règle à extraire en `siteUrlSchema`, réutilisée telle quelle par `emailEnvSchema` ; `getEmailEnv()` exige aussi le SMTP, donc inutilisable ici.
- `src/server/email/templates/email-layout.js` -- réutiliser `buildPersonalUrl(lang, token, siteUrl)` (l. 73) et `toEmailLang(language)` ; ne pas les déplacer.
- `src/server/db/reservation-admin.repository.js` -- `findReservationDetail` lit déjà `token` et `language` (`include` sans `select`) : aucun changement.
- `src/app/admin/reservations/[id]/page.jsx` -- `ReservationDetail` : colonne de gauche (`ReservationFacts`, `ProofList`), avis `hasEmailFailed` (l. 97-103). **Travail parallèle :** une autre session construit le suivi des échecs de courriel (`prisma/schema.prisma`, migration `20261117230000_email_failures`) et peut modifier ce fichier et les services de courriel en même temps. Relire la page juste avant chaque édition, s'en tenir à des modifications minimales et localisées, ne jamais réécrire le fichier entier ; ne toucher ni au schéma, ni à la migration, ni aux services d'envoi.
- `src/components/ui/CopyButton.jsx` -- client, props `value`, `label`, `copiedLabel`, `describedBy`.
- `src/components/admin/ReservationDetail.module.css` -- classes `panel`, `panelTitle`, `panelIcon` à réutiliser pour l'allure des panneaux.
- `src/config/email-env.test.js` -- tests de `parseEmailEnv` à compléter ; modèle des tests de configuration.
- `src/components/ui/CopyButton.test.jsx` -- modèle de simulation du presse-papiers.

## Tasks & Acceptance

**Execution:**
- [x] `src/config/env.js` -- extraire `siteUrlSchema` ; ajouter `getSiteUrl(source = process.env)` qui renvoie l'origine validée ou lève `Error("Variable SITE_URL manquante ou invalide")` sans la valeur -- lire `SITE_URL` seul.
- [x] `src/server/services/personal-link.service.js` -- `getPersonalLinkForOrganizer(reservation, source)` → adresse ou `null` (journal `personal_link_unavailable`) -- règle dans un service, pas dans la page.
- [x] `src/components/admin/PersonalLinkPanel.jsx` + `.module.css` -- panneau serveur « Lien personnel » : aide courte, adresse en texte sélectionnable (`overflow-wrap: anywhere`), `CopyButton` « Copier le lien » / « Lien copié » relié par `describedBy` ; variante `null`.
- [ ] `src/app/admin/reservations/[id]/page.jsx` -- calculer le lien, placer le panneau sous `ReservationFacts`, reformuler l'avis d'échec pour renvoyer au panneau. *(Lien et panneau faits ; avis en attente, voir Implementation Notes.)*
- [x] Tests -- `email-env.test.js` (`getSiteUrl` valide, absente, invalide) ; `personal-link.service.test.js` (FR, EN, jeton encodé, `null` + journal sans jeton) ; `PersonalLinkPanel.test.jsx` (lien + bouton qui copie la valeur exacte ; variante indisponible sans bouton).

**Acceptance Criteria:**
- Given un organisateur connecté, when il ouvre une fiche, then le panneau « Lien personnel » montre l'adresse de la réservation et « Copier le lien » met exactement cette adresse dans le presse-papiers.
- Given aucune session, when on ouvre l'adresse d'une fiche, then on est renvoyé à la connexion et aucun lien n'apparaît.
- Given une décision dont le courriel a échoué, when la fiche se recharge, then l'avis indique de transmettre le lien du panneau « Lien personnel ».

## Implementation Notes

- 2026-11-17 : pendant l'implémentation, l'autre session a retiré l'avis `?courriel=non-envoye` de la page et l'a remplacé par `src/components/admin/EmailFailureNotice.jsx` (échecs enregistrés en base, AD-10). Ce fichier et son test étaient en cours d'écriture : non modifiés ici, conformément à « ne pas modifier les fichiers en cours dans une autre session ». **Reste à faire, une fois l'autre session terminée :** dans `EmailFailureNotice.jsx`, remplacer « Prévenez-la directement, par courriel ou par téléphone, puis indiquez-le ici. » par un texte qui renvoie au panneau, avec un lien `href={`#${PERSONAL_LINK_ANCHOR}`}` (constante exportée par `PersonalLinkPanel.jsx`, ancre `personal-link`), puis adapter `EmailFailureNotice.test.jsx`. Le critère 3 n'est donc pas encore rempli.
- Apostrophes typographiques (’) dans les textes JSX, comme le reste de l'interface ; le test du panneau vérifie « Lien indisponible : l’adresse publique du site (SITE_URL) n’est pas configurée. ».
- `personal_link_unavailable` est journalisé en `warn`, avec `reservationId` seul.
- 2026-11-17, décision de l'utilisateur : la phrase de `EmailFailureNotice.jsx` reste à l'autre session, qui en est propriétaire. Le critère 3 et la ligne « Courriel de décision échoué » du tableau restent ouverts tant qu'elle ne l'a pas faite ; le reste du plan est livré et vérifié (57 tests ciblés, lint, build).

## Plan Change Log

## Review Triage Log

Passe 1 (lentille `quick`) — high 0 · medium 2 · low 3 · false 0 · maybe-false 0.

| # | Constat | Verdict | Route | Preuve / action |
|---|---------|---------|-------|-----------------|
| 1 | Critère 3 et ligne « Courriel de décision échoué » non remplis : `EmailFailureNotice.jsx` dit encore « Prévenez-la directement… » | medium | defer | Vérifié dans le fichier. L'utilisateur a choisi de laisser cette phrase à l'autre session, propriétaire du fichier ; entrée ajoutée à `deferred-work.md`. |
| 2 | `personal-link.service.js` lit `process.env` (paramètre par défaut), contre la convention « seul `env.js` lit `process.env` » (architecture l. 245) | low | patch | Vérifié par grep. Défaut retiré ; `getSiteUrl(source)` garde le repli sur l'environnement. Test du repli toujours vert. |
| 3 | Le texte d'aide « où la personne dépose sa preuve » est faux hors `PENDING_PAYMENT` payante | low | patch | Vérifié : `proof.service.js:28` et `PaymentDetails.jsx` (l. 38-49). Texte rendu neutre quant au statut. |
| 4 | Le commentaire de `PERSONAL_LINK_ANCHOR` décrit un lien encore inexistant | low | patch | Commentaire reformulé (« que l'avis … peut viser »). |
| 5 | `page.jsx` mélange ce travail et celui de l'autre session (avis `EmailFailureNotice`, retrait de `searchParams`) : le diff seul ne construit pas sur `ca9d102` | medium | patch (au commit) | Vérifié : seules l'import, l'appel `getPersonalLinkForOrganizer` et `<PersonalLinkPanel>` sont de ce plan. Un commit ne doit indexer que ces lignes de `page.jsx`, pas le travail inachevé de l'autre session. |
| 6 | Critère 2 et intégration page → panneau sans test automatisé | low | rejeté | Comportement correct à la lecture (`requireOrganizer()` l. 72 avant le calcul l. 76) et vérifié par requête HTTP sans session lors de l'implémentation. Le corriger demande un parcours Playwright sur la base de test partagée avec la migration en cours de l'autre session : plus qu'une correction directe. |

Après correctifs : 4 fichiers de tests ciblés, 57 tests verts ; `npm run lint` et `npm run build` réussis.

## Verification

**Commands:**
- `npx vitest run src/config/email-env.test.js src/server/services/personal-link.service.test.js src/components/admin/PersonalLinkPanel.test.jsx src/components/ui/CopyButton.test.jsx` -- expected: tous les tests passent (aucun ne touche la base).
- `npm run lint` -- expected: aucune erreur.
- `npm run build` -- expected: build réussi.

**Manual checks (if no CLI):**
- `npm run dev`, connexion, ouvrir une fiche FR puis EN : le lien affiché ouvre la bonne page de paiement ; à 375 px, l'adresse passe à la ligne sans débordement.
