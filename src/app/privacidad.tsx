import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getDb } from '../db/database';
import { useAuth } from '../context/AuthContext';
import { networkSync } from '../services/networkSync';

export default function PrivacyScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleDeleteAccount = async () => {
    const doDelete = async () => {
      try {
        const db = await getDb();
        if (user) {
          await db.runAsync('DELETE FROM usuarios WHERE id = ?', [user.id]);
          await db.runAsync('DELETE FROM progreso WHERE usuario_id = ?', [user.id]);
          networkSync.pushDeleteUser(user.id, user.usuario).catch(() => {});
          await logout();
        }
      } catch (e) {
        Alert.alert('Error', 'No se pudo procesar la solicitud.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta de forma permanente? Se perderá todo tu progreso.')) {
        await doDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Cuenta',
        '¿Estás seguro de que deseas eliminar tu cuenta de forma permanente? Se perderá todo tu progreso.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, Eliminar', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  return (
    <LinearGradient colors={['#0A0A12', '#1A0B2E']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#00FFD1" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Privacidad y Datos</Text>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>¿Qué datos guardamos?</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Datos de cuenta:</Text> Tu nombre, usuario y contraseña (encriptada).{'\n'}
            • <Text style={styles.bold}>Progreso escolar:</Text> Tu nivel, experiencia (XP), respuestas a quizzes e interacción en actividades preventivas.{'\n'}
            • <Text style={styles.bold}>Interacciones con IA:</Text> Consultas enviadas al asistente. Nunca enviamos tu nombre real ni usuario a la IA, usamos un alias genérico por tu seguridad.
          </Text>

          <Text style={styles.sectionTitle}>¿Para qué los usamos?</Text>
          <Text style={styles.text}>
            Todos los datos recopilados se utilizan exclusivamente con fines educativos y de gamificación, para que el docente pueda evaluar tu progreso en el programa de prevención de Enfermedades No Transmisibles. No vendemos ni compartimos tu información con terceros no autorizados.
          </Text>

          <Text style={styles.sectionTitle}>Eliminación de Cuenta</Text>
          <Text style={styles.text}>
            Si deseas retirar tu consentimiento, puedes solicitar la eliminación permanente de tu cuenta. Esto borrará todo tu progreso de nuestro sistema.
          </Text>
          
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Eliminar mi cuenta y mis datos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingVertical: 50 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: { fontSize: 18, color: '#00FFD1', fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  text: { color: '#CBD5E1', fontSize: 15, lineHeight: 24, marginBottom: 16 },
  bold: { fontWeight: 'bold', color: '#FFF' },
  deleteBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  deleteBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});
