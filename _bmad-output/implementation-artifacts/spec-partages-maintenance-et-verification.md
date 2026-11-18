---
title: 'Partages, maintenance et vérification du site'
type: 'feature'
created: '2026-11-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'ca9d1029bf9fb6ffe47685791e8fb5eb83cfa736'
context: ['C:/Users/tiamk/Desktop/Projet/diner-noel/AGENTS.md']
review_loop_iteration: 0
---

<frozen-after-approval reason="périmètre confirmé par le propriétaire le 17 novembre 2026">

## Intent

**Problème :** les partages n’ont pas d’aperçu dédié, les IP utilisent une empreinte sans clé, les données techniques expirées s’accumulent et un upload suspendu n’a pas de délai applicatif. Des parcours navigateur et une commande de vérification des types manquent.

**Approche :** livrer les quatre lots demandés ensemble, préserver les modifications locales autorisées et fournir une documentation française accessible. Le propriétaire a confirmé la poursuite dans l’arbre modifié et demandé cette documentation.

## Boundaries & Constraints

**Toujours :** respecter API/actions → services → dépôts ; Zod, AppError et traductions FR/EN ; secrets privés uniquement ; 300 lignes par fichier ; délais globaux bornés ; tests sur la seule base dédiée. Utiliser la photo publique existante pour les partages, sans donnée de réservation. Garder les fonctions de suivi des courriels et de lien personnel existantes.

**Jamais :** purger réservations, captures ou historique ; réintroduire l’annulation automatique ; déployer ou toucher la base de production ; modifier une migration appliquée ; masquer les erreurs de types avec des désactivations générales.

## I/O & Edge-Case Matrix

| Situation | Résultat attendu | Erreur |
|---|---|---|
| Partage /fr ou /en | Titre, description, URL et image publics, langue correcte | SITE_URL invalide refusée sans sa valeur |
| IP identique et même secret | Clé HMAC stable ; secret différent = empreinte différente | Secret absent/invalide refusé |
| Maintenance quotidienne | Suppression des sessions expirées et compteurs inactifs depuis 24 h | Échec journalisé sans secret |
| Corps multipart suspendu ou trop lent | Arrêt au budget total, annulation sans attente indéfinie | 408 traduit |
| Navigateur sans réponse | Arrêt à une échéance supérieure, choix conservé et commandes réactivées | Message invitant à vérifier le statut |
| Refus puis nouvelle preuve | Même réservation, deux preuves conservées, confirmation finale | Dépôt ultérieur refusé |
| Échéance dépassée | Réservation fermée en FR/EN, même avec formulaire périmé | Aucune réservation créée |

</frozen-after-approval>

## Code Map

- `src/app/[lang]/layout.jsx`, `src/config/env.js` : métadonnées et origine validée ; `public/images/` : photos disponibles.
- `src/server/services/rate-limit.service.js`, `src/server/db/rate-limit.repository.js` : clés et fenêtres actuelles de 15 minutes.
- `src/server/db/organizer.repository.js` : sessions expirées ignorées, non purgées.
- `src/lib/read-limited-form-data.js`, `src/components/reservations/ProofUploadForm.jsx` : lecture et fetch sans délai.
- `e2e/proof.spec.js`, `e2e/admin.spec.js` : parcours à réutiliser dans deux nouveaux fichiers, sans écraser les travaux locaux.
- `package.json`, `jsconfig.json` : checkJs actif, TypeScript installé indirectement mais commande absente.

## Tasks & Acceptance

**Execution :**
- [x] Métadonnées publiques : ajouter Open Graph traduit et image existante ; tester les valeurs et les URL.
- [x] Config/service de limitation : valider le secret HMAC tardivement et isoler un secret fictif de test.
- [x] Nouveau dépôt/service de maintenance et fonction Netlify quotidienne : purger uniquement les données techniques expirées ; tests des bornes.
- [x] Lecture multipart et formulaire : budgets serveur/navigateur, annulation et messages traduits ; tests des flux suspendus.
- [x] `e2e/payment-lifecycle.spec.js`, `e2e/booking-deadline.spec.js` : cycle complet et fermeture, y compris formulaire périmé, dans les deux langues.
- [x] `package.json`, configuration de types et annotations : commande reproductible, dépendances explicites et erreurs applicatives corrigées.
- [x] `MODIFICATIONS-TECHNIQUES.md`, `README.md`, `.env.example` : explications simples, réglages et commandes ; suivi du travail reporté actualisé.

**Acceptance Criteria :**
- Given une page publique FR/EN, when ses métadonnées sont lues, then l’aperçu est complet et ne contient aucun lien personnel.
- Given des données techniques actives et expirées, when le nettoyage s’exécute, then seules les données expirées prévues disparaissent.
- Given une transmission suspendue, when le délai expire, then l’opération termine et l’utilisateur peut reprendre.
- Given les commandes de vérification, when elles s’exécutent, then types, lint, tests et nouveaux parcours passent.

## Implementation Notes

- Vérification : 640 tests unitaires/composants, 82 tests de base dédiée, typecheck et lint réussis. Les 54 parcours existants et nouveaux hors cycle sont réussis ; les 2 cycles FR/EN ont réussi après correction de l’interactivité avant hydratation. Une passe complète finale suivra la revue.
- Aucun schéma ni migration ajouté par cette tâche. La maintenance garde une marge de 15 min en plus de 24 h ; elle préserve les données métier. Les variantes de runtime Prisma sont déclarées opaques uniquement dans tsconfig.check.json, sans changer la résolution de Next.js.
- La configuration privée locale HMAC a été préparée sans afficher la clé. Netlify et les plateformes de partage n’ont pas été modifiés ; leurs réglages sont décrits dans MODIFICATIONS-TECHNIQUES.md.

