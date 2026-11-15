# Brief — Site de réservation du dîner de Noël

> Document d'entrée pour BMAD (product brief et PRD).
> Toutes les valeurs marquées *(fictif)* sont provisoires et seront remplacées par les vraies.

## 1. Contexte

La communauté chrétienne ICC Ottawa organise son dîner de Noël annuel.
Aujourd'hui, les réservations et les paiements se suivent à la main (messages, listes, virements à vérifier un par un).
Le site doit permettre aux personnes de réserver leurs places en ligne, de payer par virement Interac
et de recevoir une confirmation officielle une fois le paiement vérifié par un organisateur.

Le site n'utilise pas de paiement par carte (pas de Stripe) : le paiement passe uniquement par virement Interac.

## 2. Objectif

- Une personne réserve et envoie sa preuve de paiement en moins de 5 minutes, sur téléphone.
- L'organisateur voit en un coup d'œil qui a payé, combien de places sont confirmées, et valide chaque paiement en quelques clics.
- Personne n'est confirmé sans qu'un organisateur ait vérifié le virement dans son compte bancaire.

## 3. Utilisateurs

| Utilisateur | Besoin | Appareil principal |
|---|---|---|
| Participant (membre de la communauté, famille, invité) | Réserver une ou plusieurs places, payer, être rassuré que sa place est confirmée | Téléphone |
| Organisateur (administrateur) | Vérifier chaque virement Interac, confirmer ou refuser, suivre les places et l'argent encaissé | Ordinateur et téléphone |

- Quatre organisateurs, tous avec les mêmes droits.
- Pas d'inscription ni de compte pour les participants.
- Le site est bilingue : français et anglais.

## 4. Parcours du participant

