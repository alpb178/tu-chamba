import './global.css';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RootStackParamList } from '@/navigation';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ListScreen } from '@/screens/ListScreen';
import { DetailScreen } from '@/screens/DetailScreen';
import { NewAdScreen } from '@/screens/NewAdScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: '#102136' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: '700' as const },
};

function Routes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#102136" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      {!user ? (
        // Auth stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        </>
      ) : (
        // App stack
        <>
          <Stack.Screen name="List" component={ListScreen} options={{ title: 'Tu Chamba' }} />
          <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Anuncio' }} />
          <Stack.Screen name="NewAd" component={NewAdScreen} options={{ title: 'Anuncio' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
