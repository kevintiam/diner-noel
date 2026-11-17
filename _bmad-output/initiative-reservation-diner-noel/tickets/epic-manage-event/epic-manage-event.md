---
type: epic
title: "Les organisateurs pilotent l'événement"
parent: initiative-reservation-diner-noel
covers: [R12, R15, R16, R17, R18]
sources: [_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md]
after: []
refined: false
risk: medium
---

# Les organisateurs pilotent l'événement

## Description

Le tableau de bord devient un outil de pilotage. Il filtre les réservations par statut et les cherche par nom ou code, affiche les compteurs et l'état des comptes, permet d'annuler une réservation et de modifier les paramètres de l'événement. Pour les exigences partagées, cette épopée livre la partie suivante :
- les filtres et la recherche (R12) ;
- la décision « annuler » (R16).

## Outcome

Les organisateurs voient d'un coup d'œil les places et l'argent, et ajustent l'événement sans passer par un développeur.

## Done when

- En production, les compteurs et l'état des comptes du tableau de bord correspondent aux réservations (encaissé = confirmées + annulées après confirmation).
- L'annulation d'une réservation, même confirmée, libère ses places et garde la décision.
- Une modification des paramètres respecte ses règles : date limite avant le dîner, places jamais sous les places prises, réservations existantes inchangées.
- Échéance : semaine du 23 novembre 2026.

## Boundaries

- Hors de cette épopée :
  - la connexion, la liste et la fiche, déjà livrées par epic-verify-payments ;
  - l'alerte, l'annulation de la veille et l'export CSV (epic-close-event).

## References

- parent — _bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md, R12, R15 à R18
- architecture — AD-4 à AD-6, AD-12, AD-14 du document d'architecture
- design — docs/maquettes/7. Tableau de bord — réservations.png, 8. Paramètres de l'événement.png
