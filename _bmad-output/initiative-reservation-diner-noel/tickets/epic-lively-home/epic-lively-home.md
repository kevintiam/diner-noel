---
type: epic
title: "L'accueil donne envie de venir"
parent: initiative-reservation-diner-noel
covers: [R2]
sources: [_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md, docs/maquettes/1. Accueil.png]
after: []
refined: true
risk: low
---

# L'accueil donne envie de venir

## Description

La page d'accueil simple prend toute la forme de la maquette 1. Elle comprend :
- un en-tête avec le nom du dîner, FR/EN et le bouton « Réserver » ;
- un bandeau avec le verset et les informations clés ;
- le compte à rebours ;
- le sens de la soirée, les informations pratiques, les dîners précédents et le déroulement ;
- « Comment réserver » et un rappel final avec les places restantes ;
- un pied de page.

Pour R2, cette épopée livre la partie « vivante » ; la partie simple vient d'epic-reserve-and-pay.

## Outcome

Un visiteur comprend tout de suite ce qu'est le dîner et a envie de réserver, sur téléphone, en français ou en anglais.

## Requirements

- R1 (parent R2): partie vivante. La page d'accueil présente les photos, la présentation et le sens de la fête, le programme, et un compte à rebours vers la date et l'heure du dîner, avec la date limite affichée à côté. Elle mène à la réservation par « Réserver ma place », en haut comme en bas de la page.

## Constraints

- Celles de l'initiative s'appliquent : sobre et digne, sans emoji ni dégradé ni effet « généré par IA », pensé d'abord pour le téléphone, lisible par des personnes âgées, et animations désactivées sous « réduire les animations » (brief §10).
- La disposition suit la maquette 1 ; le brief l'emporte sur elle (§10).
- Tout texte existe en français et en anglais (AD-3). Les dates, prix et places viennent de la base (AD-14, AD-15).
- Échéance : jeudi 19 novembre 2026, pour la mise en ligne de vendredi (décision de l'utilisateur du 2026-11-15).

## Done when

- En production, l'accueil reprend toutes les sections de la maquette 1 dans les deux langues, sur téléphone comme sur ordinateur.
- Le compte à rebours compte vers la date et l'heure du dîner lues en base, avec la date limite à côté.
- Les animations s'arrêtent quand le téléphone demande de réduire les animations.
- Avant que des photos réelles ne remplacent les cadres, les personnes reconnaissables ont donné leur accord écrit, et les parents pour les enfants.

## Boundaries

- Hors de cette épopée : le formulaire, la page de paiement et les places restantes, calculées par epic-reserve-and-pay (réutilisées ici).
- Aucun emoji, aucun dégradé, aucun effet « généré par IA » (brief §10).
- Must not change: le choix de langue garde la même page dans l'autre langue (story 1.1), et le bouton « Réserver ma place » disparaît quand c'est complet ou fermé (story 1.2).

## References

- parent — _bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md, R2
- architecture — AD-3, AD-14, AD-15 et la convention Styles du document d'architecture
- design — docs/maquettes/1. Accueil.png

## Notes

- Decision (2026-11-15): toute la maquette 1 est livrée avant la mise en ligne de vendredi, au lieu de la semaine du 23 (choix de l'utilisateur). L'épopée passe avant epic-verify-payments dans l'ordre de construction.
- Decision (2026-11-15): deux stories. La 1 est le tracer bullet : en-tête, bandeau et sections fixes, la structure de la page. La 2 ajoute le compte à rebours, les photos et le déroulement.
- Assumption: les textes de la maquette (sens de la soirée, déroulement horaire, « fin vers 22 h ») servent de contenu provisoire, traduit en anglais, jusqu'aux vrais textes. Le verset est Luc 2.11 : Louis Segond 1910 en français, World English Bible en anglais (deux traductions du domaine public).
- Assumption: tant que les vraies photos n'existent pas, des cadres libellés « Photo : … à remplacer » les remplacent. Aucune photo prise sur Internet.
- Open question: l'adresse de contact du pied de page. Elle reste fictive (`contact@example.org`) jusqu'à ce que l'organisation la fournisse, à remplacer avant vendredi.
