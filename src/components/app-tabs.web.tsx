import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, Text, StyleSheet } from 'react-native';

import { ExternalLink } from './external-link';
import { useAppTheme } from '../services/themeContext';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>拟鑫天气</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>系统设置</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { activeTheme } = useAppTheme();
  
  const isGlass = activeTheme === 'glass';
  const isNeo = activeTheme === 'neo';

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          isGlass ? (
            isFocused ? styles.btnGlassActive : styles.btnGlassInactive
          ) : isNeo ? (
            isFocused ? styles.btnNeoActive : styles.btnNeoInactive
          ) : (
            isFocused ? styles.btnMinimalActive : styles.btnMinimalInactive
          )
        ]}>
        <Text style={[
          styles.tabBtnText,
          isGlass ? (
            isFocused ? styles.textGlassActive : styles.textGlassInactive
          ) : isNeo ? (
            isFocused ? styles.textNeoActive : styles.textNeoInactive
          ) : (
            isFocused ? styles.textMinimalActive : styles.textMinimalInactive
          )
        ]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { activeTheme } = useAppTheme();
  
  const isGlass = activeTheme === 'glass';
  const isNeo = activeTheme === 'neo';

  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={[
        styles.innerContainer,
        isGlass ? styles.bgGlass : isNeo ? styles.bgNeo : styles.bgMinimal
      ]}>
        <Text style={[
          styles.brandText,
          isGlass ? styles.brandTextGlass : isNeo ? styles.brandTextNeo : styles.brandTextMinimal
        ]}>
          拟鑫天气
        </Text>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <Text style={[
              styles.linkText,
              isGlass ? styles.linkGlass : isNeo ? styles.linkNeo : styles.linkMinimal
            ]}>Docs</Text>
            <SymbolView
              tintColor={isGlass ? '#00F260' : isNeo ? '#FF9F1C' : '#1E1E24'}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    bottom: 0,
    zIndex: 9999,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    height: 52,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 12.5,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
  linkText: {
    fontSize: 12.5,
    marginRight: 2,
  },

  // Glass Theme styles
  bgGlass: {
    backgroundColor: 'rgba(5, 28, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 96, 0.3)',
    shadowColor: '#00F260',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  btnGlassActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  btnGlassInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textGlassActive: { color: '#00F260', fontWeight: 'bold' },
  textGlassInactive: { color: 'rgba(255, 255, 255, 0.65)' },
  brandTextGlass: { color: '#00F260', fontWeight: 'bold', fontSize: 14 },
  linkGlass: { color: 'rgba(255, 255, 255, 0.8)' },

  // Neomorphic Theme styles
  bgNeo: {
    backgroundColor: '#E0E5EC',
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  btnNeoActive: {
    backgroundColor: '#E0E5EC',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  btnNeoInactive: {
    backgroundColor: '#E0E5EC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textNeoActive: { color: '#FF9F1C', fontWeight: 'bold' },
  textNeoInactive: { color: '#7D8A99' },
  brandTextNeo: { color: '#4F5D75', fontWeight: 'bold', fontSize: 14 },
  linkNeo: { color: '#4F5D75' },

  // Minimalist Theme styles
  bgMinimal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  btnMinimalActive: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#1E1E24',
  },
  btnMinimalInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textMinimalActive: { color: '#FFFFFF', fontWeight: 'bold' },
  textMinimalInactive: { color: '#7F8C8D' },
  brandTextMinimal: { color: '#1E1E24', fontWeight: '800', fontSize: 14 },
  linkMinimal: { color: '#1E1E24' },
});
