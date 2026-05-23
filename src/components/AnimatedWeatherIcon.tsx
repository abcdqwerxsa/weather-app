import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Cloudy, 
  CloudDrizzle, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Droplets 
} from 'lucide-react-native';
import { getLucideIconName } from '../services/weatherApi';

interface AnimatedIconProps {
  iconCode: string;
  size: number;
  color?: string;
}

export default function AnimatedWeatherIcon({ iconCode, size, color = '#FFFFFF' }: AnimatedIconProps) {
  const iconName = getLucideIconName(iconCode);
  
  // Animation variables
  const spinValue = useRef(new Animated.Value(0)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const swayValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Infinite Rotation for Sun
    if (iconName === 'Sun') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 16000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    // 2. Infinite Floating for Clouds
    if (iconName === 'Cloud' || iconName === 'Cloudy' || iconName === 'CloudSun') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatValue, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatValue, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // 3. Infinite Pulsing/Bounce for Rain and Snow
    if (iconName === 'CloudRain' || iconName === 'CloudDrizzle' || iconName === 'CloudLightning' || iconName === 'Snowflake') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.08,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // 4. Infinite Sway for Wind
    if (iconName === 'Wind') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swayValue, {
            toValue: -1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swayValue, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [iconName]);

  // Interpolations
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatY = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const sway = swayValue.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const iconProps = { size, color };

  // Render correct animated component
  switch (iconName) {
    case 'Sun':
      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Sun {...iconProps} color="#FF9F1C" />
        </Animated.View>
      );
    case 'CloudSun':
    case 'Cloud':
    case 'Cloudy':
      return (
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          {iconName === 'Cloudy' ? (
            <Cloudy {...iconProps} />
          ) : (
            <Cloud {...iconProps} />
          )}
        </Animated.View>
      );
    case 'CloudRain':
    case 'CloudDrizzle':
    case 'CloudLightning':
    case 'Snowflake':
      return (
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          {iconName === 'CloudLightning' ? (
            <CloudLightning {...iconProps} color="#E0A96D" />
          ) : iconName === 'Snowflake' ? (
            <Snowflake {...iconProps} color="#A5CAD2" />
          ) : iconName === 'CloudDrizzle' ? (
            <CloudDrizzle {...iconProps} color="#80B9AD" />
          ) : (
            <CloudRain {...iconProps} color="#5D8AA8" />
          )}
        </Animated.View>
      );
    case 'Wind':
      return (
        <Animated.View style={{ transform: [{ rotate: sway }] }}>
          <Wind {...iconProps} color="#90AFB7" />
        </Animated.View>
      );
    default:
      return <Cloud {...iconProps} />;
  }
}
