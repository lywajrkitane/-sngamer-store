# SNGAMER STORE V5 — PRÊT POUR DÉPLOIEMENT

## Test local
1. Installer Node.js 18+.
2. Dans ce dossier : `npm install`
3. Définir les variables d'environnement :
   - `ADMIN_USER`
   - `ADMIN_PASSWORD` (ou `ADMIN_PASSWORD_HASH`)
   - `SESSION_SECRET`
   - `NODE_ENV=production`
4. `npm start`
5. Boutique : `http://localhost:3000`
6. Admin : `http://localhost:3000/admin.html`

## Avant production
- Utiliser PostgreSQL/MySQL plutôt que le fichier JSON.
- Mettre HTTPS.
- Changer impérativement les secrets.
- Ajouter sauvegardes et journalisation.
- Brancher un vrai fournisseur de paiement marchand (Wave / Orange Money) avec ses identifiants/API officiels.
- Configurer les frais et zones de livraison.
- Ajouter stockage d'images (S3/Cloudinary/etc.).
- Configurer domaine et DNS.
- Ajouter protection anti-abus/rate limiting et validation complète des entrées.

## Déploiement Render
Le fichier `render.yaml` est inclus. Render peut créer le Web Service avec :
- Build : `npm install`
- Start : `npm start`

Variables obligatoires à renseigner dans Render :
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Render fournit ensuite une URL publique `https://...onrender.com`. Tu peux ensuite ajouter ton propre domaine.

### Attention aux données
La V6 utilise encore `server/data.json` pour la démonstration. Le stockage du système de fichiers d'un service Render est éphémère par défaut ; pour une vraie boutique, il faut migrer les produits/commandes vers PostgreSQL ou un autre datastore persistant avant la production.
