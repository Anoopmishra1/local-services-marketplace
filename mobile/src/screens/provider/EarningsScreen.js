import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

export default function EarningsScreen() {
    const [data, setData] = useState({ records: [], total_earned: 0, pending_payout: 0 });
    const [loading, setLoad] = useState(true);

    useEffect(() => {
        api.get('/providers/earnings/summary').then(({ data: d }) => setData(d)).finally(() => setLoad(false));
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <View style={styles.container}>
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { borderTopColor: '#10B981' }]}>
                    <Text style={[styles.summaryVal, { color: '#10B981' }]}>₹{data.total_earned.toFixed(0)}</Text>
                    <Text style={styles.summaryLabel}>Total Earned</Text>
                </View>
                <View style={[styles.summaryCard, { borderTopColor: '#F59E0B' }]}>
                    <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>₹{data.pending_payout.toFixed(0)}</Text>
                    <Text style={styles.summaryLabel}>Pending Payout</Text>
                </View>
            </View>

            <Text style={styles.histLabel}>Earnings History</Text>
            <FlatList
                data={data.records}
                keyExtractor={(i, idx) => i.id || String(idx)}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowAmount}>₹{parseFloat(item.provider_payout).toFixed(0)}</Text>
                            <Text style={styles.rowDate}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
                        </View>
                        <View style={[styles.settleBadge, item.is_settled ? styles.settled : styles.unsettled]}>
                            <Text style={[styles.settleText, { color: item.is_settled ? '#10B981' : '#F59E0B' }]}>
                                {item.is_settled ? 'Settled' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No earnings yet</Text>}
                contentContainerStyle={{ paddingBottom: 30 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
    summaryVal: { fontWeight: '800', fontSize: 22 },
    summaryLabel: { color: '#6B7280', fontSize: 12, marginTop: 4 },
    histLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
    rowAmount: { fontWeight: '700', fontSize: 16, color: '#1F2937' },
    rowDate: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
    settleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    settled: { backgroundColor: '#D1FAE5' },
    unsettled: { backgroundColor: '#FEF3C7' },
    settleText: { fontWeight: '700', fontSize: 12 },
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
