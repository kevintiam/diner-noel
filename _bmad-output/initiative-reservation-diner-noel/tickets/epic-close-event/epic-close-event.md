---
type: epic
title: "Le dîner se clôture sans travail manuel"
parent: initiative-reservation-diner-noel
covers: [R16, R19, R20, R21]
sources: [_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md]
after: []
refined: false
risk: medium
---

# Le dîner se clôture sans travail manuel

## Description

La fin de l'événement se gère toute seule :
- l'alerte aux organisateurs s'il reste des preuves à vérifier ;
- l'annulation automatique de la veille ;
- l'export CSV des participants confirmés pour l'accueil.

Pour R16, cette épopée livre la décision « annulation automatique », sans organisateur.

## Outcome

Personne n'est confirmé ou annulé par oubli, et l'accueil a sa liste à jour le soir du dîner.

## Done when

- Une fonction planifiée appelle la tâche horaire en production. Dans un test avec horloge simulée, l'alerte part une seule fois et l'annulation ne touche que les réservations non confirmées.
- Le bandeau d'alerte s'affiche dans le tableau de bord entre l'alerte et l'annulation.
- L'export CSV des confirmés s'ouvre dans un tableur avec les accents corrects.
- Échéances : alerte avant le 16 décembre, annulation avant le 18 décembre, export avant le 19 décembre 2026.

## Boundaries

- Hors de cette épopée : l'annulation manuelle par un organisateur (epic-manage-event).
- Must not change: aucun courriel au participant lors de l'annulation automatique (brief §6).

## References

- parent — _bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md, R16, R19 à R21
- architecture — AD-4, AD-5, AD-10, AD-12, AD-13 du document d'architecture