1. Il arrive sur la page d'accueil et choisit sa langue (français ou anglais).
2. Il découvre le dîner : photos, sens de la fête, compte à rebours, date, heure, lieu, prix, programme.
3. Il clique sur « Réserver ma place ».
4. Il remplit le formulaire : prénom, nom, courriel, téléphone, nombre de places, remarque (facultatif).
5. Sa réservation est créée avec le statut « En attente de paiement ». Il voit les instructions de paiement :
   - le montant total (nombre de places × prix d'une place) ;
   - le courriel Interac à qui envoyer le virement ;
   - son code de réservation (ex. : `NOEL-4821`) à écrire dans le message du virement.
6. Il reçoit un accusé de réception par courriel : code, montant, instructions Interac
   et un lien personnel pour déposer sa preuve de paiement plus tard.
7. Il fait le virement Interac depuis l'application de sa banque.
8. Il dépose la capture d'écran du virement, tout de suite ou plus tard grâce au lien reçu par courriel.
9. Il voit : « Preuve reçue — en attente de vérification ». Sa réservation passe au statut « À vérifier ».
10. Quand un organisateur valide le paiement, il reçoit un courriel de confirmation avec le récapitulatif.

## 5. Parcours de l'organisateur

1. Il se connecte au tableau de bord (accès protégé).
2. Il voit les compteurs : places confirmées sur le total, réservations à vérifier, montant encaissé.
3. Il voit la liste des réservations, filtrable par statut et cherchable par nom ou code.
4. Il ouvre une réservation : informations du participant, montant attendu, code, capture d'écran agrandissable.
5. Il compare avec son compte bancaire (montant, nom de l'expéditeur, code dans le message).
6. Il clique sur « Confirmer le paiement » ou « Refuser » (avec un motif).
7. À la confirmation, le participant reçoit automatiquement le courriel de confirmation.
8. Il peut modifier les paramètres de l'événement : date et heure, date limite de réservation, nombre de places,
   prix d'une place, lieu, courriel Interac.

## 6. Fonctionnalités du MVP

### Site public
- Choix de la langue (français ou anglais) sur toutes les pages.
- Page d'accueil : photos, présentation, compte à rebours, informations pratiques, places restantes, bouton « Réserver ma place ».
- Formulaire de réservation en deux étapes : informations, puis paiement et dépôt de la preuve.
- Page de dépôt de la preuve, ouverte par le lien personnel reçu par courriel.
- Page de réservation reçue.
- Fermeture automatique des réservations quand il n'y a plus de places ou après la date limite.

### Tableau de bord organisateur
- Connexion sécurisée pour les quatre organisateurs.
- Compteurs, liste filtrable, recherche.
- Fiche de réservation avec la capture d'écran.
- Actions « Confirmer le paiement », « Refuser » (avec motif) et « Annuler » (désistement).
- État des comptes : montant encaissé (somme des paiements confirmés) et montant encore en attente.
- Paramètres de l'événement : date et heure, date limite de réservation, nombre de places (augmenter ou diminuer),
  prix d'une place, lieu, courriel Interac.
- Export de la liste des participants confirmés (CSV) pour l'accueil le soir du dîner.

### Courriels (dans la langue choisie par le participant)
- Accusé de réception dès la réservation : réservation enregistrée, en attente de paiement et de confirmation,
  avec le code, le montant, les instructions Interac et le lien pour déposer la preuve.
- Confirmation de place après validation du paiement.
- Avis de refus avec le motif, quand un organisateur refuse une preuve de paiement.

Aucun autre courriel : pas d'avis pour l'annulation automatique de la veille, ni pour un changement de date.
Si la date change, les organisateurs préviennent eux-mêmes les inscrits (avec l'export CSV).

## 7. Hors périmètre (MVP)

- Paiement par carte ou par un prestataire en ligne.
- Comptes participants, historique, modification de réservation par le participant.
- Liste d'attente quand le dîner est complet.
- Billets avec code QR.
- Tarifs différents (adulte, enfant).
- Plusieurs événements à la fois.

## 8. Règles métier

- Une réservation couvre une ou plusieurs places, au même prix (*à confirmer : maximum 10 places par réservation*).
- Montant à payer = nombre de places × prix d'une place.
- Chaque réservation reçoit un code unique, court et lisible (ex. : `NOEL-4821`).
- Les places sont comptées comme prises dès la création de la réservation.
  Une réservation refusée ou annulée libère ses places.
- On ne peut pas réserver plus de places qu'il n'en reste.
- Les réservations ferment à la date limite ou quand les places sont épuisées.
- Une réservation non confirmée (« En attente de paiement » ou « À vérifier ») est annulée automatiquement
  la veille de l'événement, sans courriel.
- Risque accepté : une réservation jamais payée bloque ses places jusqu'à la veille.
  Les organisateurs peuvent l'annuler à la main avant, s'ils le jugent utile.
- Le nombre de places peut augmenter ou diminuer, mais jamais en dessous du nombre de places déjà prises.
- La date limite de réservation est toujours avant la date de l'événement.
- Chaque réservation garde le prix d'une place et le courriel Interac en vigueur au moment de sa création :
  un changement de paramètre ne s'applique qu'aux nouvelles réservations.
- Le lien de dépôt de la preuve est personnel, impossible à deviner, et ne sert plus une fois la preuve envoyée.
- Seul un organisateur peut confirmer, refuser ou annuler. Chaque décision garde la date et l'organisateur qui l'a prise.
- Montant encaissé = somme des montants des réservations confirmées.

### Statuts d'une réservation

| Statut | Signification | Places comptées ? |
|---|---|---|
| En attente de paiement | Réservation créée, preuve de paiement pas encore envoyée | Oui |
| À vérifier | Preuve de paiement envoyée, pas encore vérifiée | Oui |
| Confirmée | Paiement vérifié par un organisateur, courriel envoyé | Oui |
| Refusée | Paiement introuvable ou incorrect, motif enregistré | Non |
| Annulée | Annulée par un organisateur (désistement) ou automatiquement la veille de l'événement | Non |

## 9. Données collectées

| Donnée | Obligatoire | Pourquoi |
|---|---|---|
| Prénom, nom | Oui | Identifier la personne et le virement |
| Courriel | Oui | Envoyer l'accusé de réception et la confirmation |
| Téléphone | Oui | Joindre la personne en cas de problème |
| Nombre de places | Oui | Calcul du montant et de la capacité |
| Remarque | Non | Information utile à l'organisation |
| Langue (français ou anglais) | Oui, prise automatiquement | Envoyer les courriels dans la bonne langue |
| Capture d'écran du virement | Oui | Preuve de paiement à vérifier |

Collecter le minimum. Pas de date de naissance, pas d'adresse, pas d'informations bancaires saisies dans le formulaire.

## 10. Design

- Sobre, chaleureux et digne : le dîner a un caractère religieux.
- Vivant et attrayant, pas un site figé : photos sur la page d'accueil, compte à rebours,
  petites animations discrètes (apparition des sections au défilement).
- Les animations respectent le réglage « réduire les animations » du téléphone.
- Photos : de préférence celles des dîners précédents de la communauté, avec l'accord des personnes reconnaissables
  (et des parents pour les enfants) ; sinon des photos libres de droits (table de fête, repas, décorations).
- **Aucun emoji.** Les icônes d'une bibliothèque (ex. : Lucide) sont permises.
- **Aucun dégradé**, pas d'effets « générés par IA » : pas de verre dépoli, pas de formes floues en arrière-plan,
  pas d'étincelles, pas de violet néon.
- Couleurs pleines et calmes : fond crème, vert sapin profond, rouge bordeaux en accent, touche dorée discrète.
- Typographie : un serif élégant pour les titres, un sans-serif lisible pour le texte.
- Pensé d'abord pour le téléphone. Lisible par les personnes âgées : texte assez grand, contraste élevé, gros boutons.
- Une maquette de référence existe (page d'accueil, réservation, paiement, confirmation, tableau de bord).

## 11. Contraintes techniques

- Next.js (App Router) en **JavaScript**, selon les règles du fichier `AGENTS.md` (version JavaScript).
- Base de données : PostgreSQL avec Prisma, hébergée sur Neon.
- Validation : Zod, côté formulaire et côté serveur.
- Tests : Vitest, Testing Library, Playwright.
- À décider avec l'architecte : gestion des deux langues, stockage des captures d'écran, service d'envoi de courriels,
  authentification des organisateurs, hébergement du site, tâche automatique d'annulation la veille de l'événement.

## 12. Sécurité et vie privée

- Les captures d'écran contiennent des informations bancaires : stockage privé, visibles seulement par un organisateur connecté,
  jamais par une URL publique.
- Les captures d'écran et les données des réservations sont conservées après le dîner (décision de l'organisation).
  Elles restent donc protégées dans la durée : accès réservé aux organisateurs connectés.
- Fichiers acceptés : images JPG, PNG ou WEBP, 5 Mo maximum (*à confirmer*). Vérifier le vrai type du fichier, pas seulement l'extension.
- Protection contre les envois en masse sur le formulaire et sur la page de dépôt (limite de requêtes).
- Aucune donnée réelle dans les tests et les jeux de données.

## 13. Valeurs de l'événement

| Information | Valeur |
|---|---|
| Nom | Dîner de Noël 2026 |
| Date et heure | Samedi 19 décembre 2026, 18 h *(fictif)* |
| Lieu | ICC Ottawa, 75 Auriga Drive, Nepean *(à confirmer)* |
| Prix d'une place | 25 $ *(fictif)* |
| Nombre de places | 120 *(fictif)* |
| Date limite de réservation | Samedi 12 décembre 2026, 23 h 59 *(fictif)* |
| Courriel Interac | paiements@example.org *(fictif)* |

Le courriel Interac doit avoir le **dépôt automatique** activé. Sinon, le site doit aussi afficher
la question et la réponse de sécurité à utiliser pour le virement.

## 14. Décisions prises

| Question | Décision |
|---|---|
| Accusé de réception après la réservation ? | Oui : il confirme la réservation et indique qu'elle attend la confirmation du paiement |
| Réserver d'abord, envoyer la preuve plus tard ? | Oui, grâce au lien personnel reçu par courriel |
| Combien de temps une réservation reste-t-elle non confirmée ? | Jusqu'à la veille de l'événement, même sans preuve de paiement |
| Combien d'organisateurs ? | Quatre, tous avec les mêmes droits |
| Liste d'attente ? | Non |
| Langues ? | Bilingue : français et anglais |
| Courriels en plus de l'accusé et de la confirmation ? | Seulement l'avis de refus, avec le motif |
| Conservation des captures d'écran ? | Conservées après le dîner |
| Paramètres modifiables ? | Date et heure, date limite, nombre de places, prix, lieu, courriel Interac |
| Compte à rebours ? | Vers la date et l'heure du dîner (la date limite est affichée à côté) |

## 15. Points encore à confirmer

1. Maximum de 10 places par réservation.
2. Taille maximale de 5 Mo pour une capture d'écran.

## 16. Critères de réussite

- Un participant termine sa réservation sur téléphone sans aide, en français ou en anglais.
- Chaque paiement est vérifié et confirmé en moins d'une minute par l'organisateur.
- Zéro place vendue en trop.
- Chaque participant reçoit son accusé de réception, puis son courriel de confirmation.
