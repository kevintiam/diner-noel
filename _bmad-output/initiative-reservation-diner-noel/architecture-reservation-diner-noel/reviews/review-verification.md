# Relecture — vérification des technologies

Verdict : vérifié pour l'essentiel ; deux points reposent sur des sources communautaires.

| Élément | Vérifié par | Statut |
| --- | --- | --- |
| next 16.4.6 | npm (`npm view`) ; correctifs de sécurité d'octobre 2026 (16.4.1) et de novembre 2026 (16.4.5) | OK |
| prisma 7.10.1 | npm ; le tag `latest` pointe sur 8.0.0-rc.33, Prisma 8 n'est pas sorti en version stable | OK, piège noté dans les conventions |
| zod, vitest, playwright, testing-library, bcryptjs, nodemailer, sharp, @date-fns/tz, lucide-react, prettier | npm | OK |
| Vercel Hobby limité à un usage non commercial | documentation Vercel (fair use guidelines) | OK : écarté |
| Netlify Free : usage commercial, 300 crédits, déploiement de production à 15 crédits, aperçus gratuits | blog et documentation Netlify | OK |
| Node 24 par défaut sur Netlify | changelog Netlify du 7 juillet 2026 | OK |
| Neon Free : 1 Go par projet | FAQ Neon (1er octobre 2026) | OK |
| Limite de 6 Mo des fonctions Netlify | forum Netlify seulement | Moyen : marge prise avec 4 Mo [ASSUMPTION] |
| En-tête `x-nf-client-connection-ip` | forum Netlify (réponse du personnel) | Moyen : repli sur `x-forwarded-for` déjà prévu |
| Fonction planifiée Netlify à côté de Next.js | documentation (sans confirmation de la mise en page `netlify/functions`) | Élevé : ajouter un planificateur externe de secours (corrigé dans AD-13) |
| Gmail SMTP avec mot de passe d'application | guides tiers 2026 | Moyen : à tester lundi |