- Les modifications locales antérieures sont conservées. Une copie du diff initial est dans `node_modules/.cache/partages-baseline.patch`. D’autres travaux peuvent apparaître pendant l’exécution : relire les fichiers avant chaque modification, ne rien écraser et ne pas committer les changements de l’utilisateur.
- TypeScript 6.0.3 et les types React/Node sont déjà installés indirectement. Le premier diagnostic est dans `node_modules/.cache/typecheck-initial.log` ; il inclut à tort le runtime JavaScript tiers de Prisma, qu’il faut traiter comme dépendance, sans désactiver les vérifications du code applicatif.
- La fonction Netlify planifiée quotidienne doit être native, sans route publique de purge. Son exécution réelle dépend d’un déploiement publié ; ne pas déployer pour cette tâche.

## Spec Change Log

## Review Triage Log

| Relecteur / constat | Verdict | Preuve et suite |
|---|---|---|
| Blind 1 : acquittement d’un échec arrivé après l’affichage | medium | Le dépôt EmailFailure met à jour tous les échecs ouverts ; ce travail existait avant cette tâche (diff initial et fichiers non suivis recensés). Reporté dans le suivi des courriels, sans modifier ce chantier de l’utilisateur. |
| Blind 2 : disparition du signal immédiat si la persistance de l’échec échoue | high | Le remplacement de l’ancien avis par EmailFailure appartient aux modifications initiales. Cas réel de double panne ; reporté au chantier courriel existant. |
| Blind 3 : erreur réseau également incertaine | medium | Une réponse peut se perdre après l’écriture de la preuve. Patch : message d’état incertain pour toute erreur de transport/décodage, testé. |
| Blind 4 : SITE_URL requis au build | low | Le guide le disait, le README restait ambigu. Patch documentaire : distinguer SITE_URL du SMTP. |
| Blind 5 : migration EmailFailure non rappelée | low | La procédure du README impose déjà les migrations avant déploiement ; le guide simple ajoute ce rappel et identifie la migration de l’autre chantier. Aucune migration créée ici. |
| Blind 6 : état d’avancement encore historique | low | Le constat daté est conservé ; un complément en tête renvoie aux changements désormais livrés. |
| Blind 7 : liste intégrale des échecs de courriel | medium | Ce chargement appartient au chantier EmailFailure initial. Croissance possible pendant une panne prolongée ; amélioration reportée. |
| Blind 8 : HTTP 408 non testé | medium | Patch : requête réellement suspendue vers POST, statut/code/traduction FR/EN et absence de submitProof vérifiés. |
| Blind 9 : préservation du fichier privé non testée | medium | Patch : suppression de la réécriture par regex, ajout seulement en fin de fichier et quatre tests temporaires (CRLF, multiligne, vide et idempotence). |
| Blind 10 : empaquetage Netlify non vérifié | medium | Empaquetage officiel @netlify/zip-it-and-ship-it réussi : API v2, Node 24 et schedule 0 7 * * *. Module empaqueté exécuté avec succès sur la seule base dédiée de test, y compris runtime Prisma/WASM. Aucun déploiement. |
| Edge 1 : acquittement concurrent | medium | Même défaut que Blind 1, préexistant ; même report. |
| Edge 2 : signal immédiat supprimé | high | Même défaut préexistant que Blind 2 ; même report au chantier courriels. |
| Verification 1 : URL réelle absente des assertions de fiche | medium | Le composant de lien appartient au travail antérieur ; la nouvelle boucle FR/EN vérifie maintenant l’URL exacte du panneau sur la fiche réelle. |
| Verification 2 : langue avant lecture non protégée | medium | Même groupe que Blind 8 ; test de l’en-tête envoyé par le formulaire et du 408 traduit ajouté. Après lecture, la langue du formulaire est explicitement prioritaire. |
| Verification 3 : script privé sans test | medium | Même groupe que Blind 9 ; tests de préservation de chaque autre variable et absence de clé dans stdout/stderr. |

## Verification

Résultats finaux : 640 tests unitaires/composants et 82 tests sur la base dédiée réussis ; 31 tests ciblés après revue réussis (dont huit nouvelles vérifications). Suite complète de 56 parcours navigateur réussie, puis les deux cycles FR/EN relancés avec assertion de l’URL personnelle réussis. Typecheck, lint et build de production (lancé par Playwright) réussis. Empaquetage Netlify officiel et exécution de son module sur la base dédiée réussis. Journaux dans node_modules/.cache/partages-*.log et métadonnées dans netlify-packaged-result.json.

Les travaux courriel préexistants restent dans l’arbre de l’utilisateur ; trois améliorations repérées en revue sont reportées dans deferred-work.md. Aucun commit global ni push : les modifications utilisateur sont intercalées dans les mêmes fichiers et le HEAD a changé pendant la tâche. Le diff complet de revue est conservé dans le répertoire temporaire, sans staging des travaux utilisateur.

- `npm run typecheck` : aucune erreur du code couvert ; périmètre documenté.
- `npm run lint`, `npm test`, `npm run build` : succès.
- `npm run test:e2e` : nouveaux parcours et régressions pertinentes réussis sur la base dédiée.
