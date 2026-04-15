import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isHydrated, setIsHydrated] = useState(false);
  // Force re-render quand le système change
  const [systemThemeChange, setSystemThemeChange] = useState(0);

  // Charger la préférence de thème au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['auto', 'light', 'dark'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadThemePreference();
  }, []);

  // Écouter les changements du thème système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Trigger un re-render en changeant ce state
      setSystemThemeChange(prev => prev + 1);
    });

    return () => subscription.remove();
  }, []);

  // Déterminer si le thème est sombre (réagit aux changements système grâce au systemThemeChange)
  const isDark =
    mode === 'auto'
      ? systemColorScheme === 'dark'
      : mode === 'dark';

  // Changer le mode et le persister
  const setMode = async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  // Ne pas rendre tant que les données ne sont pas chargées
  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
