import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Config } from '../../constants/Config';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSettings } from '../../context/SettingsContext';

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Partner');
  const { settings } = useSettings();
  const primaryColor = settings?.primaryColor || Config.COLORS.brand;

  async function fetchDashboard() {
    try {
      const dashboard = await apiFetch('/dashboard');
      const userData = await apiFetch('/auth/me');
      setData(dashboard);
      if (userData.user?.name) setUserName(userData.user.name.split(' ')[0]);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: settings?.textColor || 'white' }]}>Hello, {userName} 👋</Text>
            <Text style={[styles.subtitleText, { color: settings?.textSecondaryColor || '#71717a' }]}>Quick update for today</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="notifications" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* 1. Active Properties */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Active Properties</Text>
          {data?.activeProperties?.length > 0 ? (
            data.activeProperties.map((prop: any) => {
              const stageLabels: Record<string,string> = {SCHEDULE:'Schedule',CAPTURE:'Capture',EDIT:'Edit',UPLOAD:'Upload',INPUT_INFO:'Info',FLYER:'Flyer'};
              const stage = prop.activeStage || 'SCHEDULE';
              const doneCount = prop.projectTasks?.filter((t: any) => t.isDone).length || 0;
              const totalCount = prop.projectTasks?.length || 0;
              const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
              
              return (
                <TouchableOpacity 
                    key={prop.id} 
                    style={[styles.listCard, { backgroundColor: settings?.cardColor || Config.COLORS.card }]} 
                    onPress={() => router.push(`/property/${prop.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listCardTitle, { color: settings?.textColor || 'white' }]}>{prop.name}</Text>
                    <Text style={[styles.listCardSubtitle, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>{[prop.address, prop.city].filter(Boolean).join(', ') || 'No address'}</Text>
                    {totalCount > 0 && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: primaryColor }]} />
                        </View>
                        <Text style={[styles.progressText, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>{doneCount}/{totalCount}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: primaryColor + '20', borderColor: primaryColor + '40' }]}>
                    <Text style={[styles.stageBadgeText, { color: primaryColor }]}>{stageLabels[stage] || stage}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: settings?.cardColor || Config.COLORS.card }]}>
              <Text style={styles.emptyCardText}>No active properties. Toggle 'Active Project' on a property to see it here.</Text>
            </View>
          )}
        </View>

        {/* 2. Open Houses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Open Houses</Text>
          {data?.openHouses?.length > 0 ? (
            data.openHouses.map((prop: any) => {
              const doneCount = prop.openHouseChecklists?.filter((t: any) => t.isDone).length || 0;
              const totalCount = prop.openHouseChecklists?.length || 0;
              const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
              
              return (
                <TouchableOpacity 
                    key={prop.id} 
                    style={[styles.listCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]} 
                    onPress={() => router.push(`/property/${prop.id}`)}
                >
                  <View style={styles.eventIcon}>
                    <Ionicons name="home" size={20} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.listCardTitle, { color: settings?.textColor || 'white' }]}>{prop.name}</Text>
                    <Text style={[styles.listCardSubtitle, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>
                      {new Date(prop.openHouseDate).toLocaleDateString()} · {new Date(prop.openHouseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {totalCount > 0 && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progress === 100 ? '#10b981' : '#fbbf24' }]} />
                        </View>
                        <Text style={[styles.progressText, { color: settings?.textSecondaryColor || '#a1a1aa' }]}>{doneCount}/{totalCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.emptyCardText}>No upcoming open houses.</Text>
            </View>
          )}
        </View>

        {/* 3. New Media Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Recent Media</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaContainer}>
            {data?.recentMedia?.map((item: any) => (
              <TouchableOpacity key={item.id} style={[styles.mediaCard, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]}>
                {item.driveFileId ? (
                  <Image source={{ uri: `https://lh3.googleusercontent.com/d/${item.driveFileId}` }} style={styles.mediaImage} contentFit="cover" transition={300} />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons
                      name={item.mediaType === 'video' ? 'videocam' : 'image-outline'}
                      size={28}
                      color="rgba(255,255,255,0.3)"
                    />
                    <Text style={styles.mediaLabel} numberOfLines={1}>
                      {item.filename || 'Media'}
                    </Text>
                  </View>
                )}
                <View style={styles.mediaOverlay}>
                  <Ionicons name={item.mediaType === 'video' ? 'play-circle' : 'image'} size={20} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. 3 New Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: settings?.textColor || 'white' }]}>Latest Properties</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/properties')}>
              <Text style={[styles.seeAll, { color: primaryColor }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {data?.newProperties?.map((prop: any) => (
            <TouchableOpacity 
                key={prop.id} 
                style={[styles.propItem, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)' }]} 
                onPress={() => router.push(`/property/${prop.id}`)}
            >
              {prop.featuredImageId ? (
                <Image source={{ uri: `https://lh3.googleusercontent.com/d/${prop.featuredImageId}` }} style={styles.propThumb} contentFit="cover" transition={300} />
              ) : (
                <View style={styles.propThumbPlaceholder}>
                  <Ionicons name="home" size={24} color="rgba(255,255,255,0.2)" />
                </View>
              )}
              <View style={styles.propInfo}>
                <Text style={[styles.propName, { color: settings?.textColor || 'white' }]}>{prop.name}</Text>
                <Text style={[styles.propAddr, { color: settings?.textSecondaryColor || '#71717a' }]} numberOfLines={1}>
                  {[prop.address, prop.city].filter(Boolean).join(', ') || 'No address'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#52525b" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 12 },
  welcomeText: { fontSize: 24, fontWeight: '900', color: 'white' },
  subtitleText: { fontSize: 14, color: '#71717a', marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 16 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  listCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  listCardTitle: { fontSize: 16, fontWeight: '700', color: 'white', marginBottom: 4 },
  listCardSubtitle: { fontSize: 12, color: '#a1a1aa', marginBottom: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#a1a1aa', fontWeight: '700' },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginLeft: 12 },
  stageBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  emptyCard: { padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  emptyCardText: { color: '#71717a', fontSize: 13, textAlign: 'center' },

  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  eventIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1, marginLeft: 16 },
  eventTitle: { fontSize: 15, fontWeight: '800', color: 'white' },
  eventSubtitle: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  eventTime: { fontSize: 12, color: '#fbbf24', fontWeight: '700', marginTop: 4 },

  mediaContainer: { gap: 12, paddingRight: 24 },
  mediaCard: { width: 120, height: 160, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mediaImage: { width: '100%', height: '100%' },
  mediaPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8, gap: 8 },
  mediaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  mediaOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4 },

  propItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  propThumb: { width: 60, height: 60, borderRadius: 16 },
  propThumbPlaceholder: { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  propInfo: { flex: 1, marginLeft: 16 },
  propName: { fontSize: 15, fontWeight: '800', color: 'white' },
  propAddr: { fontSize: 12, color: '#71717a', marginTop: 2 },
});
