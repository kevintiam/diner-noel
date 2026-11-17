---
title: Refaçonner l’accueil selon Noël de Grâce
type: feature
created: 2026-11-15
status: done
route: oneshot
baseline_commit: 7885cd5a3fb759bbb1154f71ce6b969f0973736d
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/DESIGN.md'
  - '{project-root}/docs/code.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Kevin demande explicitement de refaire l’accueil à partir de `docs/DESIGN.md` et `docs/code.html`, en remplacement des pistes exploratoires précédentes. Appliquer la direction Noël de Grâce au site existant : ivoire, vert sapin profond, bordeaux, filets dorés, Playfair Display et Plus Jakarta Sans, en-tête soigné, grand accueil centré avec la photo de banquet fournie, cartes d’informations et composition de réservation lisible.

Conserver les véritables données de l’événement, le français/anglais, les états ouvert/complet/fermé, la lecture dynamique sous Suspense et le parcours réel vers le formulaire et la page de paiement. Reprendre la présentation du compte à rebours et de la disponibilité avec les dates et places réelles. La référence HTML est une référence visuelle : ses nombres de démonstration, règles de paiement à 48 h, gratuités, promesses logistiques et simulation de formulaire ne remplacent pas les règles existantes. Aucune nouvelle dépendance, migration, configuration d’outils, donnée personnelle ou modification d’environnement.

</frozen-after-approval>

## Implementation Notes

- Demande limitée à l’interface de l’accueil et à l’harmonisation de son en-tête/pied de page. Les composants, services, données et chemins de réservation existants sont réutilisés. Pas de changement d’API ni de règle métier.
- La branche `feature/lively-home` contient déjà l’accueil en cours ; la demande autorise sa refonte. Préserver les autres changements, le script personnel et les documents de preuve de paiement. Les anciens brouillons UX restent distincts ; les deux références de `docs` font autorité pour cette demande.
- Le corps du DESIGN.md précise les couleurs de marque plus exactement que sa palette générée : utiliser notamment #1A382B, #7A1C28, #C29B38 et #FDFBF7, avec un contraste textuel lisible. Conserver les styles des formulaires via les variables existantes.
- Implémentation en JavaScript et CSS Modules, avec les icônes lucide déjà installées et les polices fournies par next/font. Aucun script CDN ni framework de styles supplémentaire.
- Photo du HTML récupérée telle quelle dans `public/images/christmas-banquet.jpg` ; aucun autre visuel tiers recherché. Le compte à rebours ne fait que présenter la date de début, sans contrôler les réservations.
- Validation prévue : lint global, tests Vitest et Playwright sur la base dédiée, build de production, captures FR/EN à 390 et 1440 px, absence de débordement et navigation vers la réservation.
- Reprise du 16 novembre 2026, explicitement sans commit : l'instant initial du compte à rebours est capturé dans `load-event-overview.js`, au même instant que l'état des réservations, puis transmis à `HomeSections.jsx`. Aucun appel d'horloge ne subsiste dans son rendu. Un test avec lecture retardée reproduit l'écart avant correction et vérifie l'instant partagé.
- Les trois échecs de composants du bilan étaient des dépassements du délai de 5 secondes ; les 14 tests de ces fichiers passent avec `--maxWorkers 1`, sans changement de configuration, de délai ni d'assertions.
- Les quatre couples langue/format du contrôle visuel sont désormais quatre tests indépendants : le test unique dépassait 30 secondes après la production des quatre captures. Toutes les assertions et le délai standard sont conservés ; aucun test n'est désactivé.

## Verification

