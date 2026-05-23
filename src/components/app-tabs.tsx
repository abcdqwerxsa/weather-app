import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';
import { useAppTheme } from '../services/themeContext';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const { activeTheme } = useAppTheme();
  const scheme = useColorScheme();
  
  // Dynamic theme colors for native navigation tabs
  const isGlass = activeTheme === 'glass';
  const isNeo = activeTheme === 'neo';
  
  const backgroundColor = isGlass ? '#071521' : isNeo ? '#E0E5EC' : '#FAFAFA';
  const indicatorColor = isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24';
  const labelSelectedColor = isGlass ? '#00F260' : isNeo ? '#FF9F1C' : '#1E1E24';
  const labelUnselectedColor = isGlass ? 'rgba(255, 255, 255, 0.6)' : isNeo ? '#7D8A99' : '#7F8C8D';

  return (
    <NativeTabs
      backgroundColor={backgroundColor}
      indicatorColor={indicatorColor}
      labelStyle={{ 
        selected: { color: labelSelectedColor }
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>拟鑫天气</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>系统设置</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
