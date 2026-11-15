# Relecture — attaque adversaire

Verdict : quatre paires de parties qui respectent toutes les règles mais restent incompatibles. Toutes sont corrigées.

1. **Deux propriétaires du schéma de données (critique).** Deux stories en parallèle modifient `prisma/schema.prisma` et créent chacune une migration. Les migrations entrent en conflit, ou les champs divergent (par exemple `fullName` d'un côté, `firstName` et `lastName` de l'autre).
   → Nouvelle AD-17 : la première story crée tout le schéma initial ; ensuite, une seule migration par story, créée l'une après l'autre.
2. **Deux calculs des places prises (élevé).** Le service de réservation additionne dans la transaction verrouillée, tandis que la page d'accueil compte à sa façon. Les deux peuvent diverger.
   → AD-4 précise : une seule fonction de repository, `sumTakenSeats`, utilisée par les deux.
3. **Alerte envoyée pour l'ancienne date (élevé).** Un organisateur change la date du dîner après l'envoi de l'alerte. Comme `alertSentAt` est déjà rempli, aucune alerte ne part pour la nouvelle date.
   → AD-14 : changer la date de l'événement vide `alertSentAt`.
4. **Langue de l'alerte et des erreurs du tableau de bord (moyen).** AD-3 ne disait ni dans quelle langue part l'alerte aux organisateurs, ni d'où viennent les messages d'erreur du tableau de bord.
   → AD-3 : l'alerte est en français ; les erreurs du tableau de bord passent par le dictionnaire `fr` (AD-2).
