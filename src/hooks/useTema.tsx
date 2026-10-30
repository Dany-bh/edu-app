import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens, TemaColores } from '../constants/theme';

type ModoTema = 'claro' | 'oscuro' | 'sistema';

interface TemaContextProps {
  modo: ModoTema;
  esOscuro: boolean;
  tema: TemaColores;
  setModo: (modo: ModoTema) => void;
}

const TemaContext = createContext<TemaContextProps>({
  modo: 'sistema',
  esOscuro: false,
  tema: tokens.colores.claro,
  setModo: () => {},
});

export const TemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();
  const [modo, setModoState] = useState<ModoTema>('sistema');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('tema_preferencia').then((guardado) => {
      if (guardado === 'claro' || guardado === 'oscuro') {
        setModoState(guardado as ModoTema);
      }
      setListo(true);
    });
  }, []);

  const setModo = (nuevoModo: ModoTema) => {
    setModoState(nuevoModo);
    AsyncStorage.setItem('tema_preferencia', nuevoModo);
  };

  const esOscuro = modo === 'sistema' ? scheme === 'dark' : modo === 'oscuro';
  const tema = esOscuro ? tokens.colores.oscuro : tokens.colores.claro;

  if (!listo) return null;

  return (
    <TemaContext.Provider value={{ modo, esOscuro, tema, setModo }}>
      {children}
    </TemaContext.Provider>
  );
};

export const useTema = () => useContext(TemaContext);
