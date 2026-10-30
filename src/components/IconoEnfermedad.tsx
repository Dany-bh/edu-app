import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { TipoEnfermedad, tokens } from '../constants/theme';
import { useTema } from '../hooks/useTema';

interface IconoEnfermedadProps {
  enfermedad: TipoEnfermedad | 'general';
  size?: number;
  color?: string;
}

export function IconoEnfermedad({ enfermedad, size = 24, color }: IconoEnfermedadProps) {
  const { tema } = useTema();
  
  // Use specific color if provided, else look up the accent color, else use primary
  const tint = color || (enfermedad !== 'general' ? tokens.colores.enfermedades[enfermedad] : tema.primario);

  const renderPath = () => {
    switch (enfermedad) {
      case 'cardiovascular':
        return <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
      case 'cancer':
        return <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>; // Ribbon simple
      case 'respiratorias':
        return <Path d="M8 2a4 4 0 0 0-4 4v12a4 4 0 0 0 8 0v-2a4 4 0 0 1 8 0v2a4 4 0 0 0-4 4H8" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>; // Pulmones simplificados
      case 'diabetes':
        return <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>; // Gota (sangre/insulina)
      case 'obesidad':
        return (
          <>
            <Circle cx="12" cy="12" r="9" fill="none" stroke={tint} strokeWidth="2" />
            <Path d="M9 12h6M12 9v6" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </>
        );
      case 'renal':
        return <Path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2-9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>; // Riñón/Filtro simplificado
      case 'salud_mental':
        return <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v4a2 2 0 0 1-4 0V8a2 2 0 0 1 4 0zm4 4h-2" fill="none" stroke={tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>; // Cerebro simplificado
      default:
        // General o default
        return <Circle cx="12" cy="12" r="10" fill="none" stroke={tint} strokeWidth="2" />;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPath()}
    </Svg>
  );
}
