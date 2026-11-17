---
title: "L'accueil reprend la structure de la maquette"
type: feature
ticket: '1'
created: '2026-11-15'
status: in-review
baseline_revision: '7885cd5a3fb759bbb1154f71ce6b969f0973736d'
route: full
route_source: auto
risk: low
review: quick
review_source: pinned
lenses_ran: [quick]
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md'
  - '{project-root}/_bmad-output/initiative-reservation-diner-noel/tickets/epic-lively-home/epic-lively-home.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** l'accueil est une simple fiche (titre, informations, places, bouton). Il ne ressemble pas à la maquette 1 et ne donne pas envie de réserver, alors que la mise en ligne est vendredi.

**Approche :** reprendre la structure de la maquette 1 :
- un nouvel en-tête commun aux pages publiques ;
- le bandeau vert avec le verset et les informations clés ;
- les informations pratiques en 4 cartes ;
- « Comment réserver » en 3 étapes ;
- un rappel final avec la barre des places ;
- un pied de page.

Le tout est bilingue, avec les données de la base. Le compte à rebours, les photos, le sens de la soirée et le déroulement viennent avec la story 4.2.

## Boundaries & Constraints

**Always :**
- La disposition suit la maquette 1, en commençant par le téléphone (une colonne) puis en s'élargissant sur ordinateur.
- Couleurs pleines de `globals.css`, sans dégradé ni emoji. Icônes `lucide-react` (pile de l'architecture). Texte lisible par des personnes âgées.
- Tout texte vient de `fr.json` / `en.json`, qui ont les mêmes clés. La date, l'heure, le lieu, le prix et les places viennent de la base (AD-3, AD-14).
- Les lectures de la base se font dans des composants dynamiques sous `<Suspense>`, qui appellent `await connection()` (AD-15). L'aperçu de l'événement est lu **une seule fois par requête**, même s'il sert à plusieurs sections.
- Les boutons « Réserver ma place » laissent place au message « complet » ou « fermé » quand on ne peut plus réserver (`BookingCallToAction`, story 1.2).
- Le choix de langue garde la même page dans l'autre langue (story 1.1).

**Never :**
- Pas de compte à rebours, de cadres photo, de « sens de la soirée » ni de déroulement : c'est la story 4.2.
- Pas de nouvelle donnée en base ni de migration.
- Pas de photo prise sur Internet.
- Pas de `console.log`, pas de push.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Erreur |
|---|---|---|---|
| Accueil ouvert, en français | `GET /fr`, 120 places libres | en-tête (nom du dîner, FR/EN, « Réserver ») ; bandeau « ICC Ottawa · Nepean », titre, sous-titre, verset de Luc 2.11, « Samedi 19 décembre 2026 », « Accueil à 18 h », lieu, « Réserver ma place », « 25 $ par place · 120 places restantes » ; 4 cartes (date ; « Accueil à 18 h, fin vers 22 h » ; lieu et adresse ; « 25 $ par place, repas compris ») ; « Comment réserver » ; « 120 places restantes sur 120 » avec la barre ; pied de page | — |
| Accueil en anglais | `GET /en` | mêmes sections en anglais (« Saturday, December 19, 2026 », « Doors open at 6 p.m. », « $25 per seat · 120 seats left », verset en World English Bible) | — |
| Une seule place restante | 1 place libre | « 1 place restante », au singulier, dans le bandeau et le rappel final | — |
| Complet | 0 place libre | plus aucun bouton « Réserver ma place » ; « Le dîner est complet… » dans le bandeau et dans le rappel ; barre pleine | — |
| Réservations fermées | date limite passée | « Les réservations sont fermées. » à la place des boutons | — |
| Heure avec minutes | dîner à 18 h 30 | « Accueil à 18 h 30 » / « Doors open at 6:30 p.m. » | — |
| Choix de langue | clic sur « EN » depuis `/fr/reservation` | `/en/reservation` ; la langue en cours est marquée comme active | — |
| Base injoignable | Neon ne répond pas | une seule ligne de journal, puis la page d'erreur bilingue | `error.jsx` |

</frozen-after-approval>

## Code Map

- `src/app/[lang]/page.jsx` [à réécrire] : assemble les sections ; les parties fixes sont rendues à l'avance, les parties dynamiques sous `<Suspense>`.
- `src/app/[lang]/_components/EventDetails.jsx` [à remplacer] : remplacé par trois entrées dynamiques (`HeroEventDetails`, `PracticalInfoSection` et `FinalCallToActionSection`) et un chargeur partagé, `load-event-overview.js`. Mettre à jour son test.
- `src/components/event/EventSummary.jsx` (+ CSS et test) [**à supprimer**] : remplacé par les cartes pratiques. Les clés `home.dateLabel`, `home.venueLabel`, `home.priceLabel` et `home.seatsLabel` disparaissent avec lui.
- `src/components/event/BookingCallToAction.jsx` [à réutiliser] : ajouter une variante `onDark` (bouton clair sur le bandeau vert).
- `src/app/[lang]/layout.jsx` et `layout.module.css`, `src/components/ui/LanguageSwitcher.jsx` [à étendre] : en-tête avec le nom du dîner, l'interrupteur FR/EN et « Réserver », plus le pied de page. Garder `<Suspense>` et le repli `LanguageLink`.
- `src/lib/format.js` [à étendre] : `formatEventDate` (date longue, première lettre en majuscule), `formatEventTime` (« 18 h » ou « 18 h 30 », « 6 p.m. ») et une option de `formatMoney` qui retire les cents nuls (« 25 $ »). Le comportement par défaut ne change pas : la page de paiement garde « 50,00 $ ».
- `e2e/home.spec.js` et `e2e/reservation.spec.js` [à adapter] : il y a maintenant deux boutons « Réserver ma place » et deux messages « complet », et le texte des places change.

## Tasks & Acceptance

**Exécution :**
- [ ] `package.json` : ajouter `lucide-react` 1.73.0, en version exacte.
- [ ] `src/config/site.js` : `SITE_CONTACT_EMAIL` (fictive, `contact@example.org`, à remplacer) et `SITE_COPYRIGHT_YEAR`.
- [ ] `src/lib/format.js` (+ tests) : les trois fonctions de mise en forme ci-dessus.
- [ ] `src/components/layout/SiteHeader.jsx` et `SiteFooter.jsx` (+ CSS et tests), `src/components/ui/LanguageSwitcher.jsx` (interrupteur FR/EN avec `aria-current`) (+ test), `src/app/[lang]/layout.jsx`.
- [ ] `src/app/[lang]/_components/load-event-overview.js` (+ test) : `cache()` de React autour de `getEventOverview(new Date())`. En cas d'échec, une seule ligne de journal, puis `Error("EVENT_OVERVIEW_FAILED")` générique.
- [ ] `src/components/home/HomeHero.jsx`, `HeroEventFacts.jsx`, `PracticalInfoCards.jsx`, `HowToBook.jsx`, `FinalCallToAction.jsx` et `SeatsProgress.jsx` (+ CSS et tests) : composants d'affichage purs.
- [ ] `src/app/[lang]/_components/HeroEventDetails.jsx`, `PracticalInfoSection.jsx` et `FinalCallToActionSection.jsx` (+ un test commun) : entrées dynamiques ; `src/app/[lang]/page.jsx`.
- [ ] `src/i18n/dictionaries/{fr,en}.json` : sections `header`, `hero`, `practical`, `howTo`, `final` et `footer`. Retirer les clés devenues inutiles.
- [ ] Supprimer `EventSummary.jsx`, `EventSummary.module.css` et `EventSummary.test.jsx`.
- [ ] `e2e/home.spec.js` (nouvelle structure, singulier, complet) et `e2e/reservation.spec.js` (premier bouton, premier message).

**Critères d'acceptation :**
- Étant donné l'accueil sur un téléphone de 412 px de large, quand on le parcourt, alors aucune section ne déborde horizontalement et chaque bouton fait au moins 48 px de haut.
- Étant donné l'accueil, quand on le compare à la maquette 1, alors les sections livrées apparaissent dans le même ordre : en-tête, bandeau, informations pratiques, « Comment réserver », rappel final, pied de page.
- Étant donné le code de la story, quand on lance `npm run lint`, alors aucun fichier ne dépasse 300 lignes.

## Implementation Notes

- **Entrées dynamiques regroupées.** Les quatre entrées dynamiques (`HeroVenueEyebrow`, `HeroEventDetails`, `PracticalInfoSection` et `FinalCallToActionSection`) sont dans un seul fichier, `src/app/[lang]/_components/HomeSections.jsx`, plutôt que dans trois. Elles partagent `readOverview()` et font chacune moins de 10 lignes. La mention du lieu (« ICC Ottawa · Nepean ») est aussi lue à la demande, puisqu'elle vient de la base.
- **Bouton « Réserver » de l'en-tête.** Il est masqué en dessous de 36 rem (téléphone), pour laisser la place à FR | EN ; le bouton du bandeau suffit sur téléphone. Il est visible sur ordinateur, comme dans la maquette.
- **Couleurs ajoutées dans `globals.css`.** `--color-gold-light` (texte or lisible sur le vert), `--color-sand` (fond du rappel final), `--font-size-section` et `--page-wide-max-width` (72 rem).
- **`BookingCallToAction`** reçoit une variante `onDark` et une flèche `ArrowRight`. Son comportement (bouton, ou « complet » / « fermé ») ne change pas.
- **`LanguageLink` devient `LanguageToggle`** (FR | EN avec `aria-current`). Le lien vers l'autre langue garde le nom accessible « English » / « Français », si bien que les parcours existants restent valides.
- **Fichiers supprimés comme prévu :** `EventDetails.jsx` et son test, `EventSummary.jsx`, son CSS et son test.
- **Parcours Playwright adaptés.** Le texte des places a changé ; il y a deux boutons « Réserver ma place » et deux messages « complet ».
- **Vérification :**
  - `npm run lint` passe ;
  - Vitest : 176 tests unitaires et de composants au vert ;
  - `npm run build` réussit ;
  - `npm run test:e2e` : 16 parcours au vert ;
  - captures de `/fr` à 1 280 px et sur téléphone (412 px) comparées à la maquette 1 : mêmes sections, dans le même ordre, sans débordement horizontal.

## Plan Change Log

## Review Triage Log

## Design Notes

**Une lecture par requête :**

```js
// src/app/[lang]/_components/load-event-overview.js
import { cache } from "react";
export const loadEventOverview = cache(async (route) => {
  try {
    return await getEventOverview(new Date());
  } catch (error) {
    logger.error("event_overview_failed", { route, method: "GET", ...describeError(error) });
    throw new Error("EVENT_OVERVIEW_FAILED");
  }
});
```

Chaque section dynamique fait `await connection()`, puis `await loadEventOverview(\`/${lang}\`)`.

**En-tête.** Fond crème, comme les maquettes 2, 3, 5 et 6, pour qu'il soit le même sur toutes les pages publiques. Le vert foncé est réservé au bandeau de l'accueil. Le lien « Réserver » de l'en-tête mène toujours au formulaire ; c'est le formulaire qui affiche « complet » ou « fermé » au besoin.

**Mention du lieu dans le bandeau.** `venueName` · la dernière partie de `venueAddress` après la virgule (« ICC Ottawa · Nepean »). Les deux viennent de la base.

**Barre des places.** Un `div` avec `role="progressbar"`, `aria-valuenow` (places prises), `aria-valuemax` (capacité) et un libellé tiré du dictionnaire. La largeur est en pourcentage.

## Verification

**Commandes :**
- `npm run lint` et `npx prettier --check src e2e prisma "*.js" "*.mjs" "*.json" "*.md"` : attendu aucune erreur.
- `npm test` : attendu tous les tests au vert.
- `npm run build` : attendu une construction réussie.
- `npm run test:e2e` : attendu tous les parcours au vert, ceux de l'accueil adaptés compris.

**Vérifications manuelles :**
- Captures de `/fr` et `/en` sur téléphone et sur ordinateur, comparées à la maquette 1.
