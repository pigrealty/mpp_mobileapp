import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, SectionList, TextInput,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSettings } from '../../context/SettingsContext';
import { apiFetch } from '../../services/api';
import { Config } from '../../constants/Config';

type Property = {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    price: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    livingSize: string | null;
    propType: string | null;
    isActiveProject: boolean;
    featuredImageId: string | null;
    project: { id: number; name: string } | null;
};

type Section = {
    title: string;
    projectId: number | null;
    isPinned: boolean;
    data: Property[];
};

export default function PropertiesScreen() {
    const router = useRouter();
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [projects, setProjects] = useState<{id: number | null, name: string}[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null | 'all'>('all');
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [pinnedIds, setPinnedIds] = useState<number[]>([]);
    const { settings } = useSettings();

    async function fetchProperties(query = '') {
        try {
            const endpoint = query
                ? `/properties?search=${encodeURIComponent(query)}&limit=500`
                : '/properties?limit=500';
            const response = await apiFetch(endpoint);
            
            const props: Property[] = response.data;
            const pinned: number[] = response.pinnedProjectIds || [];
            
            setAllProperties(props);
            setPinnedIds(pinned);

            // Extract unique projects for the filter listbox
            const uniqueProjects = new Map<number | null, string>();
            props.forEach(p => {
                if (p.project) uniqueProjects.set(p.project.id, p.project.name);
                else uniqueProjects.set(null, 'Unassigned');
            });
            
            const projList = Array.from(uniqueProjects.entries()).map(([id, name]) => ({ id, name }));
            setProjects(projList);

            processSections(props, pinned, selectedProjectId);
        } catch (err) {
            console.error('Failed to fetch properties:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const processSections = (props: Property[], pinned: number[], filterId: number | null | 'all') => {
        const filtered = filterId === 'all' 
            ? props 
            : props.filter(p => (p.project?.id ?? null) === filterId);

        const groups = new Map<string, Section>();
        filtered.forEach(prop => {
            const groupKey = prop.project?.name || '__unassigned__';
            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    title: prop.project?.name || 'Unassigned / Default Project',
                    projectId: prop.project?.id || null,
                    isPinned: prop.project?.id ? pinned.includes(prop.project.id) : false,
                    data: []
                });
            }
            groups.get(groupKey)!.data.push(prop);
        });

        const allGroups = Array.from(groups.values());
        const pinnedGroups = allGroups.filter(g => g.isPinned);
        const unpinnedGroups = allGroups.filter(g => !g.isPinned);
        setSections([...pinnedGroups, ...unpinnedGroups]);
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        processSections(allProperties, pinnedIds, selectedProjectId);
    }, [selectedProjectId, allProperties, pinnedIds]);

    // Debounced search
    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => fetchProperties(search), 400);
        setSearchTimeout(t);
        return () => clearTimeout(t);
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProperties(search);
    }, [search]);

    function renderProjectFilter() {
        return (
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity 
                        style={[styles.filterChip, { backgroundColor: settings?.cardColor || Config.COLORS.card }, selectedProjectId === 'all' && [styles.filterChipActive, { backgroundColor: settings?.primaryColor || Config.COLORS.brand, borderColor: settings?.primaryColor || Config.COLORS.brand }]]}
                        onPress={() => setSelectedProjectId('all')}
                    >
                        <Text style={[styles.filterChipText, selectedProjectId === 'all' && styles.filterChipTextActive]}>All Projects</Text>
                    </TouchableOpacity>
                    {projects.map(proj => (
                        <TouchableOpacity 
                            key={proj.id ?? 'null'} 
                            style={[styles.filterChip, { backgroundColor: settings?.cardColor || Config.COLORS.card }, selectedProjectId === proj.id && [styles.filterChipActive, { backgroundColor: settings?.primaryColor || Config.COLORS.brand, borderColor: settings?.primaryColor || Config.COLORS.brand }]]}
                            onPress={() => setSelectedProjectId(proj.id)}
                        >
                            <Text style={[styles.filterChipText, selectedProjectId === proj.id && styles.filterChipTextActive]}>{proj.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // (UI rendering components remain the same as previous version but with minor style tweaks for polish)
    function StatusBadge({ isActive }: { isActive: boolean }) {
        return (
            <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : [styles.badgeTextInactive, { color: settings?.textSecondaryColor || '#a1a1aa' }]]}>
                    {isActive ? 'Active' : 'Listed'}
                </Text>
            </View>
        );
    }

    function renderSectionHeader({ section }: { section: Section }) {
        return (
            <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderInner}>
                    {section.isPinned && <Text style={styles.pinIcon}>📌</Text>}
                    <Text style={[styles.sectionTitle, { color: settings?.primaryColor || Config.COLORS.brand }, section.isPinned && styles.sectionTitlePinned]}>
                        {section.title.toUpperCase()}
                    </Text>
                    <View style={styles.sectionLine} />
                    <Text style={[styles.sectionCount, { color: settings?.textSecondaryColor || '#52525b' }]}>{section.data.length} Units</Text>
                </View>
            </View>
        );
    }

    function renderPropertyCard({ item }: { item: Property }) {
        const imageUrl = item.featuredImageId ? `https://lh3.googleusercontent.com/d/${item.featuredImageId}` : null;
        return (
            <TouchableOpacity 
                style={[styles.card, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]} 
                onPress={() => router.push(`/property/${item.id}`)} 
                activeOpacity={0.8}
            >
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={300} />
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: settings?.backgroundColor || '#18181b' }]}><Text style={styles.imagePlaceholderText}>🏠</Text></View>
                    )}
                    <StatusBadge isActive={item.isActiveProject} />
                </View>
                <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: settings?.textColor || 'white' }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.cardAddress, { color: settings?.textSecondaryColor || Config.COLORS.textMuted }]} numberOfLines={1}>📍 {item.address}, {item.city}</Text>
                    <View style={styles.specsRow}>
                        {item.bedrooms && <View style={styles.spec}><Text style={[styles.specText, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>🛏 {item.bedrooms}</Text></View>}
                        {item.bathrooms && <View style={styles.spec}><Text style={[styles.specText, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>🚿 {item.bathrooms}</Text></View>}
                        {item.livingSize && <View style={styles.spec}><Text style={[styles.specText, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>📐 {item.livingSize}</Text></View>}
                    </View>
                    <Text style={[styles.price, { color: settings?.primaryColor || Config.COLORS.brand }]}>${item.price}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]}>
                <ActivityIndicator size="large" color={settings?.primaryColor || Config.COLORS.brand} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: settings?.textColor || 'white' }]}>Properties</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: settings?.cardColor || Config.COLORS.card }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, { color: settings?.textColor || 'white' }]}
                    placeholder="Search name or address..."
                    placeholderTextColor={settings?.textSecondaryColor || "#52525b"}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {renderProjectFilter()}

            <SectionList
                sections={sections}
                keyExtractor={item => item.id.toString()}
                renderItem={renderPropertyCard}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={settings?.primaryColor || Config.COLORS.brand} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1 },
    
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12, borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1, borderColor: Config.COLORS.border,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, color: 'white', fontSize: 15, paddingVertical: 12 },

    filterContainer: { marginBottom: 12 },
    filterScroll: { paddingHorizontal: 20, gap: 8 },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Config.COLORS.border 
    },
    filterChipActive: { },
    filterChipText: { color: Config.COLORS.textMuted, fontSize: 13, fontWeight: '600' },
    filterChipTextActive: { color: 'white' },

    list: { paddingHorizontal: 20, paddingBottom: 120 },
    sectionHeader: { marginTop: 24, marginBottom: 12 },
    sectionHeaderInner: { flexDirection: 'row', alignItems: 'center' },
    pinIcon: { fontSize: 12, marginRight: 6 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    sectionTitlePinned: { color: '#fbbf24' },
    sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 12 },
    sectionCount: { fontSize: 11, fontWeight: '700', color: '#52525b' },

    card: {
        borderRadius: 20, marginBottom: 16,
        overflow: 'hidden', borderWidth: 1, borderColor: Config.COLORS.border,
    },
    imageContainer: { position: 'relative' },
    image: { height: 210, width: '100%' },
    imagePlaceholder: { height: 210, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center' },
    imagePlaceholderText: { fontSize: 40 },
    badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
    badgeInactive: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    badgeText: { fontSize: 10, fontWeight: '800' },
    badgeTextActive: { color: '#10b981' },
    badgeTextInactive: { color: '#a1a1aa' },
    cardBody: { padding: 16 },
    cardName: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 4 },
    cardAddress: { fontSize: 13, color: Config.COLORS.textMuted, marginBottom: 12 },
    specsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    spec: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    specText: { color: '#a1a1aa', fontSize: 12, fontWeight: '600' },
    price: { fontSize: 22, fontWeight: '900' },
});
