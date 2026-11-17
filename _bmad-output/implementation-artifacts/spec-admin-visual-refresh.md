---
title: Refaire les écrans et clarifier la navigation de l’admin
type: feature
created: 2026-11-16
status: reverted
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent">

## Intent

Refaire les écrans de l’espace admin et clarifier leur navigation dans le thème de Noël, priorité choisie par le propriétaire. Harmoniser la connexion, le tableau de bord, la liste et les fiches de réservation ainsi que les paramètres. Utiliser les couleurs vert sapin, bordeaux, ivoire et or, avec une composition lisible, aérée et adaptée au téléphone.

</frozen-after-approval>

## Implementation Notes

- Le 17 novembre 2026, à la demande du propriétaire, la refonte et la correction de l’en-tête ont été annulées. Les 15 fichiers de code et de parcours ont été rétablis à leur contenu précédant le commit de refonte (`4b93374`). Les prochaines modifications visuelles doivent se faire pas à pas avec le propriétaire. Les notes ci-dessous décrivent la refonte annulée.

- La branche dédiée est `feature/admin-visual-refresh`. Le manuel local préexistant reste sous le contrôle du propriétaire.
- La connexion réutilise la photo de Noël du projet. Le tableau de bord regroupe le suivi du dîner et les compteurs, avec un accès prioritaire aux paiements à vérifier.
- La navigation conserve ses trois destinations réelles et ses états actifs, avec un en-tête sur deux rangées sur grand écran et des onglets lisibles sur téléphone. Le retour au site public reste accessible à toutes les largeurs.
- Les services, les actions, les accès privés aux preuves et les formulaires existants restent les points d’entrée des actions présentées.
- Vérifier les composants admin, les parcours de connexion, les réservations, les paramètres et l’export, avec des données fictives sur la base de test dédiée.
- Les styles partagés harmonisent les champs, les filtres, les décisions de paiement et les paramètres. Les contrastes et la densité des compteurs ont été ajustés pour les petits écrans.
- Fichiers : `src/app/admin/{page.jsx,admin-page.module.css,layout.module.css}`, `src/app/admin/login/{page.jsx,login.module.css}`, `src/components/admin/AdminAccount.jsx` et les styles de `AdminHeader`, `DashboardStats`, `EventFillCard`, `TodoCallout`, `ReservationFilters`, `ReservationTable`, `DecisionPanel`, `EventSettingsForm` ; parcours dans `e2e/admin.spec.js`.
- Les captures attendent le décodage de la photo pour vérifier son rendu réel. Aucun changement des services ou de la configuration.

## Review Triage Log

Revue indépendante Blind Hunter, puis contrôle des corrections : aucun nouveau constat. Les couches Edge Case Hunter et Verification Gap ne sont pas actives dans la route oneshot. Aucun élément reporté.

| Constat | Verdict et preuve | Traitement |
| --- | --- | --- |
| Collision possible entre compte et navigation sur grand écran | medium : la composition en une ligne manquait de place autour de 1280 px. | patch : deux rangées ; contrôle géométrique dans les tests à cinq largeurs. |
| Retour au site public absent sur téléphone | medium : le lien des onglets était masqué sous 640 px. | patch : lien accessible dans la zone du compte sur téléphone. |
| Contraste de la jauge de remplissage insuffisant | medium : la piste claire donnait un contraste de 2,04:1. | patch : piste vert foncé, contraste de 5,96:1 avec l’or. |
| Libellés des compteurs trop étroits à 320 px | low : les icônes forçaient certains textes sur quatre lignes. | patch : icônes décoratives masquées sous 368 px et hauteur des en-têtes alignée. |
| Compteurs trop larges lorsque le dîner est absent | low : la grille de secours conservait deux colonnes sur grand écran. | patch : quatre colonnes lorsque les compteurs sont seuls. |
| Largeur intermédiaire et collision non vérifiées | medium : les tests ne couvraient pas 1280 px ni la séparation des rangées. | patch : ajout de 1280 px et comparaison des limites du compte, de la marque et de la navigation. |
| Liste non parcourue dans le test annoncé | medium : le parcours allait directement du tableau de bord à la fiche. | patch : navigation vers la liste, recherche visible, capture et contrôle du débordement avant ouverture de la fiche. |

## Verification

- `npm.cmd test -- --maxWorkers 1` : 90 fichiers, 645 tests réussis.
- `npx.cmd playwright test e2e/admin.spec.js e2e/admin-settings.spec.js e2e/admin-export.spec.js` : 19 parcours réussis, build de production inclus.
- Après ajout de l’attente du décodage de la photo : `npx.cmd playwright test e2e/admin.spec.js --grep "page de connexion"` : 5 parcours réussis.
- `npm.cmd run lint`, Prettier sur les 15 fichiers de code touchés et `git diff --check` : réussis. Tous ces fichiers restent sous 300 lignes.
- Contrôle visuel des captures avec données fictives : connexion, tableau de bord, liste et fiche ; largeurs couvertes de 320 à 1440 px.
- Passe de retour Next.js : aucun problème spécifique confirmé à signaler ; l’attente du décodage est une synchronisation normale des captures.
