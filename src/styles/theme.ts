
/**
 * Theme - Styles globaux de l'application
 * 
 * Ce fichier centralise tous les styles réutilisables.
 * Il sera enrichi avec les tokens de design (couleurs, espacements, typographie)
 * lors de l'intégration de NativeWind.
 */

import { StyleSheet } from 'react-native';

/**
 * Palettes de couleurs par thème
 * Approche Apple-like : couleurs adaptées à chaque mode
 */
const lightPalette = {
  primary: '#391d48',
  secondary: '#4a255d',
  background: '#ece2f1',
  text: '#360e4b',
  textSecondary: '#666666',
  border: '#e0e0e0',
  cardBackground: '#ffffff',
  inputBackground: '#f9f9f9',
} as const;

const darkPalette = {
  primary: '#d4a5e8',
  secondary: '#b896d6',
  background: '#1a1a1a',
  text: '#f5f5f5',
  textSecondary: '#b0b0b0',
  border: '#333333',
  cardBackground: '#2a2a2a',
  inputBackground: '#1f1f1f',
} as const;

/** Fonction pour obtenir les couleurs selon le thème */
export const getColors = (isDark: boolean) => isDark ? darkPalette : lightPalette;

/** Couleurs par défaut (mode clair) - pour compatibilité rétroactive */
export const colors = lightPalette;

/**
 * Espacements standardisés
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm:  6,
  md:  10,
  lg:  16,
  full: 9999,
} as const;

export const font = {
  size: {
    xs:   11,
    sm:   13,
    md:   16,
    lg:   20,
    xl:   26,
  },
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    bold:    '600' as const,
  },
}


/**
 * Styles globaux réutilisables dynamiques
 */
export const getGlobalStyles = (isDark: boolean) => {
  const c = getColors(isDark);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.primary,
      marginBottom: 28,
      textAlign: "center",
    },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      fontSize: 16,
      alignSelf: "stretch",
      backgroundColor: c.inputBackground,
      color: c.text,
    },

    btn: {
      backgroundColor: "#534AB7",
      borderRadius: 10,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },

    btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },

    link: { textAlign: "center", marginTop: 16, color: c.primary },

    divider: {
      textAlign: "center",
      color: c.textSecondary,
      marginVertical: 16,
      fontSize: 13,
    },

    error: {
      color: "#E24B4A",
      fontSize: 13,
      marginBottom: 8,
      textAlign: "center",
    },
  });
};

/** Styles par défaut (mode clair) - pour compatibilité rétroactive */
export const globalStyles = getGlobalStyles(false);
