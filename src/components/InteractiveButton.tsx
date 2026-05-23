import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Animated, StyleProp, ViewStyle } from 'react-native';

interface InteractiveButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function InteractiveButton({ children, onPress, style, disabled }: InteractiveButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.94,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
