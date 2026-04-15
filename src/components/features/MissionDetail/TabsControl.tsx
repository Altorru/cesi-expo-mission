import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

type TabKey = 'details' | 'comments';

interface TabsControlProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function TabsControl({ activeTab, onTabChange }: TabsControlProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'details' && styles.tabActive,
        ]}
        onPress={() => onTabChange('details')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'details' && styles.tabTextActive,
          ]}
        >
          Détails
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'comments' && styles.tabActive,
        ]}
        onPress={() => onTabChange('comments')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'comments' && styles.tabTextActive,
          ]}
        >
          Commentaires
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      paddingHorizontal: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: themeColors.primary,
    },
    tabText: {
      fontSize: font.size.md,
      fontWeight: font.weight.medium,
      color: themeColors.text + '66',
    },
    tabTextActive: {
      color: themeColors.primary,
      fontWeight: font.weight.bold,
    },
  });
}
