# État d’avancement — Dîner de Noël

Analyse du 16 novembre 2026, sur la branche `feature/payment-proof-upload`, commit `4b93374`.

## Appréciation générale

Le cœur du site est développé : accueil bilingue, réservation, tarification par âge et promotion, instructions Interac, dépôt privé de preuve et administration. Le projet reste incomplet sur la consultation des captures. Sa préparation à la production dépend aussi de la recette réelle du courriel et de l’environnement hébergé.

Après l’annulation de R19 et R20 par le propriétaire le 16 novembre 2026, le rapprochement des **21 exigences actives** donne **19 exigences couvertes dans le code et 2 partielles**. Ce décompte mesure la présence fonctionnelle, pas une recette de production ni un pourcentage d’effort. Les nouvelles règles approuvées sur les enfants gratuits, les promotions et le masquage des compteurs publics remplacent les anciennes règles correspondantes du brief.

## Fonctionnalités

| Domaine                                                   | État observé                                                              | À terminer ou à valider                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Accueil FR/EN, informations, photo, compte à rebours, FAQ | Développé                                                                 | Valider le contenu final et remplacer le contact fictif           |
| Réservation sans compte, effectifs adultes/enfants        | Développé                                                                 | Recette sur le site hébergé                                       |
| Capacité et réservations simultanées                      | Développé avec transaction et tests de concurrence                        | Confirmer le fonctionnement sur l’environnement cible             |
| Fermeture si complet ou date limite atteinte              | Développé                                                                 | Ajouter le parcours navigateur de fermeture à échéance en FR/EN   |
| Prix adulte, gratuité 0–14 ans, calendrier promotionnel   | Développé, promotion modifiable dans l’admin                              | Mettre à jour le suivi de la spécification                        |
| Montant et adresse Interac figés par réservation          | Développé                                                                 | Valider les vraies coordonnées de paiement                        |
| Lien personnel et instructions de paiement                | Développé                                                                 | Tester les liens reçus par courriel réel                          |
| Accusé de réception FR/EN                                 | Code et tests présents                                                    | Réception réelle SMTP et clôture formelle de la story 1.3         |
| Dépôt JPG/PNG/WebP de 4 Mio, réencodage et stockage privé | Story 1.4 clôturée                                                        | Vérifier le délai des uploads suspendus chez l’hébergeur          |
| Connexion et déconnexion des organisateurs                | Développé                                                                 | Confirmer les quatre comptes opérationnels en production          |
| Tableau de bord, recherche, filtres et fiches             | Développé                                                                 | La liste charge toutes les réservations, sans pagination          |
| Consultation et agrandissement des captures               | **Incomplet — story 2.2**                                                 | Ajouter une route de lecture protégée et l’affichage des images   |
| Confirmation, refus motivé et annulation manuelle         | Développé avec historique et protection contre les décisions concurrentes | Recette complète avec refus puis nouveau dépôt                    |
| Courriels de confirmation et de refus FR/EN               | Code et tests présents                                                    | Réception réelle et vérification des deux langues                 |
| Comptabilité : encaissé et encore attendu                 | Développé                                                                 | Recette organisateur des totaux et annulations après confirmation |
| Paramètres : dates, lieu, capacité, prix/promo, Interac   | Développé                                                                 | Recette finale et paramètres réels                                |
| Export CSV des confirmés                                  | Développé avec route protégée et tests                                    | Confirmer le téléchargement navigateur et l’ouverture en tableur  |

La fiche admin ne lit actuellement que l’identifiant, le type, la taille et la date des preuves. `ProofList.jsx` affiche une icône et ces métadonnées : aucun agrandissement ni accès aux octets de la capture n’est implémenté. Cela ne constitue pas une fuite publique des captures; c’est une fonction de lecture manquante.

L’alerte aux organisateurs et l’annulation automatique de la veille sont retirées des exigences à la demande du propriétaire le 16 novembre 2026. Elles ne sont plus du travail restant. Les réservations non confirmées restent actives jusqu’à une décision manuelle; l’export CSV reste prévu. Les champs techniques préexistants ne nécessitent aucune migration pour cette modification de périmètre.

## Traçabilité des exigences

Référence : `_bmad-output/initiative-reservation-diner-noel/initiative-reservation-diner-noel.md`.

| Exigences                                 | État dans le code | Réserve                                                                                                                     |
| ----------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| R1–R11                                    | Couvertes         | Réception réelle des courriels et comptes de production non vérifiés; R2/R3/R6 interprétées selon les changements approuvés |
| R12 : liste, recherche, fiche et captures | Partielle         | Images non consultables                                                                                                     |
| R13–R15 : confirmer, refuser, annuler     | Couvertes         | Courriels réels non vérifiés                                                                                                |
| R16 : historique des décisions manuelles  | Couverte          | Confirmation, refus et annulation par un organisateur                                                                       |
| R17–R18 : comptes et paramètres           | Couvertes         | Recette en production non effectuée                                                                                         |
| R19 : alerte organisateurs                | Annulée           | Retirée du périmètre par le propriétaire le 16 novembre 2026                                                                |
| R20 : annulation de la veille             | Annulée           | Retirée du périmètre par le propriétaire le 16 novembre 2026                                                                |
| R21 : export CSV                          | Couverte          | Recette navigateur et tableur à confirmer                                                                                   |
| R22 : lecture privée des captures         | Partielle         | Stockage privé présent; lecture authentifiée à construire                                                                   |
| R23 : limites d’envoi et de connexion     | Couverte          | Améliorations de pseudonymisation et nettoyage reportées                                                                    |

