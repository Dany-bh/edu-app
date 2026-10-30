import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTema } from '../hooks/useTema';

interface MascotaProps {
  estado?: 'feliz' | 'animando' | 'pensando';
  size?: number;
}

export function Mascota({ estado = 'feliz', size = 120 }: MascotaProps) {
  const { tema } = useTema();
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (estado === 'animando') {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        true
      );
    } else if (estado === 'pensando') {
      bounce.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 800 }),
          withTiming(-5, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0);
    }
  }, [estado, bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const colorCuerpo = tema.primarioClaro;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <G opacity="0.9">
            <Path d="M27 54 C17 48 12 39 14 29 C25 32 31 40 32 49 Z" fill="#138B7C" />
            <Path d="M73 54 C83 48 88 39 86 29 C75 32 69 40 68 49 Z" fill="#138B7C" />
            <Path d="M22 49 Q25 40 29 37 M78 49 Q75 40 71 37" fill="none" stroke="#65D9C8" strokeWidth="1.2" />
          </G>

          <Path
            d="M37 68 C27 69 21 75 18 84 L13 98 L87 98 L82 84 C79 75 73 69 63 68 L57 65 L43 65 Z"
            fill="#F3FFFD"
            stroke="#C9F5EF"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path d="M42 66 L50 75 L39 84 L34 70 Z" fill="#D9F8F3" />
          <Path d="M58 66 L50 75 L61 84 L66 70 Z" fill="#D9F8F3" />
          <Path d="M50 75 L46 80 L49 84 L46 96 L50 98 L54 96 L51 84 L54 80 Z" fill={colorCuerpo} />
          <Path
            d="M36 72 L36 79 C36 84 44 84 44 79 L44 76 M44 79 C44 87 38 88 38 92"
            fill="none"
            stroke="#087C76"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <Circle cx="38" cy="93" r="3.2" fill="#087C76" stroke={colorCuerpo} strokeWidth="1.4" />
          <Path d="M68 81 H76 M72 77 V85" stroke={colorCuerpo} strokeWidth="2.8" strokeLinecap="round" />

          <Path
            d="M50 8 C68 8 82 19 82 37 L82 53 C82 70 70 79 50 81 C30 79 18 70 18 53 L18 37 C18 19 32 8 50 8 Z"
            fill="none"
            stroke={colorCuerpo}
            strokeWidth="7"
            opacity="0.28"
          />
          <Path
            d="M50 8 C68 8 82 19 82 37 L82 53 C82 70 70 79 50 81 C30 79 18 70 18 53 L18 37 C18 19 32 8 50 8 Z"
            fill="#087C76"
            stroke="#E8FFFC"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Path d="M22 42 L28 35 M78 42 L72 35" stroke="#FFB27D" strokeWidth="2.2" strokeLinecap="round" />

          {estado === 'animando' ? (
            <>
              <Circle cx="38" cy="43" r="3.3" fill="#F5FFFD" />
              <Path d="M62 43 Q66 39 70 43" fill="none" stroke="#F5FFFD" strokeWidth="2.6" strokeLinecap="round" />
            </>
          ) : estado === 'pensando' ? (
            <>
              <Circle cx="39" cy="43" r="3.2" fill="#F5FFFD" />
              <Circle cx="65" cy="42" r="2.2" fill="#F5FFFD" />
            </>
          ) : (
            <>
              <Circle cx="38" cy="43" r="3.3" fill="#F5FFFD" />
              <Circle cx="62" cy="43" r="3.3" fill="#F5FFFD" />
            </>
          )}
          <Path d="M29 51 Q34 48 38 51 M62 51 Q66 48 71 51" fill="none" stroke="#F36D8B" strokeWidth="2.1" strokeLinecap="round" />

          {estado === 'feliz' && (
            <Path d="M41 55 Q50 65 59 55 Q56 68 50 68 Q44 68 41 55 Z" fill="#E8FFFC" />
          )}
          {estado === 'animando' && (
            <Path d="M40 54 Q50 68 60 54 Q58 68 50 68 Q42 68 40 54 Z" fill="#E8FFFC" />
          )}
          {estado === 'pensando' && (
            <Path d="M45 61 Q50 59 55 61" fill="none" stroke="#E8FFFC" strokeWidth="2.4" strokeLinecap="round" />
          )}

          {estado === 'pensando' && (
            <G>
              <Circle cx="78" cy="22" r="2.2" fill={tema.logro} />
              <Circle cx="84" cy="16" r="3" fill={tema.logro} />
              <Circle cx="89" cy="9" r="3.8" fill={tema.logro} />
            </G>
          )}
          {estado === 'animando' && (
            <G>
              <Path d="M10 46 L14 41 M90 46 L86 41" stroke={tema.energia} strokeWidth="2.3" strokeLinecap="round" />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
