import React, { useEffect, useRef } from 'react';
import { Image, Animated, StyleSheet } from 'react-native';

interface SplashProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // mostrar por 1.5 segundos
    const timer = setTimeout(() => {
      // fadeout
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        onFinish(); //
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../../../assets/buster.png')} // logo de dog
        style={styles.logo}
        resizeMode="contain"
      />
      <Image
        source={require('../../../assets/tecm.png')} // logo de dog
        style={styles.logo2}
        resizeMode="contain"
      />

      
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff', // color del fondo
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // garantiza q se ponga arriba d todo
  },
  logo: {
    width: 180,
    height: 180,
  },

    logo2: {
    width: 120,
    height: 140,
    position:'absolute',
    bottom:0,
    resizeMode: 'cover',

  },
});