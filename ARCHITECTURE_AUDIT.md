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
