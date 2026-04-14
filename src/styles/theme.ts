
/**
 * Theme - Styles globaux de l'application
 * 
 * Ce fichier centralise tous les styles réutilisables.
 * Il sera enrichi avec les tokens de design (couleurs, espacements, typographie)
 * lors de l'intégration de NativeWind.
 */

import { StyleSheet } from 'react-native';

/**
 * Couleurs de l'application
 * À terme, ces couleurs seront définies dans tailwind.config.js
 */
export const colors = {
  primary: '#391d48',
  secondary: '#4a255d',
  background: '#ece2f1',
  text: '#360e4b',
} as const;

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
}
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
 * Styles globaux réutilisables
 */
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
    marginBottom: 28,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    alignSelf: "stretch",
    backgroundColor: '#fff',
  },

  btn: {
    backgroundColor: "#534AB7",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },

  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  link: { textAlign: "center", marginTop: 16, color: "#534AB7" },

  divider: {
    textAlign: "center",
    color: "#999",
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
