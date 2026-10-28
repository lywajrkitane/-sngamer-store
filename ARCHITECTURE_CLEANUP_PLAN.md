# SNGAMER STORE — Plan de nettoyage architectural

## Référence protégée
- Branche stable : `stable/2026-10-28`
- La branche stable ne doit pas être modifiée sans demande explicite.
- Les changements d'architecture se font uniquement sur `work/clean-architecture-2026-10-28`.

## Objectif
Réduire les couches concurrentes et établir une seule source d'autorité par fonctionnalité, sans casser la boutique ou le dashboard.

## Ordre de migration
1. Catalogue / API produits
2. Panier et compteur
3. Prix et cartes produit
4. Header : recherche / panier / profil
5. Héros et navigation
6. Séparation mobile / desktop
7. Dashboard
8. Nettoyage des anciens correctifs uniquement après validation

## Règles
- Ne supprimer aucun fichier avant d'avoir identifié ses dépendances.
- Ne pas modifier plusieurs fonctionnalités dans un même changement lorsque ce n'est pas nécessaire.
- Chaque migration doit être isolée et vérifiée avant la suivante.
- Aucun déploiement Render avant validation de la branche de travail.
- Conserver la possibilité de revenir à la branche stable à tout moment.

## Critère de sortie
Une fonctionnalité = une autorité clairement identifiée. Les anciens fichiers deviennent supprimables seulement lorsqu'aucune référence active ne les utilise et qu'une validation fonctionnelle a été effectuée.