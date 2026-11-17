# Relecture — grille du bon document d'architecture

Verdict : le document est conforme après les corrections des deux autres relectures.

- **Points de divergence.** Les couches, les erreurs, les langues, la machine à états, la concurrence, l'argent, le lien, les captures, la connexion, les courriels, la limite de requêtes, le temps, la tâche planifiée, l'événement, le cache et les environnements sont couverts. Il manquait la propriété du schéma : c'est l'AD-17.
- **Règles applicables.** Chaque Rule désigne un fichier, une fonction ou un test qui peut la faire respecter.
- **Différé sans risque.** Rien dans la section Différé ne permet à deux parties de diverger : Resend ne demande qu'un changement de configuration, et les sauvegardes sont de l'exploitation.
- **Code existant.** Le document ratifie le starter (cacheComponents, React Compiler, CSS Modules, alias `@/*`) au lieu de le contredire.
- **Couverture du brief.** Les §3 à §17 sont tous reliés dans la carte. §2 (moins de 5 minutes) et §16 (critères de réussite) relèvent de l'UX et des tests, pas de l'architecture.
- **Exploitation.** Environnements, hébergeur, crédits, migrations, secrets et planificateur sont décidés. La surveillance et les sauvegardes sont différées avec une condition de révision.
