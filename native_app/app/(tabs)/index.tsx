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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, Award, Search, Zap, Activity, Layers, ChevronRight, BarChart2, LogOut } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';

const screenWidth = Dimensions.get('window').width;

// ── Design Tokens ──────────────────────────────────────────────
const C = {
  bg:       '#0A0E1A',
  surface:  '#111827',
  card:     '#1A2235',
  border:   '#1F2D45',
  accent1:  '#6C63FF', // indigo-violet
  accent2:  '#00D4FF', // cyan
  accent3:  '#FF6B9D', // pink
  accent4:  '#FFD166', // amber
  green:    '#06D6A0',
  textPrimary:   '#F0F4FF',
  textSecondary: '#8B9CB8',
  textMuted:     '#4A5568',
};

export default function PerformanceScreen() {
  const { user, logout } = useAuth();
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
      setError(err.response?.data?.detail || 'Failed to fetch trend data.');
    } finally {
      setLoading(false);
    }
  };

  const chartBase = {
    backgroundGradientFrom: C.card,
    backgroundGradientTo: C.surface,
    decimalPlaces: 0,
    propsForLabels: { fontSize: 9, fill: C.textSecondary },
    propsForBackgroundLines: { stroke: C.border, strokeWidth: 1 },
  };
  const lineConfig = { ...chartBase, color: (o = 1) => `rgba(108,99,255,${o})`, strokeWidth: 2 };
  const barConfig  = { ...chartBase, color: (o = 1) => `rgba(0,212,255,${o})` };
  const maConfig   = { ...chartBase, color: (o = 1) => `rgba(255,107,157,${o})`, strokeWidth: 2 };
  const momConfig  = { ...chartBase, color: (o = 1) => `rgba(6,214,160,${o})`, strokeWidth: 2 };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <BarChart2 size={14} color={C.accent1} />
          <Text style={styles.heroBadgeText}>POWERED BY GOOGLE TRENDS</Text>
        </View>
        <Text style={styles.heroTitle}>📈 Performance{'\n'}Analysis</Text>
        <Text style={styles.heroSubtitle}>Visualize keyword momentum, growth & volatility</Text>
        <View style={styles.userRow}>
          <Text style={styles.userEmail} numberOfLines={1}>👤 {user?.email}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={14} color='#FF6B9D' />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBox}>
        <View style={styles.searchInner}>
          <Search size={18} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter topic or hashtag..."
            placeholderTextColor={C.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={fetchTrends}
            selectionColor={C.accent1}
          />
        </View>
        <TouchableOpacity style={[styles.searchBtn, loading && styles.searchBtnActive]} onPress={fetchTrends} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.searchBtnText}>Analyze</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Zap size={16} color="#FF6B9D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data && (
        <View style={styles.resultsWrap}>

          {/* ── Keyword Label ── */}
          <Text style={styles.resultLabel}>Results for</Text>
          <Text style={styles.resultKeyword}>"{data.keyword}"</Text>

          {/* ── Metric Cards ── */}
          <View style={styles.metricsRow}>
            <MetricCard label="Trend Score"  value={`${data.metrics.trend_score}%`}  accent={C.accent1} icon="🎯" />
            <MetricCard label="Stability"    value={`${data.metrics.stability}%`}     accent={C.green}   icon="🛡️" />
            <MetricCard label="Growth Rate"  value={`${data.metrics.growth_rate}%`}   accent={C.accent3} icon="🚀" />
          </View>

          {/* ── Peak Banner ── */}
          <View style={styles.peakBanner}>
            <Award size={18} color={C.accent4} />
            <Text style={styles.peakText}>Peak: <Text style={styles.peakHighlight}>{data.metrics.peak.value}%</Text> on {data.metrics.peak.date}</Text>
          </View>

          {/* ── Charts ── */}
          <ChartCard title="Trend Over Time" subtitle="Weekly interest — last 12 months" accentColor={C.accent1}>
            <LineChart
              data={{
                labels: data.history.filter((_: any, i: number) => i % 10 === 0).map((h: any) => h.date.split('-')[1]),
                datasets: [{ data: data.history.map((h: any) => h.value) }],
              }}
              width={screenWidth - 64}
              height={180}
              chartConfig={lineConfig}
              bezier
              style={styles.chartStyle}
              yAxisLabel="" yAxisSuffix=""
            />
          </ChartCard>

          <ChartCard title="Monthly Average" subtitle="Aggregated interest by calendar month" accentColor={C.accent2}>
            <BarChart
              data={{
                labels: data.monthly.map((m: any) => m.month.split(' ')[0]),
                datasets: [{ data: data.monthly.map((m: any) => m.value) }],
              }}
              width={screenWidth - 64}
              height={180}
              chartConfig={barConfig}
              style={styles.chartStyle}
              yAxisLabel="" yAxisSuffix=""
            />
          </ChartCard>

          <ChartCard title="Intensity Distribution" subtitle="Frequency bands of interest levels" accentColor={C.accent3}>
            <PieChart
              data={data.distribution.map((d: any, i: number) => ({
                name: d.range.substring(0, 8),
                population: d.count,
                color: [C.accent1, C.accent2, C.accent3, C.green, C.accent4][i % 5],
                legendFontColor: C.textSecondary,
                legendFontSize: 9,
              }))}
              width={screenWidth - 64}
              height={180}
              chartConfig={lineConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </ChartCard>

          <ChartCard title="7-Week Moving Average" subtitle="Smoothed trend trajectory" accentColor={C.accent3}>
            <LineChart
              data={{
                labels: data.moving_avg.filter((_: any, i: number) => i % 10 === 0).map((h: any) => h.date.split('-')[1]),
                datasets: [{ data: data.moving_avg.map((h: any) => h.value) }],
              }}
              width={screenWidth - 64}
              height={180}
              chartConfig={maConfig}
              bezier
              style={styles.chartStyle}
              yAxisLabel="" yAxisSuffix=""
            />
          </ChartCard>

          <ChartCard title="Trend Momentum" subtitle="Week-over-week interest delta" accentColor={C.green}>
            <LineChart
              data={{
                labels: data.momentum.filter((_: any, i: number) => i % 10 === 0).map((h: any) => h.date.split('-')[1]),
                datasets: [{ data: data.momentum.map((h: any) => h.value) }],
              }}
              width={screenWidth - 64}
              height={180}
              chartConfig={momConfig}
              bezier
              style={styles.chartStyle}
              yAxisLabel="" yAxisSuffix=""
            />
          </ChartCard>

        </View>
      )}

      {!data && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Start Exploring</Text>
          <Text style={styles.emptyDesc}>Type any keyword above to unlock trend insights, charts, and momentum signals.</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MetricCard({ label, value, accent, icon }: any) {
  return (
    <View style={[styles.metricCard, { borderTopColor: accent }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ChartCard({ title, subtitle, accentColor, children }: any) {
  return (
    <View style={[styles.chartCard, { borderLeftColor: accentColor }]}>
      <View style={styles.chartCardHeader}>
        <View style={[styles.chartDot, { backgroundColor: accentColor }]} />
        <View>
          <Text style={styles.chartCardTitle}>{title}</Text>
          <Text style={styles.chartCardSub}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: C.bg },
  content:  { paddingBottom: 40 },

  // Hero
  hero: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 48 : 60, paddingBottom: 24, backgroundColor: C.surface },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent1, letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, lineHeight: 42, marginBottom: 8 },
  heroSubtitle: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  // Search
  searchBox: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInner: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, height: 48, color: C.textPrimary, fontSize: 14 },
  searchBtn: { paddingHorizontal: 20, height: 48, backgroundColor: C.accent1, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  searchBtnActive: { backgroundColor: '#5553c9' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, padding: 14, backgroundColor: '#1f0a12', borderRadius: 12, borderWidth: 1, borderColor: '#4a1020' },
  errorText: { color: C.accent3, fontSize: 13, flex: 1 },

  // Results
  resultsWrap: { paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  resultLabel: { fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  resultKeyword: { fontSize: 28, fontWeight: '800', color: C.textPrimary, marginTop: 2, marginBottom: 4 },

  // Metrics
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, borderTopWidth: 3, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  metricIcon: { fontSize: 20, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 10, color: C.textSecondary, marginTop: 2, textAlign: 'center', fontWeight: '600' },

  // Peak banner
  peakBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a160a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#3d3000' },
  peakText: { color: C.textSecondary, fontSize: 13, flex: 1 },
  peakHighlight: { color: C.accent4, fontWeight: '700' },

  // Chart card
  chartCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  chartCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  chartDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  chartCardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  chartCardSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  chartStyle: { borderRadius: 12, paddingRight: 40 },

  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

  // User row
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  userEmail: { fontSize: 12, color: C.textSecondary, fontWeight: '600', flex: 1, marginRight: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#2a0a12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#4a1020' },
  logoutText: { color: '#FF6B9D', fontSize: 12, fontWeight: '700' },
});