- 16 novembre 2026 : `npm run lint` réussit, y compris la limite de 300 lignes par fichier.
- `npm test -- --maxWorkers 1` : 192 tests unitaires et composants réussis ; les 28 tests de base échouaient à l'accès réseau dans le bac à sable, puis passent tous avec `npm test -- --project database --maxWorkers 1` hors du bac à sable. Total : 220 tests validés.
- `npm run test:e2e` : build de production réussi puis 20 parcours réussis, dont les quatre cas FR/EN à 390 et 1440 px, les états complets, les erreurs contrôlées, la réservation et les instructions Interac. Aucune erreur JavaScript ou console dans les quatre contrôles visuels.
- Captures FR/EN sur téléphone et ordinateur examinées : texte lisible, légende visible dans la photo, informations pratiques et boutons sans débordement.
- Relecture indépendante de la correction et de la paramétrisation des tests terminée ; aucun défaut retenu ne reste à corriger dans cette reprise. Les sujets préexistants différés restent dans `deferred-work.md`.
- Aucun commit ni push, conformément à la demande explicite de l'utilisateur.

## Review Triage Log

- R1 — medium, patch : la marge négative de la légende la plaçait hors de la photo sur ordinateur, dont overflow:hidden la coupait. Positionnement absolu dans le cadre corrigé ; assertion de visibilité dans le viewport ajoutée.
- R2 — low, patch : la barre bornait sa largeur mais pas aria-valuenow. Valeur accessible bornée à la capacité et à zéro, avec tests de dépassement et valeur négative.
- R3 — low, patch : image.complete vaut aussi true en cas d’échec. Le parcours exige désormais naturalWidth > 0.
- R4 — medium, patch : les assertions sur la date pouvaient viser une autre section. Les parcours ciblent la liste nommée du bandeau et vérifient sa date, son heure et son lieu dans le viewport à chaque format.
- R5 — low, patch : le thème partagé touche aussi la réservation et le paiement. Ajout de captures et contrôles de débordement au parcours mobile nominal existant, avec données fictives.
- R6 — low, defer : getAddressCity prend le dernier segment après une virgule ; le défaut est antérieur et le seed actuel respecte ce format. Une adresse avec province/code postal demanderait un contrat de format explicite ; hors refonte.
- R7 — medium, defer : l’ancien plan interdit photo et compte à rebours ; il précède la nouvelle demande. La spécification présente fait autorité, alignement de l’ancien document différé conformément au routage oneshot des corrections de specs.
- R8 — medium, defer : ce même ancien plan exige bandeau vert et verset, désormais remplacés par la référence DESIGN.md/code.html explicitement demandée. Même alignement documentaire à différer.
- R9 — low, defer : les cases de l’ancien plan restent incohérentes avec ses notes. Sa reprise doit s’appuyer sur les preuves de validation présentes ; correction du document différée.
- R10 — low, patch : les clés hero.verse et hero.verseReference n’ont plus de consommateur. Retrait des deux dictionnaires.
- Relecture indépendante du 16 novembre : aucun défaut propre au déplacement de l'horloge dans le chargeur serveur.
- R11 — medium, defer : `contact@example.org` est encore le contact cliquable du pied de page. Valeur fictive préexistante à remplacer avant publication, avec le véritable contact fourni par le propriétaire.
- R12 — false sur le parcours actuel : le format d'adresse du seed est bien pris en charge ; la variante avec province/code postal reste le sujet déjà différé R6, sans nouveau défaut démontré.
- R13 — low, rejeté : le test isolé ne prouve pas la déduplication dans une requête React complète ; `cache()` reste en place et cette correction ne modifie ni son argument ni son périmètre. Pas de lecture répétée constatée.
- R14 — low, patch : le parcours visuel ne contrôlait pas les erreurs d'hydratation. Il collecte désormais les erreurs JavaScript et console pour les deux langues aux deux formats et exige leur absence.
- R15 — low, defer : ajouter ultérieurement un parcours E2E de fermeture par date limite dans les deux langues. Les composants testent déjà l'état fermé ; aucun défaut visible n'est démontré par cette correction.
- R16 — maybe-false, rejeté : une horloge navigateur incorrecte ou un remplacement des props après la fin pourrait décaler le compte à rebours ; aucun déclencheur courant ni régression liée à cette correction n'est établi. Il faudrait reproduire ce scénario sur une navigation réelle pour le qualifier.
