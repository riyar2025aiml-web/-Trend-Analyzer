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
import { BarChart } from 'react-native-chart-kit';
import { Globe, Search, Navigation, MapPin, Zap } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '@/constants/api';

const screenWidth = Dimensions.get('window').width;

const C = {
  bg:       '#0A0E1A',
  surface:  '#111827',
  card:     '#1A2235',
  border:   '#1F2D45',
  accent1:  '#8338EC', // purple
  accent2:  '#3A86FF', // blue
  accent3:  '#FF6B9D', // pink
  green:    '#06D6A0',
  amber:    '#FFD166',
  textPrimary:   '#F0F4FF',
  textSecondary: '#8B9CB8',
  textMuted:     '#4A5568',
};

const RANK_COLORS = [C.amber, '#C0C0C0', '#CD7F32', C.accent2, C.accent1];

export default function RegionalScreen() {
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
      setError(err.response?.data?.detail || 'Failed to fetch regional data.');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: C.card,
    backgroundGradientTo: C.surface,
    color: (opacity = 1) => `rgba(131,56,236,${opacity})`,
    decimalPlaces: 0,
    propsForLabels: { fontSize: 8, fill: C.textSecondary },
    propsForBackgroundLines: { stroke: C.border },
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Globe size={14} color={C.accent1} />
          <Text style={styles.heroBadgeText}>GEOGRAPHIC INTELLIGENCE</Text>
        </View>
        <Text style={styles.heroTitle}>🗺️ Geographic{'\n'}Insights</Text>
        <Text style={styles.heroSubtitle}>Discover where your topic dominates the world</Text>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <View style={styles.searchInner}>
          <Search size={18} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Keyword to map globally..."
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
            : <Text style={styles.searchBtnText}>Map It</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Zap size={16} color={C.accent3} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data && data.regions.length > 0 && (
        <View style={styles.resultsWrap}>

          <Text style={styles.resultLabel}>Showing results for</Text>
          <Text style={styles.resultKeyword}>"{data.keyword}"</Text>

          {/* ── Bar Chart ── */}
          <View style={[styles.chartCard, { borderLeftColor: C.accent1 }]}>
            <View style={styles.chartHeader}>
              <View style={[styles.dot, { backgroundColor: C.accent1 }]} />
              <View>
                <Text style={styles.chartTitle}>Regional Interest Chart</Text>
                <Text style={styles.chartSub}>Top 8 countries ranked by search volume</Text>
              </View>
            </View>
            <BarChart
              data={{
                labels: data.regions.slice(0, 8).map((r: any) => r.region.substring(0, 6)),
                datasets: [{ data: data.regions.slice(0, 8).map((r: any) => r.value) }],
              }}
              width={screenWidth - 64}
              height={240}
              chartConfig={chartConfig}
              style={styles.chartStyle}
              verticalLabelRotation={45}
              yAxisLabel="" yAxisSuffix=""
            />
          </View>

          {/* ── Leaderboard ── */}
          <View style={styles.leaderboardCard}>
            <Text style={styles.leaderboardTitle}>🌍 Regional Leaderboard</Text>
            <Text style={styles.leaderboardSub}>Top 15 countries by interest score</Text>

            {data.regions.slice(0, 15).map((r: any, i: number) => {
              const barWidth = `${r.value}%`;
              const rankColor = RANK_COLORS[i] ?? C.accent2;
              return (
                <View key={i} style={styles.rankRow}>
                  <View style={[styles.rankBadge, { backgroundColor: i < 3 ? rankColor : C.border }]}>
                    <Text style={[styles.rankNum, { color: i < 3 ? '#000' : C.textSecondary }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <View style={styles.rankLabelRow}>
                      <MapPin size={11} color={rankColor} />
                      <Text style={styles.rankName}>{r.region}</Text>
                      <Text style={[styles.rankScore, { color: rankColor }]}>{r.value}%</Text>
                    </View>
                    <View style={styles.rankBarTrack}>
                      <View style={[styles.rankBarFill, { width: barWidth as any, backgroundColor: rankColor }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

        </View>
      )}

      {!data && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌐</Text>
          <Text style={styles.emptyTitle}>Map the World</Text>
          <Text style={styles.emptyDesc}>Search to see exactly which countries are driving your trend's popularity.</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  errorText: { color: C.accent3, fontSize: 13, flex: 1 },

  resultsWrap: { paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  resultLabel: { fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  resultKeyword: { fontSize: 28, fontWeight: '800', color: C.textPrimary, marginTop: 2, marginBottom: 4 },

  chartCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  chartSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  chartStyle: { borderRadius: 12, paddingRight: 40 },

  leaderboardCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  leaderboardTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  leaderboardSub: { fontSize: 12, color: C.textMuted, marginTop: -8 },

  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 12, fontWeight: '800' },
  rankInfo: { flex: 1, gap: 4 },
  rankLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textPrimary },
  rankScore: { fontSize: 13, fontWeight: '800' },
  rankBarTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  rankBarFill: { height: 4, borderRadius: 2 },

  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
