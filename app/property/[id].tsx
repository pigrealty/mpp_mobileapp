import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    ActivityIndicator, Dimensions, Linking, Modal, FlatList, Platform, Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '../../context/SettingsContext';
import { apiFetch } from '../../services/api';
import { Config } from '../../constants/Config';

const { width, height } = Dimensions.get('window');

type Media = {
    id: number;
    driveFileId: string;
    mediaType: 'photo' | 'video';
};

type MediaCollection = {
    id: number;
    name: string;
    media: Media[];
};

type Unit = MediaCollection & {
    category: string;
    bedrooms: string | null;
    bathrooms: string | null;
    livingSize: string | null;
};

type DeployedInventory = {
    id: number;
    code: string;
    name: string;
    dateOut: string | null;
    category: { name: string, icon: string, imageUrl: string | null };
};

type LinkItem = {
    id: number;
    description: string;
    url: string;
};

type PropertyDetail = {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    description: string;
    price: string;
    bedrooms: string;
    bathrooms: string;
    livingSize: string;
    lotSize: string;
    driveFolderId: string | null;
    listingUrl: string | null;
    units: Unit[];
    assets: MediaCollection[];
    links: LinkItem[];
    deployedInventory: DeployedInventory[];
};

export default function PropertyDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { settings } = useSettings(); 
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [activeCollection, setActiveCollection] = useState<MediaCollection | null>(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<DeployedInventory | null>(null);

    async function fetchDetail() {
        try {
            const data = await apiFetch(`/properties/${id}`);
            setProperty(data.data);
        } catch (err) {
            console.error('Failed to fetch detail:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchDetail(); }, [id]);

    const copyToClipboard = async (text: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Copied!', 'Link copied to clipboard.');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={settings?.primaryColor || Config.COLORS.brand} />
            </View>
        );
    }

    if (!property) {
        return (
            <View style={styles.center}>
                <Text style={{ color: 'white' }}>Property not found.</Text>
            </View>
        );
    }

    const MediaViewer = ({ media, onClose }: { media: Media | null, onClose: () => void }) => {
        const videoUrl = media?.mediaType === 'video' 
            ? `https://drive.google.com/file/d/${media.driveFileId}/preview` 
            : null;

        return (
            <Modal
                visible={!!media}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>
                    
                    {media?.mediaType === 'video' ? (
                        <View style={styles.fullImage}>
                            <WebView 
                                source={{ uri: videoUrl! }}
                                style={{ flex: 1, backgroundColor: 'black' }}
                                allowsFullscreenVideo
                                javaScriptEnabled
                                domStorageEnabled
                            />
                        </View>
                    ) : media ? (
                        <Image 
                            source={{ uri: `https://pro.nhiphan.com/api/heaven/thumbnail?fileId=${media.driveFileId}` }}
                            style={styles.fullImage}
                            contentFit="contain"
                        />
                    ) : null}
                </View>
            </Modal>
        );
    };

    const allMedia = property.units.flatMap(u => u.media);
    const featuredMedia = allMedia.length > 0 ? allMedia[0] : null;

    return (
        <View style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} bounces={false} showsVerticalScrollIndicator={false}>
                
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => featuredMedia && setSelectedMedia(featuredMedia)}
                    style={styles.heroContainer}
                >
                    {featuredMedia ? (
                        <Image 
                            source={{ uri: `https://pro.nhiphan.com/api/heaven/thumbnail?fileId=${featuredMedia.driveFileId}` }}
                            style={styles.heroImage}
                            contentFit="cover"
                            transition={500}
                        />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: settings?.cardColor || '#18181b' }]} />
                    )}
                    <View style={styles.heroOverlay} />
                    
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.heroInfo}>
                        <Text style={[styles.heroTitle, { color: settings?.textColor || 'white' }]}>{property.name}</Text>
                        <View style={styles.heroAddressRow}>
                            <Ionicons name="location-sharp" size={14} color={settings?.primaryColor || Config.COLORS.brand} />
                            <Text style={[styles.heroAddress, { color: settings?.textSecondaryColor || '#d1d1d6' }]}>
                                {property.address}, {property.city}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.price, { color: settings?.textColor || 'white' }]}>${property.price}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>ACTIVE</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        {[
                            { label: 'Beds', value: property.bedrooms, icon: 'bed', color: '#818cf8' },
                            { label: 'Baths', value: property.bathrooms, icon: 'water', color: '#34d399' },
                            { label: 'Living', value: property.livingSize, icon: 'expand', color: '#fbbf24' },
                            { label: 'Lot', value: property.lotSize, icon: 'map', color: '#f472b6' }
                        ].map((stat, i) => (
                            <View key={i} style={[styles.statCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}>
                                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                                <Text style={[styles.statValue, { color: settings?.textColor || 'white' }]}>{stat.value || '-'}</Text>
                                <Text style={[styles.statLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.actionRow}>
                        {property.driveFolderId && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#4285F420', borderColor: '#4285F440' }]}
                                onPress={() => Linking.openURL(`https://drive.google.com/drive/folders/${property.driveFolderId}`)}
                            >
                                <Ionicons name="logo-google" size={20} color="#4285F4" />
                                <Text style={[styles.actionBtnText, { color: '#4285F4' }]}>Open Google Drive</Text>
                            </TouchableOpacity>
                        )}
                        
                        {property.listingUrl && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#ef444420', borderColor: '#ef444440' }]}
                                onPress={() => Linking.openURL(property.listingUrl!)}
                            >
                                <Ionicons name="globe-outline" size={20} color="#ef4444" />
                                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Listing Page</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Resources & Links</Text>
                        {property.driveFolderId && (
                            <View style={[styles.resourceItem, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: '#4285F440' }]}>
                                <TouchableOpacity 
                                    style={styles.resourceMain}
                                    onPress={() => Linking.openURL(`https://drive.google.com/drive/folders/${property.driveFolderId}`)}
                                >
                                    <Ionicons name="folder-open-outline" size={20} color="#4285F4" />
                                    <Text style={[styles.resourceText, { color: '#4285F4' }]}>Google Drive Folder</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.copyBtn}
                                    onPress={() => copyToClipboard(`https://drive.google.com/drive/folders/${property.driveFolderId}`)}
                                >
                                    <Ionicons name="copy-outline" size={16} color="#4285F4" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {property.links && property.links.map(link => (
                            <View key={link.id} style={[styles.resourceItem, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}>
                                <TouchableOpacity 
                                    style={styles.resourceMain}
                                    onPress={() => Linking.openURL(link.url)}
                                >
                                    <Ionicons name="link-outline" size={20} color="#a1a1aa" />
                                    <Text style={[styles.resourceText, { color: settings?.textSecondaryColor || '#e4e4e7' }]}>{link.description}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.copyBtn}
                                    onPress={() => copyToClipboard(link.url)}
                                >
                                    <Ionicons name="copy-outline" size={16} color={settings?.primaryColor || Config.COLORS.brand} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Property Description</Text>
                        <View style={[styles.descriptionCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}>
                            <Text 
                                style={[styles.desc, { color: settings?.textSecondaryColor || '#a1a1aa' }]} 
                                numberOfLines={isExpanded ? undefined : 4}
                            >
                                {property.description}
                            </Text>
                            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.readMoreBtn}>
                                <Text style={[styles.readMoreText, { color: settings?.primaryColor || Config.COLORS.brand }]}>{isExpanded ? 'Show Less' : 'Read More'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {property.deployedInventory && property.deployedInventory.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Deployed Inventory</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inventoryList}>
                                {property.deployedInventory.map(item => (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={[styles.inventoryCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}
                                        onPress={() => {
                                            console.log('[DEBUG] Property inventory item clicked. Category Image URL:', item.category.imageUrl);
                                            setSelectedInventoryItem(item);
                                        }}
                                    >
                                        <View style={styles.inventoryIconBox}>
                                            <Ionicons name={(item.category.icon || 'cube-outline') as any} size={20} color="#fbbf24" />
                                        </View>
                                        <Text style={[styles.inventoryName, { color: settings?.textColor || 'white' }]} numberOfLines={1}>{item.name}</Text>
                                        <Text style={[styles.inventoryCode, { color: settings?.textSecondaryColor || '#71717a' }]}>{item.code}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {property.units.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Units & Media</Text>
                            {property.units.map(unit => (
                                <TouchableOpacity 
                                    key={unit.id} 
                                    style={[styles.unitCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}
                                    onPress={() => setActiveCollection(unit)}
                                >
                                    <View style={styles.unitHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.unitName}>{unit.name}</Text>
                                            <View style={styles.unitSpecsRow}>
                                                <View style={styles.unitSpecItem}>
                                                    <Ionicons name="bed-outline" size={14} color="#818cf8" />
                                                    <Text style={[styles.unitSpecs, { color: settings?.textSecondaryColor || '#d1d1d6' }]}>{unit.bedrooms || 0}</Text>
                                                </View>
                                                <View style={styles.unitSpecItem}>
                                                    <Ionicons name="water-outline" size={14} color="#34d399" />
                                                    <Text style={[styles.unitSpecs, { color: settings?.textSecondaryColor || '#d1d1d6' }]}>{unit.bathrooms || 0}</Text>
                                                </View>
                                                {unit.livingSize && (
                                                    <View style={styles.unitSpecItem}>
                                                        <Ionicons name="expand-outline" size={14} color="#fbbf24" />
                                                        <Text style={[styles.unitSpecs, { color: settings?.textSecondaryColor || '#d1d1d6' }]}>{unit.livingSize} Sqft</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={[styles.mediaBadge, { backgroundColor: settings?.primaryColor || Config.COLORS.brand }]}>
                                            <Ionicons name="images" size={12} color="white" />
                                            <Text style={styles.mediaBadgeText}>{unit.media.length}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.mediaPreview}>
                                        {unit.media.slice(0, 4).map((m, idx) => (
                                            <View key={m.id} style={styles.previewThumbWrapper}>
                                                <Image 
                                                    source={{ uri: `https://pro.nhiphan.com/api/heaven/thumbnail?fileId=${m.driveFileId}` }}
                                                    style={styles.previewThumb}
                                                />
                                            </View>
                                        ))}
                                        {unit.media.length > 4 && (
                                            <View style={styles.moreOverlay}>
                                                <Text style={styles.moreText}>+{unit.media.length - 4}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {property.assets.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Marketing Assets</Text>
                            <View style={styles.assetGrid}>
                                {property.assets.map(asset => (
                                    <TouchableOpacity 
                                        key={asset.id} 
                                        style={[styles.assetCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}
                                        onPress={() => setActiveCollection(asset)}
                                    >
                                        <View style={[styles.assetIconBox, { backgroundColor: (settings?.primaryColor || '#6366f1') + '20' }]}>
                                            <Ionicons 
                                                name={asset.name.toLowerCase().includes('drone') ? 'videocam' : asset.name.toLowerCase().includes('flyer') ? 'document-text' : 'folder'} 
                                                size={24} 
                                                color={settings?.primaryColor || Config.COLORS.brand} 
                                            />
                                        </View>
                                        <Text style={[styles.assetName, { color: settings?.textColor || 'white' }]} numberOfLines={1}>{asset.name}</Text>
                                        <Text style={[styles.assetSub, { color: settings?.textSecondaryColor || '#71717a' }]}>{asset.media.length} items</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FULL SCREEN MEDIA GRID */}
            <Modal
                visible={!!activeCollection}
                animationType="slide"
                onRequestClose={() => setActiveCollection(null)}
            >
                <View style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background, paddingTop: 60 }]}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { color: settings?.textColor || 'white' }]}>{activeCollection?.name}</Text>
                            <Text style={[styles.modalSubtitle, { color: settings?.textSecondaryColor || '#71717a' }]}>{activeCollection?.media.length} items</Text>
                        </View>
                        <TouchableOpacity onPress={() => setActiveCollection(null)} style={[styles.closeBtn, { backgroundColor: settings?.cardColor || '#27272a' }]}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <FlatList 
                        data={activeCollection?.media}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={3}
                        contentContainerStyle={{ padding: 2 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.gridImageItem}
                                onPress={() => setSelectedMedia(item)}
                            >
                                <Image 
                                    source={{ uri: `https://pro.nhiphan.com/api/heaven/thumbnail?fileId=${item.driveFileId}` }}
                                    style={styles.gridImage}
                                />
                                {item.mediaType === 'video' && (
                                    <View style={styles.videoIconOverlay}>
                                        <Ionicons name="play" size={20} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                    <MediaViewer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
                </View>
            </Modal>

            {/* INVENTORY ITEM DETAILS MODAL */}
            <Modal
                visible={!!selectedInventoryItem}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedInventoryItem(null)}
            >
                <View style={[styles.invModalBackground, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
                    <View style={[styles.invModalContent, { backgroundColor: settings?.cardColor || Config.COLORS.card }]}>
                        <TouchableOpacity 
                            style={styles.invCloseBtn}
                            onPress={() => setSelectedInventoryItem(null)}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        {selectedInventoryItem?.category.imageUrl && (
                            <Image 
                                source={{ uri: selectedInventoryItem.category.imageUrl }}
                                style={styles.invCatImage}
                                contentFit="cover"
                            />
                        )}

                        <View style={styles.invDetails}>
                            <View style={styles.invIconLabel}>
                                <Ionicons name={(selectedInventoryItem?.category.icon || 'cube-outline') as any} size={20} color="#fbbf24" />
                                <Text style={[styles.invCatName, { color: settings?.primaryColor || '#fbbf24' }]}>{selectedInventoryItem?.category.name}</Text>
                            </View>
                            
                            <Text style={[styles.invItemName, { color: settings?.textColor || 'white' }]}>{selectedInventoryItem?.name}</Text>
                            <Text style={[styles.invItemCode, { color: settings?.textSecondaryColor || '#71717a' }]}>{selectedInventoryItem?.code}</Text>
                            
                            <View style={[styles.invInfoRow, { borderTopColor: settings?.backgroundColor || Config.COLORS.border }]}>
                                <Text style={[styles.invLabel, { color: settings?.textSecondaryColor || '#71717a' }]}>Date Deployed:</Text>
                                <Text style={[styles.invValue, { color: settings?.textColor || 'white' }]}>
                                    {selectedInventoryItem?.dateOut ? new Date(selectedInventoryItem.dateOut).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            <MediaViewer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    heroContainer: { width: '100%', height: width * 0.8, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    backButton: { 
        position: 'absolute', top: 50, left: 20, width: 44, height: 44, 
        borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10
    },
    heroInfo: { position: 'absolute', bottom: 24, left: 20, right: 20 },
    heroTitle: { fontSize: 32, fontWeight: '900', color: 'white' },
    heroAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    heroAddress: { fontSize: 14, color: '#d1d1d6', fontWeight: '600' },

    content: { padding: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    price: { fontSize: 32, fontWeight: '900', color: 'white' },
    statusBadge: { backgroundColor: '#10b98120', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#10b98140' },
    statusText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    statCard: { 
        flex: 1, padding: 12, borderRadius: 16, 
        alignItems: 'center', borderWidth: 1, borderColor: Config.COLORS.border 
    },
    statValue: { fontSize: 16, fontWeight: '800', color: 'white', marginTop: 8 },
    statLabel: { fontSize: 10, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
    actionBtn: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1
    },
    actionBtnText: { fontSize: 14, fontWeight: '900' },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 16 },
    descriptionCard: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Config.COLORS.border },
    desc: { fontSize: 16, color: '#a1a1aa', lineHeight: 26 },
    readMoreBtn: { marginTop: 12, alignSelf: 'flex-start' },
    readMoreText: { fontWeight: '800', fontSize: 14 },

    inventoryList: { marginHorizontal: -20, paddingHorizontal: 20 },
    inventoryCard: { 
        width: 140, padding: 16, borderRadius: 24, 
        marginRight: 12, borderWidth: 1, borderColor: Config.COLORS.border, alignItems: 'center'
    },
    inventoryIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    inventoryName: { fontSize: 13, fontWeight: '800', color: 'white' },
    inventoryCode: { fontSize: 10, color: '#71717a', fontWeight: '700', marginTop: 2 },

    unitCard: { 
        padding: 20, borderRadius: 28, 
        marginBottom: 16, borderWidth: 1, borderColor: Config.COLORS.border 
    },
    unitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    unitName: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 6 },
    unitSpecsRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    unitSpecItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    unitSpecs: { fontSize: 14, color: '#d1d1d6', fontWeight: '700' },
    mediaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    mediaBadgeText: { color: 'white', fontSize: 11, fontWeight: '900' },

    mediaPreview: { flexDirection: 'row', gap: 8, height: 60, position: 'relative' },
    previewThumbWrapper: { flex: 1, height: '100%' },
    previewThumb: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#27272a' },
    moreOverlay: { 
        position: 'absolute', right: 0, top: 0, width: (width - 100) / 4, height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' 
    },
    moreText: { color: 'white', fontSize: 14, fontWeight: '800' },

    assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    assetCard: { 
        width: (width - 52) / 2, 
        padding: 20, borderRadius: 24, alignItems: 'center',
        borderWidth: 1, borderColor: Config.COLORS.border
    },
    assetIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    assetName: { fontSize: 14, fontWeight: '800', color: 'white' },
    assetSub: { fontSize: 11, color: '#71717a', fontWeight: '600', marginTop: 4 },

    resourceItem: { 
        flexDirection: 'row', alignItems: 'center', 
        borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: Config.COLORS.border,
        overflow: 'hidden'
    },
    resourceMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    resourceText: { flex: 1, fontSize: 15, color: '#e4e4e7', fontWeight: '600' },
    copyBtn: { padding: 16, borderLeftWidth: 1, borderLeftColor: Config.COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' },

    modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalClose: { position: 'absolute', top: 60, right: 24, zIndex: 100 },
    fullImage: { width: width, height: height * 0.8 },

    modalHeader: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 20, marginBottom: 20 
    },
    modalTitle: { fontSize: 24, fontWeight: '900', color: 'white' },
    modalSubtitle: { fontSize: 14, color: '#71717a', fontWeight: '600' },
    closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    gridImageItem: { width: width / 3 - 2, height: width / 3 - 2, margin: 1 },
    gridImage: { width: '100%', height: '100%' },
    videoIconOverlay: { 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' 
    },

    invModalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    invModalContent: { width: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: Config.COLORS.border },
    invCloseBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    invCatImage: { width: '100%', height: 200, backgroundColor: '#18181b' },
    invDetails: { padding: 24 },
    invIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    invCatName: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    invItemName: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 4 },
    invItemCode: { fontSize: 16, color: '#71717a', fontWeight: '700', marginBottom: 24 },
    invInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
    invLabel: { fontSize: 14, color: '#71717a', fontWeight: '600' },
    invValue: { fontSize: 14, color: 'white', fontWeight: '800' },
});