## Qualité technique

La structure sépare pages/actions, services, dépôts et validation. Les imports applicatifs du client Prisma restent dans `src/server/db/`. Les décisions utilisent une transition conditionnelle et une transaction, et les courriels partent après l’enregistrement. La réservation reste conservée si le courriel échoue.

Les protections visibles comprennent la validation Zod, les mots de passe bcrypt, les sessions à jeton aléatoire haché en base, les cookies HttpOnly/Secure en production, la vérification serveur des organisateurs et les limites de requêtes. Les captures sont vérifiées par signature et décodage, redimensionnées et réencodées sans métadonnées privées. Ceci est une inspection du dépôt, pas un audit de sécurité exhaustif.

Le dépôt comporte **90 fichiers de tests Vitest** et **7 fichiers de parcours Playwright**. Les tests couvrent notamment les réservations simultanées, doubles dépôts, retours arrière transactionnels et décisions concurrentes. Le parcours complet réserver → déposer → refuser → redéposer → confirmer n’est pas encore couvert de bout en bout dans les deux langues.

Vérifications de cette analyse :

- `npm run lint` : réussi.
- `npm run build` : réussi.
- Contrôle de longueur des fichiers JS/JSX/CSS/Prisma écrits à la main, hors migrations et code généré : aucun dépassement de 300 lignes.
- Tests Vitest : la suite complète n’a pas été validée pendant cet audit. La première exécution est restée sans résultat; la relance a signalé un échec dans `ReservationDetail.test.jsx` (test des coordonnées du participant), puis sa progression est devenue trop lente. La relance ciblée de ce même fichier réussit : **9 tests sur 9**, sans modification du code ni des délais. L’échec initial n’est donc pas reproduit; la suite globale reste à exécuter jusqu’à son terme dans un environnement stable.
- Aucun contrôle des types autonome ni mesure de couverture n’a été exécuté. `checkJs: true` est configuré, mais il n’existe pas de script dédié de vérification des types.

Les journaux de cette analyse sont conservés dans `node_modules/.cache/project-audit-*.log`, hors suivi Git. Aucune donnée de production ni aucun secret n’a été consulté. Des retouches visuelles de l’admin sont apparues dans l’arbre de travail après le lancement des contrôles : le lint et le build réussis attestent l’état contrôlé à leur lancement, pas toutes ces retouches ultérieures. Les parcours Playwright n’ont pas été relancés dans cet audit.

## Suivi et documentation

Le suivi BMAD ne permet pas encore de déduire l’avancement réel : les stories 1.1 et 1.2 portent `built` avec des cases anciennes décochées, la story 1.3 et la tarification portent `in-progress` malgré leur code présent, et la story 1.4 porte `done`. Les épopées de pilotage et de clôture n’ont pas toutes leurs stories détaillées. Les anciens plans d’accueil ne correspondent plus à la direction visuelle approuvée.

Le README indique encore que la promotion n’est pas modifiable depuis l’administration, alors que l’interface, l’action, le service et leurs tests la prennent en charge.

## Travail restant, dans l’ordre conseillé

1. **Finir la story 2.2** : lecture authentifiée de chaque capture et agrandissement; tester l’accès sans session et les captures multiples.
2. **Valider les courriels sur l’aperçu** : accusé, confirmation et refus en FR/EN, puis ouverture du lien et nouveau dépôt après refus. Clore la story 1.3 sur ces preuves.
3. **Finaliser la recette de l’administration et de l’export**, puis ajouter le parcours complet bilingue.
4. **Préparer la publication** : contact réel, valeurs de l’événement, adresse Interac avec dépôt automatique, comptes organisateurs, migrations appliquées sur la bonne base et configuration privée de l’hébergement. Leur état actuel n’est pas attesté par cette analyse locale.
5. **Actualiser BMAD et le README**, puis traiter les améliorations reportées : HMAC des IP, purge des limites expirées, uploads suspendus, pagination et format de ville/adresse.

## Périmètre de ce constat

Analyse du brief, des exigences et épopées, des spécifications, du schéma et des migrations, du code public/admin, de l’authentification, des courriels, du stockage des preuves, des configurations et des tests présents. Les comptes externes, l’état réel des bases hébergées, la délivrabilité SMTP et la recette de production ne sont pas attestés. Aucun code applicatif, dépendance, migration ou fichier d’environnement n’a été modifié pour cette analyse.
