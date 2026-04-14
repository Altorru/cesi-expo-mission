/**
 * BlurHeader — En-tête flottant avec fond blur (frosted glass iOS)
 *
 * Doit être positionné APRÈS le contenu scrollable dans le JSX,
 * car il est position:absolute. Le contenu doit avoir un paddingTop
 * égal à insets.top + HEADER_CONTENT_HEIGHT pour ne pas passer derrière.
 */
import { View, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, spacing } from "@/styles/theme";

const BG = "236, 226, 241";

/** Hauteur de la ligne de contenu du header (sous la status bar) */
export const HEADER_CONTENT_HEIGHT = 56;

interface BlurHeaderProps {
  title: string;
  /** Élément affiché à droite du titre (bouton, icône…) */
  right?: React.ReactNode;
}

export function BlurHeader({ title, right }: BlurHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: top }]} pointerEvents="box-none">
      {/* Fond : BlurView sur iOS, couleur solide sur Android */}
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(${BG}, 0.96)` },
          ]}
        />
      )}
      {/* Contenu */}
      <View style={styles.row} pointerEvents="box-none">
        <Text style={styles.title}>{title}</Text>
        {right != null && <View pointerEvents="auto">{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  row: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
});
