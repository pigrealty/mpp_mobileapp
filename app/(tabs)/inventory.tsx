import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { apiFetch } from '../../services/api';
import { Config } from '../../constants/Config';
import { useSettings } from '../../context/SettingsContext';

type SubCategory = {
    id: number;
    name: string;
    prefix: string;
    icon: string | null;
    total: number;
    available: number;
    inUse: number;
};

type Category = {
    id: number;
    name: string;
    prefix: string;
    icon: string | null;
    imageUrl: string | null;
    total: number;
    available: number;
    inUse: number;
    lost: number;
    retired: number;
    subCategories: SubCategory[];
};

type StockItem = {
    id: number;
    code: string;
    name: string;
    status: string;
    dateOut: string | null;
    category: { id: number; name: string; prefix: string; icon: string | null; imageUrl?: string | null };
    property: { id: number; name: string; address: string } | null;
};

export default function InventoryScreen() {
    const { settings } = useSettings();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);
    
    const [itemsByCat, setItemsByCat] = useState<Record<number, StockItem[]>>({});
    const [fetchingItems, setFetchingItems] = useState<Set<number>>(new Set());
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

    async function fetchSummary() {
        try {
            const data = await apiFetch('/inventory/summary');
            setCategories(data.data);
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function fetchItemsForCategory(catId: number, subCatIds: number[]) {
        if (fetchingItems.has(catId)) return;
        
        setFetchingItems(prev => new Set(prev).add(catId));
        try {
            // Fetch for parent
            const res = await apiFetch(`/inventory/items?categoryId=${catId}&status=InUse&limit=100`);
            let allItems = res.data || [];
            
            // Fetch for children too
            for (const subId of subCatIds) {
                const subRes = await apiFetch(`/inventory/items?categoryId=${subId}&status=InUse&limit=100`);
                if (subRes.data) allItems = [...allItems, ...subRes.data];
            }
            
            setItemsByCat(prev => ({ ...prev, [catId]: allItems }));
        } catch (err) {
            console.error('Failed to fetch category items:', err);
        } finally {
            setFetchingItems(prev => {
                const next = new Set(prev);
                next.delete(catId);
                return next;
            });
        }
    }

    useEffect(() => { fetchSummary(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSummary();
        // Clear cached items on refresh
        setItemsByCat({});
    }, []);

    const toggleExpand = (item: Category) => {
        const isNowExpanded = expanded !== item.id;
        setExpanded(isNowExpanded ? item.id : null);
        
        if (isNowExpanded && !itemsByCat[item.id]) {
            fetchItemsForCategory(item.id, item.subCategories.map(s => s.id));
        }
    };

    function StatBadge({ count, label, color }: { count: number; label: string; color: string }) {
        return (
            <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color }]}>{count}</Text>
                <Text style={[styles.statLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>{label}</Text>
            </View>
        );
    }

    function InUseItem({ item }: { item: StockItem }) {
        const rowBg = settings?.cardColor ? settings.cardColor + '80' : 'rgba(255,255,255,0.03)';
        return (
            <TouchableOpacity 
                style={[styles.inUseRow, { backgroundColor: rowBg }]} 
                activeOpacity={0.7}
                onPress={() => {
                    console.log('[DEBUG] Inventory item clicked. Category Image URL:', item.category.imageUrl);
                    setSelectedItem(item);
                }}
            >
                <View style={styles.inUseLeft}>
                    <View style={[styles.inUseDot, { backgroundColor: settings?.primaryColor || Config.COLORS.brand }]} />
                    <View>
                        <Text style={[styles.inUseCode, { color: settings?.textColor || 'white' }]}>{item.code}</Text>
                        <Text style={[styles.inUseName, { color: settings?.textSecondaryColor || '#71717a' }]} numberOfLines={1}>{item.name || 'Unnamed Item'}</Text>
                    </View>
                </View>
                <View style={styles.inUseRight}>
                    <Text style={[styles.inUsePropName, { color: settings?.textColor || 'white' }]} numberOfLines={1}>
                        {item.property?.name || 'Unknown Property'}
                    </Text>
                    <Text style={[styles.inUsePropAddr, { color: settings?.textSecondaryColor || '#52525b' }]} numberOfLines={1}>
                        {item.property?.address || 'No address'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    function CategoryCard({ item }: { item: Category }) {
        const isExpanded = expanded === item.id;
        const items = itemsByCat[item.id] || [];
        const isFetching = fetchingItems.has(item.id);

        // Glassmorphism effect: slightly transparent card color with a subtle border
        const cardBg = settings?.cardColor ? settings.cardColor : Config.COLORS.card;
        
        return (
            <View style={[
                styles.card, 
                { 
                    backgroundColor: cardBg + 'D9', // 85% opacity
                    borderColor: 'rgba(255,255,255,0.1)',
                }, 
                isExpanded && styles.cardExpanded
            ]}>
                <TouchableOpacity
                    onPress={() => toggleExpand(item)}
                    activeOpacity={0.8}
                    style={styles.cardHeader}
                >
                    <View style={styles.cardLeft}>
                        {item.icon ? (
                            <Text style={styles.catIcon}>{item.icon}</Text>
                        ) : (
                            <View style={styles.catIconFallback}>
                                <Text style={styles.catIconFallbackText}>{item.prefix[0]}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={[styles.catName, { color: settings?.textColor || 'white' }]}>{item.name}</Text>
                            <Text style={[styles.catPrefix, { color: settings?.textSecondaryColor || '#71717a' }]}>{item.prefix}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={[styles.totalCount, { color: settings?.textColor || 'white' }]}>{item.total}</Text>
                        <Text style={[styles.totalLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>total</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.statsRow}>
                    <StatBadge count={item.available} label="Available" color="#10b981" />
                    <StatBadge count={item.inUse} label="In Use" color={settings?.primaryColor || Config.COLORS.brand} />
                    <StatBadge count={item.lost} label="Lost" color="#f59e0b" />
                    <StatBadge count={item.retired} label="Retired" color="#52525b" />
                </View>

                {isExpanded && (
                    <View style={[styles.expandedContent, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                        {/* Items Listing */}
                        <View style={styles.itemsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: settings?.textSecondaryColor || '#71717a' }]}>IN USE ITEMS</Text>
                                {isFetching && <ActivityIndicator size="small" color={settings?.primaryColor || Config.COLORS.brand} />}
                            </View>
                            
                            {items.length > 0 ? (
                                items.map(si => <InUseItem key={si.id} item={si} />)
                            ) : !isFetching ? (
                                <Text style={[styles.noItemsText, { color: settings?.textSecondaryColor || '#52525b' }]}>No items currently in use in this category.</Text>
                            ) : null}
                        </View>

                        {/* Sub-categories */}
                        {item.subCategories.length > 0 && (
                            <View style={styles.subCatSection}>
                                <Text style={styles.sectionTitle}>SUB-CATEGORIES</Text>
                                {item.subCategories.map(sub => (
                                    <View key={sub.id} style={styles.subCatRow}>
                                        <View style={styles.subCatLeft}>
                                            <Text style={styles.subCatIcon}>{sub.icon ?? '📦'}</Text>
                                            <View>
                                                <Text style={[styles.subCatName, { color: settings?.textColor || 'white' }]}>{sub.name}</Text>
                                                <Text style={[styles.subCatPrefix, { color: settings?.textSecondaryColor || '#52525b' }]}>{sub.prefix}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.subCatStats}>
                                            <Text style={styles.subStat}>
                                                <Text style={{ color: '#10b981', fontWeight: '700' }}>{sub.available}</Text>
                                                <Text style={styles.subStatMuted}> av  </Text>
                                                <Text style={{ color: settings?.primaryColor || Config.COLORS.brand, fontWeight: '700' }}>{sub.inUse}</Text>
                                                <Text style={[styles.subStatMuted, { color: settings?.textSecondaryColor || '#52525b' }]}> use</Text>
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    }

    const totalItems = categories.reduce((s, c) => s + c.total, 0);
    const totalAvailable = categories.reduce((s, c) => s + c.available, 0);
    const totalInUse = categories.reduce((s, c) => s + c.inUse, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: settings?.textColor || 'white' }]}>Inventory</Text>
                <Text style={[styles.headerSubtitle, { color: settings?.textSecondaryColor || Config.COLORS.textMuted }]}>{categories.length} categories active</Text>
            </View>

            <View style={[styles.banner, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'CC', borderColor: 'rgba(255,255,255,0.08)' }]}>
                <View style={styles.bannerStat}>
                    <Text style={[styles.bannerNumber, { color: settings?.textColor || 'white' }]}>{totalItems}</Text>
                    <Text style={[styles.bannerLabel, { color: settings?.textSecondaryColor || Config.COLORS.textMuted }]}>Total</Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerStat}>
                    <Text style={[styles.bannerNumber, { color: '#10b981' }]}>{totalAvailable}</Text>
                    <Text style={styles.bannerLabel}>Available</Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerStat}>
                    <Text style={[styles.bannerNumber, { color: settings?.primaryColor || Config.COLORS.brand }]}>{totalInUse}</Text>
                    <Text style={[styles.bannerLabel, { color: settings?.textSecondaryColor || Config.COLORS.textMuted }]}>In Use</Text>
                </View>
            </View>

            <FlatList
                data={categories}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <CategoryCard item={item} />}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={settings?.primaryColor || Config.COLORS.brand}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <ActivityIndicator size="small" color="#52525b" />
                    </View>
                }
            />

            {/* ITEM DETAIL MODAL (REUSED LOGIC) */}
            <Modal
                visible={!!selectedItem}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={[styles.invModalBackground, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
                    <View style={[styles.invModalContent, { backgroundColor: settings?.cardColor || Config.COLORS.card }]}>
                        <TouchableOpacity 
                            style={styles.invCloseBtn}
                            onPress={() => setSelectedItem(null)}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        {selectedItem?.category.imageUrl && (
                            <Image 
                                source={{ uri: selectedItem.category.imageUrl }}
                                style={styles.invCatImage}
                                contentFit="cover"
                            />
                        )}

                        <View style={styles.invDetails}>
                            <View style={styles.invIconLabel}>
                                <Ionicons name={(selectedItem?.category.icon || 'cube-outline') as any} size={20} color="#fbbf24" />
                                <Text style={[styles.invCatName, { color: settings?.primaryColor || Config.COLORS.brand }]}>{selectedItem?.category.name}</Text>
                            </View>
                            
                            <Text style={[styles.invItemName, { color: settings?.textColor || 'white' }]}>{selectedItem?.name || 'Unnamed Item'}</Text>
                            <Text style={[styles.invItemCode, { color: settings?.textSecondaryColor || '#71717a' }]}>{selectedItem?.code}</Text>
                            
                            <View style={styles.invInfoRow}>
                                <Text style={[styles.invLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>Location:</Text>
                                <Text style={[styles.invValue, { color: settings?.textColor || 'white' }]}>{selectedItem?.property?.name || 'Unknown'}</Text>
                            </View>
                            <View style={styles.invInfoRow}>
                                <Text style={[styles.invLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>Date Deployed:</Text>
                                <Text style={[styles.invValue, { color: settings?.textColor || 'white' }]}>
                                    {selectedItem?.dateOut ? new Date(selectedItem.dateOut).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1 },
    headerSubtitle: { fontSize: 13, color: Config.COLORS.textMuted, marginTop: 2 },

    banner: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Config.COLORS.border,
        padding: 20,
        marginBottom: 20,
    },
    bannerStat: { flex: 1, alignItems: 'center' },
    bannerNumber: { fontSize: 28, fontWeight: '900', color: 'white' },
    bannerLabel: { fontSize: 11, color: Config.COLORS.textMuted, marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
    bannerDivider: { width: 1, backgroundColor: Config.COLORS.border },

    list: { paddingHorizontal: 20, paddingBottom: 120 },

    card: {
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Config.COLORS.border,
        overflow: 'hidden',
    },
    cardExpanded: { borderColor: 'rgba(255,255,255,0.1)' },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardRight: { alignItems: 'flex-end' },

    catIcon: { fontSize: 36 },
    catIconFallback: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center', alignItems: 'center',
    },
    catIconFallbackText: { fontSize: 22, fontWeight: '800', color: 'white' },
    catName: { fontSize: 18, fontWeight: '800', color: 'white' },
    catPrefix: { fontSize: 12, color: '#71717a', marginTop: 2, fontWeight: '600' },

    totalCount: { fontSize: 24, fontWeight: '900', color: 'white' },
    totalLabel: { fontSize: 10, color: '#71717a', fontWeight: '800', textTransform: 'uppercase' },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statBox: { alignItems: 'center' },
    statNumber: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },

    expandedContent: {
        borderTopWidth: 1,
        borderTopColor: Config.COLORS.border,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    itemsSection: { padding: 20 },
    subCatSection: { padding: 20, paddingTop: 0 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#71717a', letterSpacing: 1.2, marginBottom: 12 },
    
    inUseRow: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderRadius: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    inUseLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 0.5 },
    inUseDot: { width: 6, height: 6, borderRadius: 3 },
    inUseCode: { fontSize: 13, fontWeight: '800', color: 'white' },
    inUseName: { fontSize: 11, color: '#71717a', marginTop: 1 },
    inUseRight: { flex: 0.5, alignItems: 'flex-end' },
    inUsePropName: { fontSize: 13, fontWeight: '700', color: 'white' },
    inUsePropAddr: { fontSize: 10, color: '#52525b', marginTop: 1 },
    noItemsText: { fontSize: 12, color: '#52525b', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },

    subCatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    subCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    subCatIcon: { fontSize: 20 },
    subCatName: { fontSize: 14, fontWeight: '700', color: 'white' },
    subCatPrefix: { fontSize: 11, color: '#52525b', marginTop: 1 },
    subCatStats: {},
    subStat: { fontSize: 13 },
    subStatMuted: { color: '#52525b', fontSize: 11 },

    // Modal Styles
    invModalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    invModalContent: { width: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: Config.COLORS.border },
    invCloseBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    invCatImage: { width: '100%', height: 200, backgroundColor: '#18181b' },
    invDetails: { padding: 24 },
    invIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    invCatName: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    invItemName: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 4 },
    invItemCode: { fontSize: 16, color: '#71717a', fontWeight: '700', marginBottom: 24 },
    invInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Config.COLORS.border },
    invLabel: { fontSize: 14, color: '#71717a', fontWeight: '600' },
    invValue: { fontSize: 14, color: 'white', fontWeight: '800' },
});
