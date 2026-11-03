# Audit architectural — SNGAMER STORE

Date de l'audit : 2026-10-31
Branche inspectée : `work/clean-architecture-2026-10-28`
Production : non modifiée.

## Résumé

Le projet fonctionne comme une application Node.js / Express avec une interface web statique. L'audit initial confirme une accumulation de correctifs et de couches de présentation qui augmente le coût de maintenance.

## Mesures observées

- Répertoire `public/` : 112 fichiers dans l'arbre Git inspecté le 2026-10-31, dont de nombreux fichiers JS, CSS et HTML.
- Répertoire `server/` : 40 fichiers.
- Démarrage Node : 27 préchargements `-r` exécutés avant `server/bootstrap.js`.
- Page principale `public/index.html` : 21 balises de scripts externes et 19 feuilles CSS externes.
- `public/app.js` et plusieurs scripts complémentaires participent aux comportements du storefront.
- Le header, le panier et le style du storefront ont plusieurs couches d'autorité (HTML initial, transformation côté serveur, scripts client et feuilles CSS).

## Risques identifiés

1. Ordre de chargement implicite : les préchargements Node modifient potentiellement des modules avant le démarrage de l'application.
2. Responsabilités croisées : des scripts dits "preload", "fix", "final", "polish" et "stability" ajoutent des comportements transversaux.
3. Risque de régression : retirer un correctif sans cartographier ses dépendances peut casser une autre fonctionnalité.
4. Lisibilité : le développeur doit comprendre la séquence des préchargements et les transformations HTML avant de suivre le flux métier.

## Décision d'architecture

Ne pas supprimer de fichiers dans cette première étape. Migrer progressivement vers :
- un point d'entrée serveur explicite ;
- des modules métier regroupés par domaine (catalogue, panier/commandes, clients, paiements, administration) ;
- des routes, services et dépôts de données séparés ;
- un storefront avec une seule source d'autorité pour chaque comportement ;
- des styles et composants structurés par page ou domaine.

## Ordre de migration proposé

1. Cartographier les préchargements et leurs effets réels.
2. Cartographier les routes et dépendances du serveur.
3. Cartographier les scripts chargés par la boutique et le dashboard.
4. Choisir une première migration à faible risque (panier ou catalogue) et écrire des tests de caractérisation.
5. Migrer une seule fonctionnalité à la fois, vérifier, puis retirer uniquement les anciens doublons prouvés inutiles.

## Garde-fous

- Travail sur `work/clean-architecture-2026-10-28` uniquement.
- Ne pas toucher à `main`, aux données réelles, aux clés ou aux variables d'environnement.
- Aucun déploiement avant tests et validation du comportement.
- Les fichiers historiques restent en place tant que leurs dépendances ne sont pas comprises.

## Mise à jour — première migration du compteur panier (2026-10-31)

### Constat avant migration
Le compteur était écrit par trois couches :
- `public/app.js` mettait à jour le compteur dans le flux normal du panier ;
- `public/mobile-header-authoritative.js` relisait `localStorage`, créait éventuellement un badge et le resynchronisait ;
- `server/storefront-authoritative-final.js` relisait aussi `localStorage` et lançait un polling toutes les 500 ms.

Le HTML contient déjà un badge statique `#count` dans le bouton panier. La création dynamique du badge par le script mobile était donc une responsabilité concurrente.

### Migration effectuée sur cette branche
- `public/app.js` devient l'unique propriétaire de la valeur du compteur ; il la met à jour à l'initialisation, lors des mises à jour du panier et lors d'un événement `storage` provenant d'un autre onglet.
- `public/mobile-header-authoritative.js` conserve uniquement les responsabilités de présentation et de profil mobile ; sa lecture du panier, la création du badge et son écouteur `storage` ont été retirés.
- `server/storefront-authoritative-final.js` conserve la mise en page du Hero et la couleur des prix ; sa synchronisation du compteur et son intervalle de 500 ms ont été retirés.

