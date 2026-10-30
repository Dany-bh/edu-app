import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Pantalla } from '../components/ui/Pantalla';
import { Boton } from '../components/ui/Boton';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Insignia } from '../components/ui/Insignia';
import { BarraProgreso } from '../components/ui/BarraProgreso';
import { CampoTexto } from '../components/ui/CampoTexto';
import { Esqueleto } from '../components/ui/Esqueleto';
import { EstadoVacio } from '../components/ui/EstadoVacio';
import { IconoEnfermedad } from '../components/IconoEnfermedad';
import { Mascota } from '../components/Mascota';
import { useTema } from '../hooks/useTema';
import { tokens } from '../constants/theme';
import { useRouter } from 'expo-router';

export default function GaleriaScreen() {
  const { modo, setModo, tema } = useTema();
  const [texto, setTexto] = useState('');
  const router = useRouter();

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: tema.texto }]}>Salud Viva UI</Text>
          <Boton 
            titulo={`Modo: ${modo}`} 
            variante="secundario" 
            onPress={() => setModo(modo === 'claro' ? 'oscuro' : 'claro')} 
          />
        </View>

        <Section titulo="Botones">
          <Boton titulo="Principal" onPress={() => {}} style={styles.mb} />
          <Boton titulo="Secundario" variante="secundario" onPress={() => {}} style={styles.mb} />
          <Boton titulo="Peligro" variante="peligro" onPress={() => {}} style={styles.mb} />
          <Boton titulo="Cargando..." cargando onPress={() => {}} style={styles.mb} />
          <Boton titulo="Fantasma" variante="fantasma" onPress={() => {}} />
        </Section>

        <Section titulo="Tipografía">
          <Text style={{ fontFamily: tokens.tipografia.familias.display, fontSize: tokens.tipografia.tamanos.display, color: tema.texto }}>Display</Text>
          <Text style={{ fontFamily: tokens.tipografia.familias.titulo, fontSize: tokens.tipografia.tamanos.titulo, color: tema.texto }}>Título</Text>
          <Text style={{ fontFamily: tokens.tipografia.familias.subtitulo, fontSize: tokens.tipografia.tamanos.subtitulo, color: tema.texto }}>Subtítulo</Text>
          <Text style={{ fontFamily: tokens.tipografia.familias.cuerpoMedio, fontSize: tokens.tipografia.tamanos.cuerpo, color: tema.texto }}>Cuerpo Medio</Text>
          <Text style={{ fontFamily: tokens.tipografia.familias.cuerpo, fontSize: tokens.tipografia.tamanos.cuerpo, color: tema.texto }}>Cuerpo Normal</Text>
        </Section>

        <Section titulo="Insignias">
          <View style={styles.row}>
            <Insignia texto="Primario" />
            <Insignia texto="Éxito" variante="exito" />
            <Insignia texto="Error" variante="error" />
            <Insignia texto="Energía" variante="energia" />
            <Insignia texto="Logro" variante="logro" />
          </View>
        </Section>

        <Section titulo="Tarjetas">
          <Tarjeta>
            <Text style={{ fontFamily: tokens.tipografia.familias.subtitulo, color: tema.texto }}>Tarjeta Base</Text>
            <Text style={{ fontFamily: tokens.tipografia.familias.cuerpo, color: tema.textoSecundario, marginTop: 4 }}>Contenido de ejemplo con contraste AA</Text>
          </Tarjeta>
        </Section>

        <Section titulo="Barra de Progreso">
          <BarraProgreso progreso={0.65} />
        </Section>

        <Section titulo="Campos de Texto">
          <CampoTexto 
            etiqueta="Correo electrónico" 
            placeholder="ejemplo@correo.com" 
            value={texto} 
            onChangeText={setTexto} 
          />
          <CampoTexto 
            etiqueta="Contraseña" 
            placeholder="***" 
            error="La contraseña es muy corta"
          />
        </Section>

        <Section titulo="Estado Vacío">
          <EstadoVacio 
            titulo="No hay resultados" 
            descripcion="Intenta buscar con otros términos" 
            accion={<Boton titulo="Volver" variante="secundario" />}
          />
        </Section>

        <Section titulo="Esqueleto (Carga)">
          <Esqueleto height={100} style={styles.mb} />
          <View style={styles.row}>
            <Esqueleto width={50} height={50} radio="redondo" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Esqueleto height={20} style={{ marginBottom: 8 }} />
              <Esqueleto height={15} width="60%" />
            </View>
          </View>
        </Section>

        <Section titulo="Iconos de Enfermedad">
          <View style={styles.row}>
            <IconoEnfermedad enfermedad="cardiovascular" size={40} />
            <IconoEnfermedad enfermedad="cancer" size={40} />
            <IconoEnfermedad enfermedad="diabetes" size={40} />
            <IconoEnfermedad enfermedad="obesidad" size={40} />
            <IconoEnfermedad enfermedad="salud_mental" size={40} />
          </View>
        </Section>

        <Section titulo="Mascota EduSalud">
          <View style={[styles.row, { justifyContent: 'space-around' }]}>
            <Mascota estado="feliz" size={80} />
            <Mascota estado="animando" size={80} />
            <Mascota estado="pensando" size={80} />
          </View>
        </Section>
        
        <Boton titulo="Volver al Inicio" onPress={() => router.push('/')} style={{ marginTop: 40 }} />

      </ScrollView>
    </Pantalla>
  );
}

const Section = ({ titulo, children }: { titulo: string, children: React.ReactNode }) => {
  const { tema } = useTema();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tema.primario }]}>{titulo}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  mb: {
    marginBottom: 12,
  }
});
