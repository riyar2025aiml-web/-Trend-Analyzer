import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  View,
  ScrollView,
  Text,
  StatusBar,
  Platform,
} from 'react-native';
import { TrendingUp, Search, Flame, Zap, Hash, Sparkles } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '@/constants/api';

const screenWidth = Dimensions.get('window').width;

const C = {
  bg:       '#0A0E1A',
  surface:  '#111827',
  card:     '#1A2235',
  border:   '#1F2D45',
  accent1:  '#FF6B9D', // pink/rose
  accent2:  '#6C63FF', // purple
  accent3:  '#00D4FF', // cyan
  green:    '#06D6A0',
  amber:    '#FFD166',
  textPrimary:   '#F0F4FF',
  textSecondary: '#8B9CB8',
  textMuted:     '#4A5568',
};

export default function RelatedTopicsScreen() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/trends`, { params: { keyword: keyword.trim() } });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch related queries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Hash size={14} color={C.accent1} />
          <Text style={styles.heroBadgeText}>TOPIC CLUSTER ENGINE</Text>
        </View>
        <Text style={styles.heroTitle}>🔗 Related{'\n'}Topics</Text>
        <Text style={styles.heroSubtitle}>Discover breakout queries & trending keyword clusters</Text>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <View style={styles.searchInner}>
          <Search size={18} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find clusters for keyword..."
            placeholderTextColor={C.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={fetchTrends}
            selectionColor={C.accent1}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={fetchTrends} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.searchBtnText}>Cluster</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Zap size={16} color={C.accent1} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data && (
        <View style={styles.resultsWrap}>
          <Text style={styles.resultLabel}>Clusters for</Text>
          <Text style={styles.resultKeyword}>"{data.keyword}"</Text>

          {/* ── Top Queries ── */}
          <View style={[styles.sectionCard, { borderLeftColor: C.accent2 }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.accent2 + '22' }]}>
                <TrendingUp size={16} color={C.accent2} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Top Related Queries</Text>
                <Text style={styles.sectionDesc}>Most frequent co-searches</Text>
              </View>
            </View>

            {data.related.top.length > 0 ? (
              data.related.top.slice(0, 10).map((item: any, idx: number) => (
                <QueryRow
                  key={idx}
                  rank={idx + 1}
                  query={item.query}
                  value={item.value}
                  accentColor={C.accent2}
                  maxVal={data.related.top[0]?.value || 100}
                />
              ))
            ) : (
              <Text style={styles.emptyMsg}>No top queries found for this keyword.</Text>
            )}
          </View>

          {/* ── Rising Queries ── */}
          <View style={[styles.sectionCard, { borderLeftColor: C.accent1 }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.accent1 + '22' }]}>
                <Flame size={16} color={C.accent1} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Rising Breakout Queries</Text>
                <Text style={styles.sectionDesc}>Explosive keyword momentum 🔥</Text>
              </View>
            </View>

            {data.related.rising.length > 0 ? (
              data.related.rising.slice(0, 10).map((item: any, idx: number) => (
                <QueryRow
                  key={idx}
                  rank={idx + 1}
                  query={item.query}
                  value={item.value}
                  accentColor={C.accent1}
                  maxVal={data.related.rising[0]?.value || 100}
                  isRising
                />
              ))
            ) : (
              <Text style={styles.emptyMsg}>No rising queries found — try a broader keyword.</Text>
            )}
          </View>

        </View>
      )}

      {!data && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>Explore Clusters</Text>
          <Text style={styles.emptyDesc}>Uncover hidden keyword opportunities and rising queries that could define the next big trend.</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function QueryRow({ rank, query, value, accentColor, maxVal, isRising }: any) {
  const barWidth = maxVal > 0 ? Math.max(4, (value / maxVal) * 100) : 4;
  return (
    <View style={styles.queryRow}>
      <Text style={[styles.queryRank, { color: accentColor }]}>#{rank}</Text>
      <View style={styles.queryInfo}>
        <View style={styles.queryLabelRow}>
          <Text style={styles.queryText}>{query}</Text>
          <View style={[styles.queryChip, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
            {isRising && <Flame size={9} color={accentColor} />}
            <Text style={[styles.queryChipText, { color: accentColor }]}>{value}%</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${barWidth}%` as any, backgroundColor: accentColor }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },

  hero: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 48 : 60, paddingBottom: 24, backgroundColor: C.surface },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent1, letterSpacing: 2 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, lineHeight: 42, marginBottom: 8 },
  heroSubtitle: { fontSize: 13, color: C.textSecondary },

  searchBox: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInner: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, height: 48, color: C.textPrimary, fontSize: 14 },
  searchBtn: { paddingHorizontal: 20, height: 48, backgroundColor: C.accent1, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, padding: 14, backgroundColor: '#1f0a12', borderRadius: 12, borderWidth: 1, borderColor: '#4a1020' },
  errorText: { color: C.accent1, fontSize: 13, flex: 1 },

  resultsWrap: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  resultLabel: { fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  resultKeyword: { fontSize: 28, fontWeight: '800', color: C.textPrimary, marginTop: 2, marginBottom: 4 },

  sectionCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border, gap: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  sectionDesc: { fontSize: 11, color: C.textMuted },

  queryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  queryRank: { fontSize: 12, fontWeight: '800', width: 28, marginTop: 2 },
  queryInfo: { flex: 1, gap: 6 },
  queryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queryText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPrimary },
  queryChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  queryChipText: { fontSize: 11, fontWeight: '700' },
  barTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },

  emptyMsg: { color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 20 },

  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
