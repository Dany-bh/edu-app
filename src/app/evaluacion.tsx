import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sexo, imcOmsLms } from '../data/imcOmsLms';
import { 
  calcularImcValue, 
  calcularZScore, 
  obtenerCategoriaOms, 
  obtenerOrientacionImc, 
  esEvaluacionValida, 
  CategoriaImc 
} from '../lib/imc';
import { useTema } from '../hooks/useTema';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../constants/theme';
import { Pantalla } from '../components/ui/Pantalla';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { Insignia } from '../components/ui/Insignia';

export default function EvaluacionScreen() {
  const router = useRouter();
  const { tema } = useTema();
  const { user, procesarAccion } = useAuth();
  
  const [sexo, setSexo] = useState<Sexo>('masculino');
  const [anios, setAnios] = useState('16');
  const [meses, setMeses] = useState('0');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [guardarLocal, setGuardarLocal] = useState(false);

  const [imc, setImc] = useState<number | null>(null);
  const [zScore, setZScore] = useState<number | null>(null);
  const [categoria, setCategoria] = useState<CategoriaImc | null>(null);
  const [recomendacion, setRecomendacion] = useState('');

  const validarEntradas = () => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    const a = parseInt(anios, 10);
    const m = parseInt(meses, 10);

    if (isNaN(a) || a < 10 || a > 19) {
      Alert.alert('Datos incorrectos', 'Por favor, ingresa una edad en años entre 10 y 19.');
      return false;
    }
    if (isNaN(m) || m < 0 || m > 11) {
      Alert.alert('Datos incorrectos', 'Los meses deben estar entre 0 y 11.');
      return false;
    }
    if (isNaN(p) || p < 20 || p > 200) {
      Alert.alert('Datos incorrectos', 'Por favor, ingresa un peso válido (entre 20kg y 200kg).');
      return false;
    }
    if (isNaN(t) || t < 100 || t > 250) {
      const tParsed = t < 3 ? t * 100 : t;
      if (tParsed < 100 || tParsed > 250) {
        Alert.alert('Datos incorrectos', 'Por favor, ingresa una estatura válida en centímetros (ej. 170).');
        return false;
      }
    }
    return true;
  };

  const calcularIMC = async () => {
    if (!validarEntradas()) return;

    const p = parseFloat(peso);
    let t = parseFloat(talla);
    if (t < 3) t = t * 100;

    const totalMeses = parseInt(anios, 10) * 12 + parseInt(meses, 10);
    
    const tablaSexo = imcOmsLms[sexo];
    let lms = tablaSexo[totalMeses];
    if (!lms) {
      const mesesKeys = Object.keys(tablaSexo).map(Number).sort((a,b)=>a-b);
      let closest = mesesKeys[0];
      for (const k of mesesKeys) {
        if (k <= totalMeses) closest = k;
      }
      lms = tablaSexo[closest];
    }

    const calculoImc = calcularImcValue(p, t);
    const calculoZ = calcularZScore(calculoImc, lms);
    const cat = obtenerCategoriaOms(calculoZ);

    setImc(parseFloat(calculoImc.toFixed(1)));
    setZScore(parseFloat(calculoZ.toFixed(2)));
    setCategoria(cat);

    const rec = obtenerOrientacionImc(cat);
    setRecomendacion(rec);

    const esValida = esEvaluacionValida(cat, calculoImc, calculoZ);

    if (guardarLocal && esValida) {
      try {
        const timestamp = new Date().toISOString();
        const evalData = { timestamp, peso: p, talla: t, imc: calculoImc, zScore: calculoZ, categoria: cat };
        const stored = await AsyncStorage.getItem('historial_evaluaciones');
        const history = stored ? JSON.parse(stored) : [];
        history.push(evalData);
        await AsyncStorage.setItem('historial_evaluaciones', JSON.stringify(history));
      } catch (e) {
        console.error('Error guardando en local', e);
      }
    }

    if (user && esValida) {
      procesarAccion({ tipo: 'evaluacion_imc' }).catch(() => {});
    }
  };

  const getCategoriaColor = () => {
    if (!categoria) return tema.textoSecundario;
    if (categoria === 'Delgadez' || categoria === 'Delgadez severa') return tokens.colores.enfermedades.respiratorias;
    if (categoria === 'Normal') return tema.exito;
    if (categoria === 'Sobrepeso') return tema.logro;
    if (categoria === 'Obesidad') return tema.error;
    return tema.textoSecundario;
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tema.borde }]}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
            style={[styles.backButton, { backgroundColor: tema.superficie, borderColor: tema.borde }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={20} color={tema.texto} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerCategory, { color: tema.primario }]}>BIENESTAR Y SALUD</Text>
            <Text style={[styles.headerTitle, { color: tema.texto }]}>Mi Evaluación (10-19 años)</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {/* Banner */}
          <Tarjeta style={[styles.bannerInfo, { backgroundColor: `${tema.primario}12`, borderColor: `${tema.primario}30` }]}>
            <Ionicons name="information-circle" size={22} color={tema.primario} />
            <Text style={[styles.bannerInfoText, { color: tema.textoSecundario }]}>
              Utilizamos los estándares internacionales de la OMS (2007) para adolescentes. Tu información es privada y no se sube a internet.
            </Text>
          </Tarjeta>

          {/* Formulario */}
          <Tarjeta style={styles.formContainer}>
            <Text style={[styles.label, { color: tema.texto }]}>Sexo biológico (al nacer)</Text>
            <View style={[styles.sexoToggle, { backgroundColor: tema.fondo, borderColor: tema.borde }]}>
              <TouchableOpacity 
                style={[styles.sexoBtn, sexo === 'masculino' && { backgroundColor: `${tema.primario}18` }]} 
                onPress={() => setSexo('masculino')}
                accessibilityRole="button"
                accessibilityLabel="Sexo Masculino"
              >
                <Text style={[styles.sexoBtnText, { color: sexo === 'masculino' ? tema.primario : tema.textoSecundario }]}>
                  Masculino
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sexoBtn, sexo === 'femenino' && { backgroundColor: `${tema.primario}18` }]} 
                onPress={() => setSexo('femenino')}
                accessibilityRole="button"
                accessibilityLabel="Sexo Femenino"
              >
                <Text style={[styles.sexoBtnText, { color: sexo === 'femenino' ? tema.primario : tema.textoSecundario }]}>
                  Femenino
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: tokens.espaciado.sm }]}>
                <Text style={[styles.label, { color: tema.texto }]}>Edad (Años)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: tema.fondo, borderColor: tema.borde }]}>
                  <TextInput 
                    style={[styles.input, { color: tema.texto }]} 
                    placeholder="Ej. 16" 
                    placeholderTextColor={tema.textoSecundario} 
                    keyboardType="numeric" 
                    value={anios} 
                    onChangeText={setAnios} 
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: tema.texto }]}>Meses</Text>
                <View style={[styles.inputWrapper, { backgroundColor: tema.fondo, borderColor: tema.borde }]}>
                  <TextInput 
                    style={[styles.input, { color: tema.texto }]} 
                    placeholder="Ej. 4" 
                    placeholderTextColor={tema.textoSecundario} 
                    keyboardType="numeric" 
                    value={meses} 
                    onChangeText={setMeses} 
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tema.texto }]}>Peso corporal (kg)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tema.fondo, borderColor: tema.borde }]}>
                <Ionicons name="scale-outline" size={20} color={tema.primario} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: tema.texto }]} 
                  placeholder="Ej. 65.5" 
                  placeholderTextColor={tema.textoSecundario} 
                  keyboardType="numeric" 
                  value={peso} 
                  onChangeText={setPeso} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tema.texto }]}>Estatura (cm)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tema.fondo, borderColor: tema.borde }]}>
                <Ionicons name="body-outline" size={20} color={tema.primario} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: tema.texto }]} 
                  placeholder="Ej. 170" 
                  placeholderTextColor={tema.textoSecundario} 
                  keyboardType="numeric" 
                  value={talla} 
                  onChangeText={setTalla} 
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: tema.textoSecundario }]}>
                Guardar evaluación solo en este dispositivo
              </Text>
              <Switch 
                value={guardarLocal}
                onValueChange={setGuardarLocal}
                trackColor={{ false: tema.borde, true: tema.primario }}
                thumbColor={tema.superficie}
                accessibilityLabel="Guardar evaluación en este dispositivo"
              />
            </View>

            <Boton
              titulo="Evaluar mi estado"
              onPress={calcularIMC}
              style={{ marginTop: tokens.espaciado.sm }}
            />
          </Tarjeta>

          {/* Resultados */}
          {imc !== null && categoria !== null && (
            <Tarjeta style={[styles.resultCard, { borderColor: getCategoriaColor() }]}>
              <View style={styles.imcHeader}>
                <View>
                  <Text style={[styles.resultTitle, { color: tema.textoSecundario }]}>Tu Índice de Masa Corporal</Text>
                  <Text style={[styles.imcValue, { color: getCategoriaColor() }]}>
                    {imc} <Text style={[styles.imcUnit, { color: tema.textoSecundario }]}>kg/m²</Text>
                  </Text>
                </View>
                <Insignia texto={categoria} variante={categoria === 'Normal' ? 'exito' : 'energia'} />
              </View>

              <View style={[styles.divider, { backgroundColor: tema.borde }]} />

              <View style={styles.infoRow}>
                <Ionicons name="stats-chart-outline" size={22} color={tema.primario} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: tema.texto }]}>Puntaje Z (OMS)</Text>
                  <Text style={[styles.infoValue, { color: tema.textoSecundario }]}>
                    {zScore !== null && zScore > 0 ? '+' : ''}{zScore} DE
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="heart-outline" size={22} color={tema.logro} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: tema.texto }]}>Orientación</Text>
                  <Text style={[styles.infoValue, { color: tema.textoSecundario }]}>{recomendacion}</Text>
                </View>
              </View>
            </Tarjeta>
          )}

          <View style={{ height: tokens.espaciado.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'ios' ? 56 : 20, 
    paddingBottom: 16, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  headerTitleWrap: { alignItems: 'center' },
  headerCategory: { 
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: 10, 
    letterSpacing: 0.8 
  },
  headerTitle: { 
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo 
  },
  scrollContent: { 
    padding: tokens.espaciado.lg, 
    paddingBottom: 80 
  },
  bannerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: tokens.espaciado.md, 
    padding: tokens.espaciado.md, 
    borderRadius: tokens.radios.md, 
    marginBottom: tokens.espaciado.md 
  },
  bannerInfoText: { 
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    lineHeight: 18, 
    flex: 1 
  },
  formContainer: { 
    padding: tokens.espaciado.lg, 
    marginBottom: tokens.espaciado.lg 
  },
  inputGroup: { marginBottom: tokens.espaciado.md },
  row: { flexDirection: 'row' },
  label: { 
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    marginBottom: tokens.espaciado.xs 
  },
  sexoToggle: { 
    flexDirection: 'row', 
    borderRadius: tokens.radios.md, 
    borderWidth: 1, 
    overflow: 'hidden', 
    marginBottom: tokens.espaciado.md 
  },
  sexoBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  sexoBtnText: { 
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.cuerpo 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: tokens.radios.md, 
    borderWidth: 1, 
    paddingHorizontal: tokens.espaciado.md 
  },
  inputIcon: { marginRight: tokens.espaciado.sm },
  input: { flex: 1, height: 48, fontSize: 15 },
  switchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: tokens.espaciado.lg, 
    marginTop: tokens.espaciado.xs 
  },
  switchLabel: { 
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    flex: 1, 
    paddingRight: tokens.espaciado.sm 
  },
  resultCard: { 
    padding: tokens.espaciado.xl,
    borderWidth: 1.5,
  },
  imcHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: tokens.espaciado.md 
  },
  resultTitle: { 
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    marginBottom: 4 
  },
  imcValue: { 
    fontFamily: tokens.tipografia.familias.display,
    fontSize: 40, 
    letterSpacing: -1 
  },
  imcUnit: { 
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: 16 
  },
  divider: { 
    height: 1, 
    marginVertical: tokens.espaciado.md 
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: tokens.espaciado.md, 
    alignItems: 'flex-start', 
    gap: tokens.espaciado.md 
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { 
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    marginBottom: 2 
  },
  infoValue: { 
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta, 
    lineHeight: 18 
  }
});
