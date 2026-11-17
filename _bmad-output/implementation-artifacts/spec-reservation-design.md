---
title: Harmoniser le formulaire avec l’accueil de Noël
type: feature
created: 2026-11-16
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent">

## Intent

Redessiner le formulaire de réservation dans la continuité de l’accueil récemment validé. Présenter les coordonnées et les convives dans une composition aérée, puis un récapitulatif clair aux couleurs de Noël avec les informations réelles du dîner, le total et l’action de réservation. Adapter la présentation à l’ordinateur et au téléphone, dans les deux langues.

</frozen-after-approval>

## Implementation Notes

- Reprendre la palette ivoire, vert sapin et bordeaux, les polices et la photo de Noël existantes.
- Composer le formulaire en deux colonnes à partir de 1024 pixels, avec les informations et convives à gauche et le récapitulatif à droite. Les mêmes blocs s’empilent sur téléphone dans leur ordre de lecture.
- Extraire les champs de coordonnées et le récapitulatif dans des composants dédiés pour respecter la limite de 300 lignes. Réutiliser FormField, AgeSeatCounter et les calculs existants.
- Transmettre au récapitulatif uniquement la date et le lieu de l’événement déjà chargé côté serveur. Les paramètres d’affichage supplémentaires restent facultatifs pour les appelants existants du formulaire.
- Adapter les tests existants, contrôler les réservations payantes et gratuites, les erreurs et les limites d’effectifs, puis vérifier le rendu bilingue et responsive.
- Les coordonnées sont regroupées dans ReservationContactFields. ReservationSummary présente les informations publiques du dîner, les montants et l’action d’envoi. ReservationForm conserve les effectifs et l’action serveur.
- La photographie du récapitulatif apparaît sur ordinateur. La composition mobile privilégie les champs et les montants. Les bordures des saisies et les états de focus sont renforcés.
- Le formulaire expose son état occupé pendant l’envoi et focalise son message général après une réponse en erreur. La gratuité du récapitulatif dépend du montant total et d’un effectif positif, ce qui couvre aussi les adultes lorsque le tarif est nul.
- Fichiers de page modifiés dans `src/app/[lang]/reservation/` — page.jsx, page.module.css, _components/ReservationFormSection.jsx et son test.
- Fichiers de formulaire dans `src/components/reservations/` — ReservationForm.jsx, ReservationForm.module.css, ReservationForm.test.jsx, ReservationAge.test.jsx. Création de ReservationContactFields.jsx, ReservationSummary.jsx et ReservationSummary.module.css.
- Autres fichiers adaptés — dictionnaires fr.json et en.json, e2e/pricing.spec.js et e2e/reservation.spec.js.

## Review Triage Log

- R1 — medium, corrigé. Le message de virement était affiché pour un tarif adulte nul pourtant confirmé gratuitement par le service. Deux tests bilingues reproduisent le défaut avant correction, puis valident le bouton et l’aide de confirmation gratuite.
- R2 — medium, corrigé. L’éloignement du bouton et des erreurs sur téléphone rend leur repérage difficile. Le message général reçoit le focus après la réponse en erreur. Les tests de composant et le parcours réel vérifient ce focus et la visibilité dans la fenêtre.
- R3 — false pour un défaut fonctionnel. Les deux effectifs détaillés et le montant sont déjà présentés ensemble. Un autre effectif total constitue une proposition éditoriale.
- R4 — false pour une régression. Le message décrit la limite de politique par réservation. La disponibilité borne séparément les compteurs, avec les tests existants couvrant deux et trois places disponibles.
- R5 — low, corrigé. L’attribut aria-busy expose la phase d’envoi. Le test de soumission vérifie ses valeurs pendant et après l’attente, ainsi que le verrouillage des champs.
- R6 — low, corrigé. Les tests vérifient l’adresse, l’heure et les aides de paiement ou de gratuité dans les deux langues.
- La vérification de paiement attend désormais son titre avant de chercher le montant, car l’URL peut changer pendant que le formulaire précédent est encore affiché. Les assertions de montant et d’enregistrement sont conservées.
- La relecture indépendante finale ne relève aucun défaut concret supplémentaire.

## Verification

- Lint et Prettier réussissent. Tous les fichiers sources et tests respectent la limite de 300 lignes.
- Les 22 tests des composants de réservation et de leur entrée serveur réussissent.
- Le build de production et les neuf parcours de réservation et de tarifs réussissent. Après les dernières corrections, les trois parcours payant, gratuit et erreur de saisie ont été rejoués avec succès.
- Les dix contrôles Chromium FR/EN aux largeurs 320, 390, 768, 1024 et 1440 pixels vérifient la présentation, l’absence de débordement, la sélection des effectifs et les deux actions gratuite et payante.
- Les captures françaises sur téléphone et ordinateur et anglaise sur petit téléphone ont été examinées visuellement.
- Le passage de qualification du feedback Next.js ne retient aucun incident qualifiant pour cette demande.
