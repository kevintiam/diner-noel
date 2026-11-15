---
type: epic
title: "Les organisateurs vérifient les paiements"
parent: initiative-reservation-diner-noel
covers: [R1, R11, R12, R13, R14, R16, R22, R23]
sources: [_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md]
companions: [_bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md]
after: []
refined: true
risk: high
---

# Les organisateurs vérifient les paiements

## Description

Les quatre organisateurs se connectent, voient les réservations, ouvrent une fiche avec ses captures, puis confirment ou refusent le paiement. Le participant reçoit le courriel correspondant dans sa langue. Pour les exigences partagées avec d'autres épopées, cette épopée livre la partie suivante :
- les courriels de confirmation et de refus bilingues (R1) ;
- la liste et la fiche, sans filtres ni recherche (R12) ;
- les décisions « confirmer » et « refuser » (R16) ;
- la lecture des captures (R22) ;
- la limite des tentatives de connexion (R23).

## Outcome

Les organisateurs vérifient chaque virement depuis le tableau de bord en moins d'une minute, et chaque participant vérifié reçoit sa confirmation.

## Requirements

- R1 (parent R1): partie organisateurs. Les courriels de confirmation et d'avis de refus partent dans la langue du participant.
- R2 (parent R11): les quatre organisateurs, avec les mêmes droits, se connectent à un tableau de bord protégé ; sans connexion, aucune page ni donnée du tableau de bord n'est accessible.
- R3 (parent R12): partie liste et fiche. Un organisateur voit la liste des réservations et ouvre une fiche avec les informations du participant, le montant attendu, le code et toutes les captures agrandissables.
- R4 (parent R13): un organisateur confirme le paiement d'une réservation « À vérifier » ; le participant reçoit dans sa langue le courriel de confirmation avec le récapitulatif.
- R5 (parent R14): un organisateur refuse une preuve avec un motif choisi dans une liste (dont « Montant incomplet ») ; la réservation revient « En attente de paiement » sans libérer ses places, et le participant reçoit dans sa langue l'avis de refus avec le motif et le même lien.
- R6 (parent R16): partie confirmer et refuser. Chaque décision garde la date, l'organisateur et, pour un refus, le motif.
- R7 (parent R22): partie lecture. Les captures ne sont visibles que par un organisateur connecté.
- R8 (parent R23): partie connexion. Les tentatives de connexion sont limitées.

## Constraints

- Celles de l'initiative s'appliquent, en particulier :
  - pas d'autre courriel aux participants que la confirmation et l'avis de refus ;
  - aucune donnée réelle dans les tests ;
  - budget de 0 $.
- Échéance : jeudi 19 novembre 2026, ou lundi 23 novembre si le temps manque (§17).

## Done when

- En production, un organisateur se connecte, ouvre une réservation « À vérifier », voit ses captures et confirme ; le participant reçoit la confirmation dans sa langue.
- Un refus pour « Montant incomplet » envoie l'avis avec le motif et le lien. Le lien accepte une nouvelle capture, et les places restent prises.
- Quand deux organisateurs décident en même temps sur la même réservation, une seule décision est appliquée.
- Sans connexion, aucune page du tableau de bord ni aucune capture n'est accessible.
- Le parcours Playwright réserver → déposer → confirmer, et refuser → redéposer, passe en français et en anglais.

## Boundaries

- Hors de cette épopée :
  - les filtres, la recherche, les compteurs, l'état des comptes, l'annulation et les paramètres (epic-manage-event) ;
  - l'alerte, l'annulation de la veille et l'export CSV (epic-close-event).
- Must not change: une place reste comptée tant que la réservation n'est pas annulée (AD-4).

## References

- parent — _bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md, section Requirements
- architecture — _bmad-output/initiative-reservation-diner-noel/architecture-reservation-diner-noel/architecture-reservation-diner-noel.md, en particulier AD-2 à AD-5, AD-8 à AD-11
- design — docs/maquettes/7. Tableau de bord — réservations.png, 9. Courriel de confirmation.png

## Notes

- Decision (2026-11-15): les exigences sont reprises des seules lignes de l'initiative ; l'architecture règle le reste.
- Decision (2026-11-15): le tracer bullet est la story 1, « connexion et liste ». Elle fait le chemin le plus court à travers toutes les couches de l'administration, et l'utilisateur fournit les courriels des quatre organisateurs. La story 3 (décisions simultanées) est la moins sûre.
- Decision (2026-11-15): le nettoyage (story 4) et la suite de bout en bout (story 5) passent après la mise en ligne.
- Open question: la liste des motifs de refus en français et en anglais (initiative, Notes). Proposition par défaut pour la story 3 : aucun virement reçu, montant incomplet, capture illisible ou incorrecte.
