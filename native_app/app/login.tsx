import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, TrendingUp, Zap } from 'lucide-react-native';
import { useAuth } from '@/context/auth';

// ── Design Tokens ──────────────────────────────────────────────
const C = {
  bg:       '#0A0E1A',
  surface:  '#111827',
  card:     '#1A2235',
  border:   '#1F2D45',
  accent1:  '#6C63FF', // indigo-violet
  accent2:  '#00D4FF', // cyan
  accent3:  '#FF6B9D', // pink
  green:    '#06D6A0',
  textPrimary:   '#F0F4FF',
  textSecondary: '#8B9CB8',
  textMuted:     '#4A5568',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // Shake animation for error
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Login failed.');
      shake();
    }
  };

  const inputBorder = (field: 'email' | 'password') =>
    focusedField === field ? C.accent1 : C.border;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Brand Header ── */}
        <View style={styles.brand}>
          <View style={styles.logoRing}>
            <TrendingUp size={36} color={C.accent1} />
          </View>
          <Text style={styles.appName}>Twitter</Text>
          <Text style={styles.tagline}>AI-Powered Hashtag Intelligence</Text>
        </View>

        {/* ── Card ── */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

          <Text style={styles.cardTitle}>Welcome back 👋</Text>
          <Text style={styles.cardSub}>Sign in to access your trend dashboard</Text>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputRow, { borderColor: inputBorder('email') }]}>
              <Mail size={18} color={focusedField === 'email' ? C.accent1 : C.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                selectionColor={C.accent1}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputRow, { borderColor: inputBorder('password') }]}>
              <Lock size={18} color={focusedField === 'password' ? C.accent1 : C.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={handleLogin}
                selectionColor={C.accent1}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass
                  ? <EyeOff size={18} color={C.textMuted} />
                  : <Eye size={18} color={C.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Zap size={14} color={C.accent3} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnLoading]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signInText}>Sign In  →</Text>}
          </TouchableOpacity>

        </Animated.View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Don't have an account?{'  '}
          <Text style={styles.signUpLink}>Create one free →</Text>
        </Text>

        {/* ── Feature Pills ── */}
        <View style={styles.pills}>
          {['📊 Real-time Charts', '🌍 Regional Data', '🔗 Cluster Engine'].map((f) => (
            <View key={f} style={styles.pill}>
              <Text style={styles.pillText}>{f}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },

  // Brand
  brand: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.accent1 + '22',
    borderWidth: 2, borderColor: C.accent1 + '55',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: C.accent1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  appName: { fontSize: 32, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: C.textSecondary, marginTop: 4, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 13, color: C.textSecondary, marginBottom: 28 },

  // Fields
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textSecondary, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotLink: { fontSize: 12, color: C.accent1, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
  },
  input: { flex: 1, color: C.textPrimary, fontSize: 15, height: 52 },
  eyeBtn: { padding: 4 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1f0a12', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#4a1020',
  },
  errorText: { color: C.accent3, fontSize: 13, flex: 1 },

  // Sign In Button
  signInBtn: {
    height: 54,
    backgroundColor: C.accent1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: C.accent1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  signInBtnLoading: { backgroundColor: C.accent1 + 'aa' },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Footer
  footer: { textAlign: 'center', color: C.textMuted, fontSize: 13, marginTop: 28 },
  signUpLink: { color: C.accent2, fontWeight: '700' },

  // Feature Pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24 },
  pill: {
    backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  pillText: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
});
