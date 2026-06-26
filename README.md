# VitaCare Mobile

Application mobile React Native / Expo pour la plateforme VitaCare.

## 🚀 Stack Technique
- **Framework**: [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) (Persistent)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Validation**: [Zod](https://zod.dev/)
- **Styling**: [NativeWind (Tailwind CSS)](https://www.nativewind.dev/)
- **Icones**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) & [Iconify](https://iconify.design/)

## 📁 Architecture du Code
- `app/` : Structure de navigation Expo Router (Tabs, Auth, Main).
- `src/api/` : Client API (Fetch) et configuration QueryClient.
- `src/components/` : Composants UI réutilisables (Boutons, Inputs, Cards).
- `src/hooks/` : Hooks personnalisés (Authentification, Data fetching).
- `src/schemas/` : Schémas de validation Zod (Forms).
- `src/store/` : Stores Zustand pour la gestion d'état global.
- `src/themes/` : Configuration des couleurs et typographies.
- `src/types/` : Définitions TypeScript pour l'API et les modèles de données.

## 🔗 Intégration Backend
La configuration de l'API se trouve dans `src/types/api-endpoints.ts`.

### Configuration de l'environnement
Copiez le fichier `.env.example` vers `.env` et ajustez l'URL de l'API si nécessaire :
```bash
cp .env.example .env
```

### Utilisation de l'API
Pour effectuer des requêtes, utilisez le `apiClient` ou les hooks personnalisés :
```typescript
import { useAuth } from './src/hooks';

const { loginEmail, isLoggingInEmail } = useAuth();
// ...
await loginEmail({ email: '...', password: '...' });
```

## 🛠️ Développement
```bash
# Installer les dépendances (depuis la racine)
pnpm install

# Démarrer le serveur Expo
pnpm dev:mobile
```
