# 📚 Documentation Pédagogique - Projet Expo

> Ce fichier accompagne le développement du projet et explique chaque choix technique de manière didactique, structuré pour être intégré dans un support de cours Notion.

---

## 📋 Table des matières

1. [Leçon 1 : Analyse de l'architecture initiale et plan de migration](#leçon-1--analyse-de-larchitecture-initiale-et-plan-de-migration)

---

## Leçon 1 : Analyse de l'architecture initiale et plan de migration

### 🎯 Objectif pédagogique
Comprendre l'importance d'une architecture de projet bien structurée et planifier la migration vers une structure professionnelle avec Expo Router.

---

### 📊 État actuel du projet

#### Arborescence analysée

```
/Expo
├── .clinerules.txt      # Instructions de l'agent
├── App.js               # Point d'entrée (composant racine)
├── app.json             # Configuration Expo
├── docker-compose.yml   # Configuration Docker
├── Dockerfile           # Image Docker
├── index.js             # Enregistrement de l'app
├── package.json         # Dépendances npm
├── theme.js             # Styles globaux
└── assets/              # Images et icônes
    ├── adaptive-icon.png
    ├── favicon.png
    ├── icon.png
    └── splash-icon.png
```

#### Constats

| Critère | État actuel | État cible |
|---------|-------------|------------|
| Dossier `src/` | ❌ Absent | ✅ Obligatoire |
| Séparation components/hooks/services | ❌ Non | ✅ Oui |
| Expo Router | ❌ Non installé | ✅ À installer |
| TypeScript | ❌ JavaScript | ✅ TypeScript Strict |
| NativeWind | ❌ Non installé | ✅ À installer |

---

### 🤔 Pourquoi cette structure est-elle importante ?

#### 1. **Séparation des responsabilités (SoC)**

> *"Un fichier = une responsabilité"*

La structure `src/` avec sous-dossiers permet de :
- **Localiser rapidement** le code (où est mon hook ? → `src/hooks/`)
- **Éviter les conflits** lors du travail en équipe
- **Faciliter les tests** (chaque module est isolé)

#### 2. **Expo Router : le routing moderne**

Expo Router utilise le **file-based routing** (comme Next.js) :

```
app/
├── _layout.tsx      # Layout racine
├── index.tsx        # Route "/"
├── about.tsx        # Route "/about"
└── (tabs)/          # Groupe de routes avec tabs
    ├── _layout.tsx
    ├── home.tsx     # Route "/home"
    └── profile.tsx  # Route "/profile"
```

**Avantages :**
- Navigation déclarative (pas de configuration manuelle)
- Deep linking automatique
- Typage des routes avec TypeScript

#### 3. **TypeScript Strict : la sécurité du typage**

```typescript
// ❌ JavaScript - Erreur silencieuse
function greet(user) {
  return user.name.toUpperCase(); // Crash si user est undefined
}

// ✅ TypeScript Strict - Erreur à la compilation
function greet(user: User): string {
  return user.name.toUpperCase(); // TypeScript vérifie que user existe
}
```

---

### 📋 Plan d'action proposé

#### Phase 1 : Préparation de la structure (Leçon 2)
- [ ] Créer le dossier `src/` avec les sous-dossiers
- [ ] Migrer `theme.js` vers `src/styles/theme.ts`

#### Phase 2 : Installation d'Expo Router (Leçon 3)
- [ ] Installer `expo-router` et ses dépendances
- [ ] Configurer `app.json` pour Expo Router
- [ ] Créer le dossier `app/` avec `_layout.tsx` et `index.tsx`

#### Phase 3 : Migration vers TypeScript (Leçon 4)
- [ ] Installer TypeScript et les types
- [ ] Créer `tsconfig.json`
- [ ] Convertir les fichiers `.js` en `.ts`/`.tsx`

#### Phase 4 : Installation de NativeWind (Leçon 5)
- [ ] Installer NativeWind v4
- [ ] Configurer Tailwind CSS
- [ ] Migrer les styles vers les classes Tailwind

---

### 🏗️ Structure cible

```
/Expo
├── app/                          # Routes Expo Router
│   ├── _layout.tsx               # Layout racine
│   ├── index.tsx                 # Page d'accueil "/"
│   └── (tabs)/                   # Navigation par onglets
│       ├── _layout.tsx
│       ├── home.tsx
│       └── profile.tsx
├── src/
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                   # Composants UI de base
│   │   └── features/             # Composants métier
│   ├── hooks/                    # Hooks personnalisés
│   ├── lib/                      # Utilitaires et helpers
│   ├── services/                 # Appels API, Supabase
│   ├── stores/                   # État global (Zustand)
│   ├── styles/                   # Thème et styles globaux
│   │   └── theme.ts
│   └── types/                    # Types TypeScript
│       └── index.ts
├── assets/                       # Images et ressources
├── app.json                      # Configuration Expo
├── tailwind.config.js            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
├── package.json
├── docker-compose.yml
├── Dockerfile
└── DOC_PEDAGOGIQUE.md            # Ce fichier
```

---

### ✅ Validation acquise

L'apprenant a confirmé sa compréhension des points suivants :

1. ✅ **Structure `src/`** : Localisation rapide du code, évitement des conflits, facilitation des tests
2. ✅ **Expo Router** : Navigation déclarative, deep linking automatique, typage des routes avec TypeScript
3. ✅ **TypeScript Strict** : Sécurité du typage pour éviter les erreurs silencieuses

---

> **Prochaine étape :** Leçon 2 - Création de la structure `src/` et migration des fichiers existants

---

## Leçon 2 : Création de la structure `src/` et migration des fichiers

### 🎯 Objectif pédagogique
Mettre en place une architecture de dossiers professionnelle et comprendre le rôle de chaque répertoire.

---

### 🤔 Pourquoi organiser le code dans `src/` ?

#### Le problème de la structure plate

```
# ❌ Structure plate (avant)
/Expo
├── App.js
├── theme.js
├── UserProfile.js
├── useAuth.js
├── api.js
└── ... (50 fichiers mélangés)
```

**Problèmes :**
- Difficile de trouver un fichier spécifique
- Pas de séparation claire des responsabilités
- Conflits fréquents en équipe
- Tests difficiles à organiser

#### La solution : structure modulaire

```
# ✅ Structure organisée (après)
/Expo
├── src/
│   ├── components/    → Composants React
│   ├── hooks/         → Hooks personnalisés
│   ├── services/      → Logique métier, API
│   ├── stores/        → État global
│   ├── styles/        → Thème, styles
│   └── types/         → Types TypeScript
```

---

### 📁 Rôle de chaque dossier

| Dossier | Contenu | Exemple |
|---------|---------|---------|
| `components/ui/` | Composants UI réutilisables (boutons, inputs) | `Button.tsx`, `Input.tsx` |
| `components/features/` | Composants métier spécifiques | `UserCard.tsx`, `ProductList.tsx` |
| `hooks/` | Hooks React personnalisés | `useAuth.ts`, `useForm.ts` |
| `lib/` | Utilitaires et helpers | `formatDate.ts`, `validators.ts` |
| `services/` | Appels API, Supabase | `authService.ts`, `userService.ts` |
| `stores/` | État global (Zustand) | `useUserStore.ts` |
| `styles/` | Thème et styles globaux | `theme.ts`, `colors.ts` |
| `types/` | Types TypeScript partagés | `user.types.ts`, `api.types.ts` |

---

### 🔧 Ce qui a été créé

```
src/
├── components/
│   ├── ui/
│   │   └── .gitkeep
│   └── features/
│       └── .gitkeep
├── hooks/
│   └── .gitkeep
├── lib/
│   └── .gitkeep
├── services/
│   └── .gitkeep
├── stores/
│   └── .gitkeep
├── styles/
│   └── theme.ts        ← Migré depuis theme.js
└── types/
    └── index.ts        ← Types de base créés
```

---

### 📝 Fichier `theme.ts` migré

Le fichier `theme.js` a été migré vers `src/styles/theme.ts` avec les améliorations suivantes :

```typescript
// Avant (theme.js)
export const globalStyles = StyleSheet.create({...});

// Après (src/styles/theme.ts)
export const colors = {
  primary: '#FF0000',
  background: '#FFFFFF',
  text: '#000000',
} as const;  // ← "as const" pour le typage strict

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
} as const;

export const globalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,  // ← Utilise les tokens
    // ...
  },
});
```

**Améliorations :**
- ✅ Tokens de couleurs centralisés
- ✅ Espacements standardisés
- ✅ Typage strict avec `as const`
- ✅ Documentation JSDoc

---

### 📝 Fichier `types/index.ts` créé

```typescript
// Types utilitaires réutilisables
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

### ⚠️ Note importante

L'ancien fichier `theme.js` à la racine existe toujours. Il sera supprimé lors de la **Leçon 3** après avoir mis à jour les imports dans `App.js`.

---

### ✅ Validation de la Leçon 2

Avant de passer à la Leçon 3, confirme que tu as compris :

1. Pourquoi séparer le code en dossiers distincts
2. Le rôle de chaque dossier (`components/`, `hooks/`, `services/`, etc.)
3. L'intérêt des tokens de design (`colors`, `spacing`)

---

> **Prochaine étape :** Leçon 3 - Installation d'Expo Router et configuration du routing

---

## Leçon 3 : Installation d'Expo Router et configuration du routing

### 🎯 Objectif pédagogique
Comprendre le file-based routing d'Expo Router et configurer la navigation de l'application.

---

### 🤔 Pourquoi Expo Router ?

#### Comparaison avec React Navigation classique

| Critère | React Navigation | Expo Router |
|---------|------------------|-------------|
| Configuration | Manuelle (NavigationContainer, Stack.Navigator) | Automatique (file-based) |
| Deep linking | Configuration manuelle | Automatique |
| Typage des routes | Manuel | Automatique avec `typedRoutes` |
| Courbe d'apprentissage | Moyenne | Faible (similaire à Next.js) |

#### Le concept de file-based routing

```
# La structure des fichiers = les routes de l'app

app/
├── _layout.tsx      → Layout racine (enveloppe toutes les pages)
├── index.tsx        → Route "/"
├── about.tsx        → Route "/about"
├── settings.tsx     → Route "/settings"
└── user/
    ├── _layout.tsx  → Layout pour /user/*
    ├── index.tsx    → Route "/user"
    └── [id].tsx     → Route dynamique "/user/123"
```

**Avantages :**
- 🚀 Pas de configuration de routes
- 🔗 Deep linking automatique
- 📱 URLs partageable (même sur mobile)
- 🔒 Typage des routes avec TypeScript

---

### 🔧 Ce qui a été installé

```bash
# Commande exécutée via Docker
docker-compose exec app npm install \
  expo-router \
  expo-linking \
  expo-constants \
  expo-status-bar \
  react-native-safe-area-context \
  react-native-screens
```

| Package | Rôle |
|---------|------|
| `expo-router` | Le routeur file-based |
| `expo-linking` | Gestion des deep links |
| `expo-constants` | Accès aux constantes Expo |
| `react-native-safe-area-context` | Gestion des encoches iOS/Android |
| `react-native-screens` | Optimisation des écrans natifs |

---

### 📝 Configuration de `app.json`

```json
{
  "expo": {
    "scheme": "temp-project",        // ← Schéma pour les deep links
    "plugins": ["expo-router"],      // ← Active Expo Router
    "experiments": {
      "typedRoutes": true            // ← Active le typage des routes
    },
    "web": {
      "bundler": "metro"             // ← Metro pour le web
    }
  }
}
```

**Explications :**
- `scheme` : Permet d'ouvrir l'app via `temp-project://` (deep linking)
- `plugins` : Active le plugin Expo Router
- `typedRoutes` : Génère automatiquement les types pour les routes

---

### 📝 Configuration de `package.json`

```json
{
  "main": "expo-router/entry"  // ← Point d'entrée Expo Router
}
```

**Avant :** `"main": "index.js"` (fichier manuel)
**Après :** `"main": "expo-router/entry"` (Expo Router gère l'entrée)

---

### 📝 Fichier `app/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
```

**Rôle du `_layout.tsx` :**
- Enveloppe toutes les pages enfants
- Fournit les providers globaux (SafeAreaProvider)
- Configure la navigation (Stack, Tabs, Drawer)

---

### 📝 Fichier `app/index.tsx`

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles, colors } from '../src/styles/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={globalStyles.titleText}>🎉 Bravo !</Text>
        <Text style={styles.subtitle}>Expo Router est configuré</Text>
      </View>
    </SafeAreaView>
  );
}
```

**Points clés :**
- Le fichier `index.tsx` = route `/`
- Import du thème depuis `src/styles/theme`
- Utilisation de `SafeAreaView` pour les encoches

---

### 📝 Fichier `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"]
    }
  }
}
```

**Avantages des alias :**
```typescript
// ❌ Avant (imports relatifs)
import { colors } from '../../../src/styles/theme';

// ✅ Après (alias)
import { colors } from '@/styles/theme';
```

---

### 🗑️ Fichiers supprimés

Les anciens fichiers ont été supprimés car ils ne sont plus nécessaires :

- `App.js` → Remplacé par `app/_layout.tsx` et `app/index.tsx`
- `index.js` → Remplacé par `expo-router/entry`
- `theme.js` → Migré vers `src/styles/theme.ts`

---

### 🏗️ Structure actuelle

```
/Expo
├── app/                          # Routes Expo Router
│   ├── _layout.tsx               # Layout racine
│   └── index.tsx                 # Page d'accueil "/"
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   │   └── theme.ts
│   └── types/
│       └── index.ts
├── assets/
├── app.json                      # Configuration Expo + Router
├── package.json                  # main: expo-router/entry
├── tsconfig.json                 # TypeScript + alias
└── DOC_PEDAGOGIQUE.md
```

---

### ✅ Validation de la Leçon 3

Avant de passer à la Leçon 4, confirme que tu as compris :

1. La différence entre React Navigation et Expo Router
2. Le rôle du fichier `_layout.tsx`
3. Comment fonctionne le file-based routing (nom du fichier = route)
4. L'intérêt des alias TypeScript (`@/`)

---

> **Prochaine étape :** Leçon 4 - Création d'une navigation par onglets (Tabs)

---

## Leçon 4 : Navigation par onglets (Tabs)

### 🎯 Objectif pédagogique
Créer une navigation par onglets (Tab Bar) avec Expo Router et comprendre le concept de groupes de routes.

---

### 🤔 Pourquoi les Tabs ?

#### Le pattern de navigation mobile le plus courant

Les onglets (tabs) sont le pattern de navigation le plus utilisé sur mobile :
- **Instagram** : Accueil, Recherche, Reels, Shop, Profil
- **Twitter/X** : Accueil, Recherche, Espaces, Notifications, Messages
- **Spotify** : Accueil, Recherche, Bibliothèque

**Avantages :**
- 👆 Accès rapide aux sections principales
- 🧭 L'utilisateur sait toujours où il est
- 📱 Ergonomique (pouce peut atteindre tous les onglets)

---

### 📁 Les groupes de routes avec parenthèses

```
app/
├── _layout.tsx           # Layout racine (Stack)
└── (tabs)/               # ← Groupe de routes
    ├── _layout.tsx       # Layout des tabs (Tab Bar)
    ├── index.tsx         # Route "/" (Accueil)
    ├── explore.tsx       # Route "/explore"
    └── profile.tsx       # Route "/profile"
```

#### Pourquoi les parenthèses `(tabs)` ?

Les parenthèses créent un **groupe de routes** qui :
- ✅ Organise les fichiers visuellement
- ✅ Partage un layout commun (la Tab Bar)
- ✅ **N'affecte PAS l'URL** (pas de `/tabs/` dans l'URL)

```
# Structure des fichiers → URLs générées
app/(tabs)/index.tsx      → "/"
app/(tabs)/explore.tsx    → "/explore"
app/(tabs)/profile.tsx    → "/profile"
```

---

### 📝 Fichier `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../../src/styles/theme';

// Composant d'icône personnalisé
interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" label="Explorer" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Points clés :**
- `Tabs` remplace `Stack` pour la navigation par onglets
- `Tabs.Screen` définit chaque onglet
- `tabBarIcon` permet de personnaliser l'icône
- `focused` indique si l'onglet est actif

---

### 📝 Structure des écrans

Chaque écran suit le même pattern :

```typescript
// app/(tabs)/index.tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles, colors, spacing } from '../../src/styles/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={globalStyles.titleText}>Accueil</Text>
        {/* Contenu de la page */}
      </View>
    </SafeAreaView>
  );
}
```

**Bonnes pratiques :**
- ✅ `SafeAreaView` pour les encoches
- ✅ Import du thème depuis `src/styles/`
- ✅ Utilisation des tokens (`colors`, `spacing`)

---

### 🔄 Mise à jour du layout racine

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Le groupe (tabs) est la route par défaut */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

**Hiérarchie de navigation :**
```
RootLayout (Stack)
└── (tabs) (Tabs)
    ├── index (Accueil)
    ├── explore (Explorer)
    └── profile (Profil)
