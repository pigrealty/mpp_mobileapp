import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../services/api';
import { Config } from '../constants/Config';

type MobileSettings = {
    appName: string;
    primaryColor: string;
    backgroundColor: string;
    cardColor: string;
    textColor: string;
    textSecondaryColor: string;
    announcement: string;
    isMaintenance: boolean;
};

const SettingsContext = createContext<{
    settings: MobileSettings;
    loading: boolean;
}>({
    settings: {
        appName: 'MPP Mobile',
        primaryColor: Config.COLORS.brand,
        backgroundColor: Config.COLORS.background,
        cardColor: Config.COLORS.card,
        textColor: '#ffffff',
        textSecondaryColor: '#a1a1aa',
        announcement: '',
        isMaintenance: false,
    },
    loading: true,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<MobileSettings>({
        appName: 'MPP Mobile',
        primaryColor: Config.COLORS.brand,
        backgroundColor: Config.COLORS.background,
        cardColor: Config.COLORS.card,
        textColor: '#ffffff',
        textSecondaryColor: '#a1a1aa',
        announcement: '',
        isMaintenance: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            console.log('[DEBUG] loadSettings started');
            try {
                // Try cache first
                const cached = await SecureStore.getItemAsync('mobile_settings');
                if (cached) {
                    setSettings(JSON.parse(cached));
                }

                // Fetch fresh from API
                const res = await apiFetch('/settings');
                if (res.success) {
                    const fresh = {
                        appName: res.data.mobile_app_name,
                        primaryColor: res.data.mobile_primary_color,
                        backgroundColor: res.data.mobile_background_color,
                        cardColor: res.data.mobile_card_color,
                        textColor: res.data.mobile_text_color,
                        textSecondaryColor: res.data.mobile_text_secondary_color,
                        announcement: res.data.mobile_announcement,
                        isMaintenance: res.data.mobile_is_maintenance,
                    };
                    setSettings(fresh);
                    await SecureStore.setItemAsync('mobile_settings', JSON.stringify(fresh));
                }
            } catch (err) {
                console.error('Settings load failed:', err);
            } finally {
                console.log('[DEBUG] loadSettings finished');
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        return {
            settings: {
                appName: 'MPP Mobile',
                primaryColor: Config.COLORS.brand,
                announcement: '',
                isMaintenance: false,
            },
            loading: false
        };
    }
    return context;
};
