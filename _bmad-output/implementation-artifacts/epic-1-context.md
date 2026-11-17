# Epic 1 Context: Les participants réservent et paient en ligne

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre de réserver, recevoir l'accusé et déposer une preuve Interac depuis un téléphone, sans compte ni aide, en français ou anglais, en moins de cinq minutes et sans surréservation. Première version attendue le 19 novembre 2026, publication le 20. La planification ne contient que des brouillons UX presque vides ; ce contexte utilise l'épopée, ses tickets, l'initiative, l'architecture et les décisions récentes sur tarifs et accueil.

## Stories

- Story 1.1: Fondation et accueil bilingue alimenté par la base, en ligne
- Story 1.2: Réserver des places sans en vendre trop
- Story 1.3: Envoyer l'accusé de réception
- Story 1.4: Déposer la preuve de paiement
- Story 1.5: Nettoyage technique après la mise en ligne

## Requirements & Constraints

- Pages et courriels bilingues ; langue enregistrée à la réservation, dictionnaires aux clés identiques. Collecter seulement coordonnées, effectifs et remarque facultative, sans date de naissance ni identité d'enfant. Maximum retenu : dix participants.
- Places prises dès la création, enfants compris ; fermeture à capacité ou date limite, même sous concurrence.
- Les décisions du 16 novembre remplacent le tarif unique : 0–14 ans gratuits ; 15 ans et plus à 35 $, ou 30 $ du 20 novembre à 00 h au 4 décembre à 00 h, heure d'Ottawa, fin exclue. Aucun adulte obligatoire. Une réservation entièrement gratuite est immédiatement confirmée, sans virement ni preuve : ne jamais lui demander de paiement dans le courriel.
- Masquer les compteurs publics de capacité/disponibilité ; conserver quantités adultes/enfants et états complet/fermé. Prix, montant et courriel Interac restent figés sur les anciennes réservations.
- Interac avec dépôt automatique seulement. L'accusé payant indique code, montant, instructions, absence de remboursement et lien personnel. Aucun autre courriel participant que l'accusé, la confirmation et le refus. Un échec d'envoi n'annule pas la réservation.
- Preuves JPG, PNG ou WEBP réelles, maximum 4 Mo, réencodées en WebP sans métadonnées et stockées en privé ; aucune substitution d'une ancienne capture. Dépôt seulement en attente de paiement.
- Budget de services : 0 $ mensuel. Données fictives dans tests/démonstrations. Ne jamais journaliser coordonnées, jetons, secrets ou captures.

## Technical Decisions

- Couches entrée → service → données. Prisma seulement dans l'adaptateur de base, Nodemailer dans celui des courriels ; services indépendants de HTTP et Next.js.
- Transaction verrouillant l'événement avant de compter les réservations non annulées ; aucune opération SMTP/image à l'intérieur. Transitions conditionnelles pour refuser les décisions concurrentes.
- Argent en cents entiers ; stockage UTC, affichage America/Toronto, formats fr-CA/en-CA, horloge injectable.
- Lien reconstruit avec SITE_URL, langue enregistrée et jeton aléatoire de 32 octets base64url, conservé mais jamais journalisé.
- Envoi unique sendEmail({ to, subject, text, html }) ; modèles fondés sur données et dictionnaires. Configuration SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM. Envoyer après commit ; échec journalisé avec identifiant de réservation, sans coordonnées ni message externe brut. File d'envoi et nouvelles tentatives différées ; transport simulé dans les tests.
- Formulaires par Server Action, dépôt multipart par Route Handler ; validation Zod, erreurs centralisées, limitation des envois. Lectures disponibilité/statut sous Suspense, sans « use cache ».
- Neon dev pour local/aperçus, test pour tests, branche principale pour production. Migrations manuelles autorisées, jamais pendant le build.

## UX & Interaction Patterns

Accueil → formulaire → lien personnel de paiement, dépôt et statut, réutilisable plus tard. Choix de langue sur chaque page. Noël de Grâce remplace les explorations antérieures : ivoire, vert sapin, bordeaux, doré, lisibilité mobile ; références visuelles sans autorité métier. Confirmation directe pour gratuité, attente de vérification pour paiement ; respecter la réduction des animations.

## Cross-Story Dependencies

Fondation → réservation → accusé et dépôt indépendants. Le dépôt installe « À vérifier » ; l'épopée organisateurs ajoute connexion, consultation protégée, confirmation/refus. Celle de clôture ajoute les automatismes. Leur courriel réutilise le même adaptateur. Le propriétaire configure le SMTP dédié et vérifie une réception réelle sur l'aperçu. Préserver les travaux locaux accueil/tarifs ; aucune autorisation de commit, push ou production n'en découle.
