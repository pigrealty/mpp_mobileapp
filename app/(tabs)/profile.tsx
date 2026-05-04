import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { removeToken } from '../../services/api';
import { Config } from '../../constants/Config';
import { useSettings } from '../../context/SettingsContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { settings } = useSettings();

    async function handleLogout() {
        await removeToken();
        router.replace('/(auth)/login');
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: settings?.textColor || 'white' }]}>Profile</Text>
            </View>

            <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: settings?.primaryColor || Config.COLORS.brand }]}>
                    <Text style={styles.avatarText}>M</Text>
                </View>
                <Text style={[styles.appName, { color: settings?.textColor || 'white' }]}>{settings?.appName || 'MPP Mobile'}</Text>
                <Text style={[styles.version, { color: settings?.textSecondaryColor || Config.COLORS.textMuted }]}>Version 1.0</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity 
                    style={[styles.logoutBtn, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + '50' }]} 
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: '800', color: 'white' },
    avatarSection: { alignItems: 'center', paddingVertical: 30 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    avatarText: { fontSize: 36, fontWeight: '900', color: 'white' },
    appName: { fontSize: 20, fontWeight: '700', color: 'white' },
    version: { fontSize: 13, color: Config.COLORS.textMuted, marginTop: 4 },
    section: { paddingHorizontal: 20, marginTop: 20 },
    logoutBtn: {
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.3)',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    logoutText: { color: Config.COLORS.error, fontWeight: '700', fontSize: 16 },
});
