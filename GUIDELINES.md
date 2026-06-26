# Charte de Développement & Versionnement (Guidelines) — VitaCare

Ce document définit les normes professionnelles de développement, de versionnement, et de collaboration applicables au projet **VitaCare**. L'objectif est de garantir la qualité du code, la cohérence de l'historique Git, et la fluidité des cycles de livraison.

---

## 1. 🌿 Gestion des Branches & Workflow Git

Nous suivons un workflow inspiré du **Trunk-Based Development**, adapté pour la revue de code systématique.

### 1.1 Branches Principales

- **`main`** : La branche de production. Le code y est toujours stable et déployable. Aucun commit direct n'est autorisé sur `main`.

- **`dev`** : La branche de développement. Le code y est toujours stable et déployable.

### 1.2 Branches de Fonctionnalité (Feature Branches)

Toute modification doit être faite dans une branche dédiée créée à partir de `dev` et nommée selon les conventions suivantes :

| Préfixe     | Description                                         | Exemple                        |
| :---------- | :-------------------------------------------------- | :----------------------------- |
| `feat/`     | Nouvelle fonctionnalité                             | `feat/mobile-login-screen`     |
| `fix/`      | Résolution de bug                                   | `fix/shared-types-api-url`     |
| `docs/`     | Modification de la documentation                    | `docs/update-guidelines`       |
| `refactor/` | Restructuration du code sans changement fonctionnel | `refactor/api-auth-middleware` |
| `perf/`     | Amélioration des performances                       | `perf/optimize-image-loading`  |
| `chore/`    | Tâches de maintenance, dépendances, config          | `chore/update-pnpm-lock`       |

### 1.3 Cycle de Vie d'une Pull Request (PR)

1.  **Création** : Ouvrez une PR de votre branche vers `dev`.
2.  **Validation CI** : Les tests automatisés, la vérification des types TypeScript (`pnpm type-check`), et le linter (`pnpm lint`) doivent tous passer (feu vert de la CI).
3.  **Code Review** : Au moins **un développeur** doit approuver la PR.
4.  **Fusion (Merge)** : Utilisez de préférence le mode **Squash and Merge** pour garder un historique `dev` propre et linéaire.

---

## 2. ✍️ Convention des Commits (Conventional Commits)

Nous utilisons la spécification **Conventional Commits** pour structurer l'historique et permettre la génération automatique de changelogs.

### 2.1 Format standard

```
<type>(<scope>): <description courte en minuscules>

[Corps de texte optionnel pour expliquer le "pourquoi" et non le "comment"]

[Pied de page optionnel pour mentionner les tickets résolus, ex: Closes #123]
```

### 2.2 Types autorisés

- `feat` : Ajout d'une nouvelle fonctionnalité.
- `fix` : Correction d'un bug.
- `docs` : Documentation uniquement.
- `style` : Changements esthétiques qui n'affectent pas la logique (espaces, formatage, points-virgules, etc.).
- `refactor` : Modification de code qui ne corrige pas un bug et n'ajoute pas de fonctionnalité.
- `perf` : Amélioration des performances.
- `test` : Ajout ou correction de tests.
- `build` : Modifications affectant le système de build ou les dépendances externes (ex: pnpm, webpack, turbo).
- `ci` : Fichiers de configuration ou scripts de CI/CD (GitHub Actions, etc.).
- `chore` : Autres tâches ne modifiant pas les fichiers source ou de test.

### 2.3 Scopes du Monorepo

Pour VitaCare, le scope correspond généralement à l'application ou au package concerné :

- `mobile` : `apps/mobile`
- `web` : `apps/web`
- `api` : `apps/api`
- `shared` : `packages/shared-types`
- `utils` : `packages/utils`
- `ui` : `packages/ui`
- `config` : `packages/config`
- `root` : Fichiers à la racine du monorepo

**Exemples :**