```

---

### 🏗️ Structure actuelle

```
/Expo
├── app/
│   ├── _layout.tsx               # Layout racine (Stack)
│   └── (tabs)/                   # Groupe de routes
│       ├── _layout.tsx           # Layout des tabs
│       ├── index.tsx             # Accueil "/"
│       ├── explore.tsx           # Explorer "/explore"
│       └── profile.tsx           # Profil "/profile"
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   │   └── theme.ts
│   └── types/
│       └── index.ts
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── DOC_PEDAGOGIQUE.md
```

---

### 🎨 Personnalisation de la Tab Bar

Options disponibles dans `screenOptions` :

| Option | Description |
|--------|-------------|
| `tabBarStyle` | Style du conteneur de la Tab Bar |
| `tabBarShowLabel` | Afficher/masquer les labels |
| `tabBarActiveTintColor` | Couleur de l'onglet actif |
| `tabBarInactiveTintColor` | Couleur des onglets inactifs |
| `tabBarIcon` | Composant d'icône personnalisé |

---

### ✅ Validation de la Leçon 4

Avant de passer à la Leçon 5, confirme que tu as compris :

1. Le rôle des parenthèses dans `(tabs)` (groupe sans impact sur l'URL)
2. La différence entre `Stack` et `Tabs`
3. Comment personnaliser les icônes de la Tab Bar
4. La hiérarchie de navigation (RootLayout → Tabs → Screens)

---

> **Prochaine étape :** Leçon 5 - Installation de NativeWind (Tailwind CSS pour React Native)

---

## 🔧 Note technique : Résolution du problème "getDevServer is not a function"

### Contexte du problème

Lors de la migration vers Expo Router, l'application affichait l'erreur :
```
getDevServer is not a function
```

### Cause

**Incompatibilité de versions** entre :
- La version d'Expo Go sur le téléphone (SDK 54)
- Les packages installés dans le projet (versions mixtes)

### Solution

Aligner **toutes** les versions pour le SDK 54 :

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-constants": "~18.0.0",
    "expo-linking": "~8.0.0",
    "expo-router": "~5.0.0",
    "expo-status-bar": "~3.0.0",
    "react": "19.0.0",
    "react-native": "0.79.2",
    "react-native-safe-area-context": "~5.4.0",
    "react-native-screens": "~4.10.0"
  }
}
```

### Leçon apprise

> **Toujours vérifier la compatibilité des versions !**
> 
> Expo publie une matrice de compatibilité pour chaque SDK :
> https://docs.expo.dev/versions/latest/

| SDK | React | React Native | Expo Router |
|-----|-------|--------------|-------------|
| 54  | 19.0.0 | 0.79.2 | ~5.0.0 |
| 52  | 18.3.1 | 0.76.5 | ~4.0.0 |
| 51  | 18.2.0 | 0.74.5 | ~3.5.0 |