### Vérifications statiques
- Une seule fonction `syncCartBadge` subsiste, dans `public/app.js`.
- Aucun lecteur de `sg_cart` ni créateur de badge ne subsiste dans le script du header mobile.
- Aucun appel de synchronisation du compteur ni polling ne subsiste dans l'injecteur storefront.
- Les responsabilités de profil mobile et de mise en page du Hero sont conservées.

### Limites et prochaine étape
Aucun test navigateur ni test d'intégration automatisé n'a encore été exécuté. Aucun déploiement Render n'a été déclenché. La migration doit être validée sur la branche de travail avant de passer au domaine suivant.

## Mise à jour — audit du catalogue et des API produits (2026-10-31)

### Autorité de lecture du catalogue public
- `server/server.js` déclare `GET /api/products`.
- Cette route délègue la lecture à `fetchCatalog(db)`, importé depuis `server/catalog-service.js`.
- `server/catalog-service.js` est actuellement l'unique service de lecture du catalogue public ; il effectue une requête SQL avec jointure sur `campaigns` et renvoie les lignes.
- Le fichier `server/catalog-service.test.js` contient un test smoke avec une base simulée, mais son exécution n'a pas été effectuée pendant cet audit.

### Écriture et administration des produits
- La création (`POST /api/admin/products`), la modification (`PATCH /api/admin/products/:id`) et la suppression (`DELETE /api/admin/products/:id`) sont encore directement implémentées dans `server/server.js`.
- Les validations de catégorie, plateforme, état, garantie, caractéristiques, couleurs et promotions sont donc couplées au fichier serveur principal.
- Les médias produits disposent d'une route d'envoi dans `server/server.js` ; `server/product-media-delete-preload.js` injecte une route de suppression en modifiant le fichier source avant son chargement.
- Aucune route distincte de lecture admin des produits n'a été identifiée dans les sections inspectées ; le dashboard doit être vérifié côté client pour confirmer sa source de données.

### Récupération et couches de démarrage
- `server/cart-badge-mobile-preload.js` est mal nommé : il patche globalement `fs.readFileSync` pour ajouter `public/catalog-recovery-v1.js` au HTML de la boutique.
- `public/catalog-recovery-v1.js` peut rappeler `window.load()` jusqu'à 12 fois si les produits ou cartes ne sont pas présents. Cette couche relance le chargement côté navigateur, en plus du chargement normal réalisé par `public/app.js`.
- `server/catalog-api-retry-preload.js` patche le handler Express de `GET /api/products`, mais il n'est référencé ni dans les scripts `start` ni `dev` de `package.json` au commit inspecté. Il est donc considéré comme inactif dans le démarrage courant, sous réserve d'un chargement indirect non encore identifié.
- `server/catalog-admin-ui-preload.js` injecte les scripts d'interface d'administration du catalogue ; il ne détient pas la lecture ou l'écriture des données produits.
- `server/product-meta-create-preload.js` modifie à l'exécution plusieurs fichiers sources (serveur, formulaire admin et storefront) pour ajouter la valeur « Produit numérique ». Cette responsabilité devra être intégrée dans les sources canoniques avant toute suppression du preload.
- `server/bootstrap.js` contient `patchCampaignSource()`, qui tente de réécrire des requêtes SQL dans `server/server.js` au démarrage. La requête historique de lecture des produits qu'il cible ne correspond plus à la route actuelle basée sur `fetchCatalog(db)`; l'effet réel des autres substitutions doit être audité séparément.

### Décision de migration
Aucun fichier du catalogue n'est supprimé ou désactivé à ce stade. La lecture publique est déjà partiellement centralisée, mais les écritures, validations et injections de compatibilité restent couplées. La prochaine migration devra extraire les opérations CRUD et validations produits dans un domaine dédié, après caractérisation des appels du dashboard et des routes médias.

### Limites de vérification
- Vérification statique des fichiers et routes sur la branche de travail uniquement.
- Aucun test Node, test de base de données, test navigateur ou test d'intégration n'a été exécuté.
- Aucun déploiement Render n'a été déclenché.
