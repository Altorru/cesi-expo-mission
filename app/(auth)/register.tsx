import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (!pseudo.trim()) {
      setError('Le pseudo est requis.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, pseudo.trim());
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={[styles.title, { color: themeColors.primary }]}>Inscription</Text>

        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Pseudo"
          placeholderTextColor={themeColors.textSecondary}
          value={pseudo}
          onChangeText={setPseudo}
          autoCapitalize="none"
          textContentType="username"
        />

        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={themeColors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Mot de passe"
          placeholderTextColor={themeColors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={themeColors.textSecondary}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
        />

        {error && <Text style={[styles.error, { color: '#f38ba8' }]}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primary }, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Créer un compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.link, { color: themeColors.secondary }]}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.size.md,
  },
  button: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  link: {
    textAlign: 'center',
    fontSize: font.size.sm,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: font.size.sm,
    textAlign: 'center',
  },
});