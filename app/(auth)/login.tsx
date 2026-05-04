import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, saveToken } from '../../services/api';
import { Config } from '../../constants/Config';
import { useSettings } from '../../context/SettingsContext';

export default function LoginScreen() {
    const router = useRouter();
    const { settings } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const primaryColor = settings?.primaryColor || Config.COLORS.brand;

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (res.success) {
                await saveToken(res.token);
                router.replace('/(tabs)');
            } else {
                setError(res.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: settings?.backgroundColor || Config.COLORS.background }]}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.inner}>
                    <View style={styles.logoSection}>
                        <View style={[styles.logoPlaceholder, { 
                            backgroundColor: primaryColor,
                            shadowColor: primaryColor,
                        }]}>
                            <Ionicons name="home" size={40} color="white" />
                        </View>
                        <Text style={[styles.title, { color: settings?.textColor || 'white' }]}>{settings?.appName || 'MPP Mobile'}</Text>
                        <Text style={[styles.subtitle, { color: settings?.textSecondaryColor || '#71717a' }]}>Partner Portal Access</Text>
                    </View>

                    <View style={styles.formSection}>
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#71717a" style={styles.inputIcon} />
                            <TextInput 
                                style={[styles.input, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)', color: settings?.textColor || 'white' }]}
                                placeholder="Email Address"
                                placeholderTextColor={settings?.textSecondaryColor || "#52525b"}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#71717a" style={styles.inputIcon} />
                            <TextInput 
                                style={[styles.input, { backgroundColor: (settings?.cardColor || Config.COLORS.card) + 'D9', borderColor: 'rgba(255,255,255,0.08)', color: settings?.textColor || 'white' }]}
                                placeholder="Password"
                                placeholderTextColor={settings?.textSecondaryColor || "#52525b"}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.loginBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.loginBtnText}>Sign In</Text>
                                    <Ionicons name="arrow-forward" size={18} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: settings?.textSecondaryColor || '#52525b' }]}>Media Production Pro v1.0</Text>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, padding: 32, justifyContent: 'center' },
    logoSection: { alignItems: 'center', marginBottom: 48 },
    logoPlaceholder: {
        width: 80, height: 80, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
        marginBottom: 20,
    },
    title: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4, fontWeight: '600' },
    formSection: { gap: 16 },
    errorBox: {
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    errorText: { color: '#fb7185', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: 18, zIndex: 10 },
    input: {
        borderRadius: 16, paddingVertical: 16, paddingLeft: 48, paddingRight: 16,
        color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    loginBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 18, borderRadius: 16, marginTop: 12,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    loginBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
    footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
    footerText: { color: '#52525b', fontSize: 12, fontWeight: '600' },
});
