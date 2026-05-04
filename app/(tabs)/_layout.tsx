import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Config } from '../../constants/Config';
import { useSettings } from '../../context/SettingsContext';

export default function TabsLayout() {
    const { settings } = useSettings();
    const primaryColor = settings?.primaryColor || Config.COLORS.brand;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarBackground: () => (
                    <BlurView 
                        intensity={40} 
                        tint="dark" 
                        style={styles.blurBackground} 
                    />
                ),
                tabBarLabelStyle: styles.label,
                tabBarActiveTintColor: primaryColor,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="properties"
                options={{
                    title: 'Properties',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "business" : "business-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "cube" : "cube-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    href: null, // Hide the map tab
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 24,
        marginLeft: 40,
        marginRight: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 40,
        height: 70,
        borderTopWidth: 0,
        paddingBottom: Platform.OS === 'ios' ? 12 : 6,
        paddingTop: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        elevation: 0,
    },
    blurBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    label: {
        fontSize: 8,
        fontWeight: '800',
        marginTop: 0,
    }
});
