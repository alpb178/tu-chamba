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
import { ListaScreen } from '@/screens/ListaScreen';
import { DetalleScreen } from '@/screens/DetalleScreen';
import { NuevoScreen } from '@/screens/NuevoScreen';

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
        // Stack de autenticación
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        </>
      ) : (
        // Stack de la app
        <>
          <Stack.Screen name="Lista" component={ListaScreen} options={{ title: 'Tu Chamba' }} />
          <Stack.Screen name="Detalle" component={DetalleScreen} options={{ title: 'Anuncio' }} />
          <Stack.Screen name="Nuevo" component={NuevoScreen} options={{ title: 'Anuncio' }} />
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
