---
title: Alléger l’accueil aux couleurs de Noël
type: feature
created: 2026-11-16
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent">

## Intent

Améliorer l’accueil pour obtenir une page belle et peu chargée aux couleurs de Noël. Composer une invitation aérée en ivoire, vert sapin et bordeaux, avec la photographie existante, une introduction concise, une réservation accessible et des informations pratiques faciles à parcourir sur téléphone et ordinateur.

</frozen-after-approval>

## Implementation Notes

- La demande porte sur l’accueil déjà modifié dans la branche `feature/lively-home`. Les modifications présentes servent de point de départ. Une copie des fichiers concernés dans le cache ignoré permet de contrôler les différences propres à cette intervention.
- Réutiliser les polices, la photographie, les composants de réservation et les données dynamiques existants. La refonte reste une modification réversible de présentation en JavaScript et CSS Modules.
- Composer le bandeau en deux colonnes sur ordinateur, puis en une colonne sur téléphone. Présenter le compte à rebours dans une ligne secondaire, alléger les encadrements et réduire la navigation redondante.
- Raccourcir le texte d’introduction dans les deux langues en conservant la célébration de la Nativité, Jésus-Christ et le programme familial. Présenter les tarifs par âge près de la réservation.
- Vérifier lint, tests existants et adaptés, build, états de réservation et rendu FR/EN sur téléphone et ordinateur.
- Les informations clés précèdent le bouton de réservation dans le DOM et dans la grille mobile. La photographie apparaît dans la colonne droite sur ordinateur et sous la réservation sur téléphone.
- La navigation comporte Informations, Réservation et FAQ. Les détails promotionnels se déplient sur l’accueil au moyen de l’élément HTML natif `details`. Les autres usages du composant tarifaire gardent leur présentation complète par défaut.
- Le bandeau réserve les zones de ses données pendant le chargement sous Suspense. Le compte à rebours utilise quatre colonnes simples sur téléphone.
- Fichiers touchés dans `src/components/home/` — HomeHero et HeroEventFacts avec leurs styles et tests, EventCountdown.module.css, PracticalInfoCards avec styles et tests, HowToBook, HomeFaq et FinalCallToAction avec leurs styles.
- Fichiers touchés ailleurs — `src/app/[lang]/page.jsx`, `src/components/event/EventPricingDetails.jsx` et son test, `src/components/layout/SiteHeader.jsx` et son style, `SiteHeaderFooter.test.jsx`, les dictionnaires `fr.json` et `en.json`, et `e2e/home.spec.js`.

## Review Triage Log

- R1 — medium, corrigé. Le retrait de l’ancre Réservation supprimait l’accès direct depuis l’en-tête mobile. La navigation finale conserve cette ancre et trois entrées.
- R2 — medium, corrigé. Sur téléphone, le premier bouton précédait la date et le lieu. Les faits événementiels se trouvent désormais avant le bouton et les parcours contrôlent leur position.
- R3 — low, corrigé. Le calendrier promotionnel et le tarif normal ajoutaient trop de texte avant le bouton. Un dépliant bilingue conserve les détails consultables, avec tests d’ouverture et d’absence de promotion.
- R4 — low, corrigé. Le fallback simple ne réservait aucune zone de la nouvelle grille. HomeHeroPlaceholder utilise les mêmes zones et des hauteurs réservées, avec un statut de chargement testé.
- R5 — low, corrigé. L’ordre visuel mobile différait de l’ordre du DOM. Les deux suivent désormais informations, réservation, photo, compte à rebours.
- R6 — low, corrigé. Les parcours ne couvraient que 390 et 1440 pixels. Ils couvrent maintenant 320, 390, 640, 1024 et 1440 pixels dans les deux langues, dont le dépliage des promotions.
- La relecture indépendante finale ne relève aucun défaut concret dans les corrections. Aucun sujet supplémentaire différé.

## Verification

- Lint réussi. Prettier vérifié. Aucun fichier source ou test de plus de 300 lignes.
- Les 224 tests unitaires et composants de la version finale réussissent. Les 40 tests de base de données ont également réussi pendant cette intervention, soit 264 tests Vitest validés.
- Build de production réussi, puis 29 parcours Playwright réussis, incluant les dix contrôles responsive FR/EN, les erreurs contrôlées, les états de réservation et le paiement.
- Huit vérifications complémentaires en Chromium sur le serveur local, aux largeurs 320, 390, 768 et 1440 pixels dans les deux langues. Aucun débordement horizontal ni erreur JavaScript, navigation vers le formulaire réussie.
- Captures finales FR sur téléphone et ordinateur et EN sur petit téléphone examinées visuellement.
- Passage de qualification du feedback Next.js effectué. Aucun incident Next.js qualifiant observé pendant cette demande.

## Ajustement du compte à rebours et du visuel

- À la demande du propriétaire, le compte à rebours adopte un fond vert sapin, un filet doré et quatre cadrans à grands chiffres ivoire. Les écrans de 368 pixels ou moins affichent les cadrans sur deux rangées pour conserver des libellés lisibles.
- Les styles concernés sont EventCountdown.module.css, HeroEventFacts.module.css et HomeHero.module.css. HeroEventFacts.jsx et son test utilisent désormais `public/images/christmas-table.webp`.
- La photo est créée avec l’outil intégré imagegen et enregistrée dans le projet en WebP, au format 1024 × 1536 pixels, pour 198 916 octets. La conversion conserve la composition générée.
- Les 11 tests des composants concernés et le lint réussissent. Le build de production réussit. Le contrôle Chromium vérifie les deux langues à 320, 390, 768 et 1440 pixels. Le rendu des libellés français est également contrôlé à 320 pixels après l’ajustement en deux colonnes.

La consigne finale transmise à imagegen est reproduite ci-dessous.

```text
Use case: photorealistic-natural. Asset type: portrait hero photograph for an elegant French Christmas community dinner website, displayed in an arch-shaped crop. Create a high-resolution natural editorial photograph of a beautifully set Christmas dinner table, no people. Portrait composition about 2:3. Foreground detailed ivory ceramic plates, burgundy linen napkins and clear glasses on warm oak, a natural evergreen and pinecone runner, a few deep red baubles, warm ivory taper candles and soft gold details. In the background, a softly out-of-focus Christmas tree with warm white fairy lights, tasteful burgundy ornaments. Intimate inviting Christmas atmosphere, authentic warm candlelight and soft window light, rich fir greens, burgundy, ivory and muted gold. Moderate depth of field with the front table setting and pine greenery crisp and detailed. Calm composition with breathing room, premium lifestyle photography, realistic materials. Keep the main table details within the central two-thirds to suit a rounded arch crop. No people, no lettering, no logos, no watermark. This is a brand new photo replacing the website's old banquet image.
```
