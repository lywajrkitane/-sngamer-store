# Audit architectural — SNGAMER STORE

Date de l'audit : 2026-10-31
Branche inspectée : `work/clean-architecture-2026-10-28`
Production : non modifiée.

## Résumé

Le projet fonctionne comme une application Node.js / Express avec une interface web statique. L'audit initial confirme une accumulation de correctifs et de couches de présentation qui augmente le coût de maintenance.

## Mesures observées

- Répertoire `public/` : 105 entrées au total, dont de nombreux fichiers JS, CSS et HTML.
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