- `feat(mobile): intégration de l'écran d'accueil Expo Router`
- `fix(shared): correction du type d'interface utilisateur`
- `chore(root): mise à jour de turbo et pnpm-lock`

---

## 3. 🏷️ Versionnement (Semantic Versioning - SemVer)

Le projet respecte strictement les règles du **Semantic Versioning 2.0.0**. Les numéros de version suivent le schéma **`MAJOR.MINOR.PATCH`** :

- **`MAJOR` (Majeure)** : Changement majeur ou rupture de compatibilité ascendante (breaking change).
- **`MINOR` (Mineure)** : Ajout de fonctionnalités rétrocompatibles.
- **`PATCH` (Correctif)** : Corrections de bugs rétrocompatibles.

### 3.1 Déclaration d'un Breaking Change

Dans un commit, un changement majeur doit être signalé par un point d'exclamation après le type/scope ou en ajoutant `BREAKING CHANGE:` dans le pied de page :

```
feat(api)!: suppression du endpoint obsolète /v1/auth
```

### 3.2 Processus de Release

1.  Les versions sont gérées de manière centralisée ou par package selon l'évolution du monorepo.
2.  Chaque version majeure ou mineure fait l'objet d'une branche de version `release/vX.Y.Z`.
3.  Un tag Git (ex: `v1.2.0`) est créé lors de la fusion sur `main`.
4.  Les changelogs sont générés automatiquement à partir des commits conventionnels.

---

## 4. 📦 Gestion du Monorepo avec pnpm & Turborepo

### 4.1 Utilisation de pnpm

Puisqu'il s'agit d'un monorepo avec des workspaces pnpm, évitez d'utiliser `npm` ou `yarn`.

- **Installer une dépendance dans un package spécifique** :
  ```bash
  pnpm --filter <nom-du-package-ou-app> add <dependance>
  # Exemple pour ajouter lodash dans apps/mobile :
  pnpm --filter mobile add lodash
  ```
- **Installer une dépendance commune en tant que devDependency à la racine** :
  ```bash
  pnpm add -Dw <dependance>
  ```

### 4.2 Lancement des Tâches avec Turbo

Turborepo met en cache les tâches pour optimiser le temps d'exécution.

- **Lancer toutes les vérifications avant de commit** :
  ```bash
  pnpm lint
  pnpm type-check
  pnpm build
  ```

---

## 5. 🛠️ Normes de Code & Bonnes Pratiques

### 5.1 TypeScript & Typage Strict

- Le typage implicite `any` est proscrit. Utilisez `unknown` ou définissez des interfaces précises si le type est dynamique.
- Partagez systématiquement les interfaces API et les modèles de données dans `packages/shared-types` pour éviter la duplication entre le backend (`apps/api`) et les clients (`apps/mobile`, `apps/web`).

### 5.2 Environnement & Sécurité (Secrets)

- **Aucun secret** (clés d'API privées, mots de passe, clés Firebase privées) ne doit être poussé sur Git.
- Utilisez des fichiers `.env` locaux. Un fichier de modèle `.env.example` doit être fourni dans chaque projet pour lister les variables requises.
- Dans l'application mobile Expo, les variables d'environnement publiques destinées au bundle client doivent obligatoirement commencer par le préfixe `EXPO_PUBLIC_` (ex: `EXPO_PUBLIC_API_URL`).

---

## 6. 🤝 Revue de Code (Code Review Check-list)

Avant d'approuver une Pull Request, les relecteurs doivent s'assurer que :

1.  Le code respecte le principe **DRY (Don't Repeat Yourself)** et l'architecture établie.
2.  Il n'y a pas de console logs résiduels (`console.log`) inutiles en production.
3.  La gestion d'erreurs est robuste (les appels d'API réseau sont enveloppés dans des `try/catch` avec gestion visuelle de l'erreur pour l'utilisateur).
4.  L'UI/UX est réceptive, fluide, et conforme aux maquettes ou aux principes de design.
