import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { getToken } from '../services/api';
import { Config } from '../constants/Config';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

function MainLayout() {
    const router = useRouter();
    const segments = useSegments();
    const { settings, loading: settingsLoading } = useSettings();
    const [isReady, setIsReady] = useState(false);

    // Auth Check
    useEffect(() => {
        async function checkAuth() {
            const token = await getToken();
            const inAuthGroup = segments[0] === '(auth)';

            // Give it a tiny bit of time for the router to mount
            setTimeout(() => {
                if (!token && !inAuthGroup) {
                    router.replace('/(auth)/login');
                } else if (token && inAuthGroup) {
                    router.replace('/(tabs)');
                }
                setIsReady(true);
            }, 500);
        }
        if (!settingsLoading) {
            checkAuth();
        }
    }, [settingsLoading, segments]);

    if (settingsLoading || !isReady) return null;

    // Maintenance Mode Overlay
    if (settings.isMaintenance) {
        return (
            <View style={styles.maintenanceContainer}>
                <StatusBar style="light" />
                <Text style={styles.maintenanceIcon}>🛠️</Text>
                <Text style={styles.maintenanceTitle}>System Maintenance</Text>
                <Text style={styles.maintenanceText}>
                    We're currently updating the app to serve you better. Please check back soon!
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen 
                    name="property/[id]" 
                    options={{ 
                        headerShown: true,
                        headerStyle: { backgroundColor: settings?.backgroundColor || Config.COLORS.background },
                        headerTintColor: '#ffffff',
                        headerTitle: settings.appName,
                        headerBackTitle: 'Back',
                    }} 
                />
            </Stack>
        </SafeAreaProvider>
    );
}

export default function RootLayout() {
    return (
        <SettingsProvider>
            <MainLayout />
        </SettingsProvider>
    );
}

const styles = StyleSheet.create({
    maintenanceContainer: {
        flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 40
    },
    maintenanceIcon: { fontSize: 64, marginBottom: 20 },
    maintenanceTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 12 },
    maintenanceText: { color: '#71717a', textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
