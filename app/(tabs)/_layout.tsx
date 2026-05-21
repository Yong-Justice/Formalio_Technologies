import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#28A745', tabBarInactiveTintColor: '#64748B' }}>
      <Tabs.Screen name="home" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activité', tabBarIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} /> }} />
      <Tabs.Screen name="accounting" options={{ title: 'Compta IA', tabBarIcon: ({ color }) => <Ionicons name="analytics" size={22} color={color} /> }} />
      <Tabs.Screen name="treasury" options={{ title: 'Trésorerie', tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
    </Tabs>
  );
}