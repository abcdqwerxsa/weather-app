import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Platform,
  FlatList,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, MapPin, AlertTriangle, RefreshCw } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { 
  CityInfo, 
  WeatherData, 
  searchCity, 
  fetchWeatherData,
  getCityByCoords
} from '../services/weatherApi';

// Set up the notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configure android channel for high priority sound/alert
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

import { loadSettings } from '../services/settingsService';
import { generateWeatherComment } from '../services/aiService';

// Import our gorgeous themes
import GlassmorphicTheme from '../components/themes/GlassmorphicTheme';
import NeomorphicTheme from '../components/themes/NeomorphicTheme';
import MinimalistTheme from '../components/themes/MinimalistTheme';
import { useAppTheme, ThemeType } from '../services/themeContext';

// Import our tactile animated components
import InteractiveButton from '../components/InteractiveButton';

// Default city to load (Shenzhen Nanshan)
const DEFAULT_CITY: CityInfo = {
  name: 'Nanshan District',
  chineseName: '广东省深圳市南山区',
  lat: 22.5360142,
  lon: 113.9256222,
  country: 'CN',
  state: 'Guangdong Province'
};

export default function HomeScreen() {
  const { activeTheme, setActiveTheme } = useAppTheme();
  const [currentCity, setCurrentCity] = useState<CityInfo>(DEFAULT_CITY);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CityInfo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<CityInfo[]>([
    DEFAULT_CITY,
    { name: 'Shanghai', chineseName: '上海市', lat: 31.230416, lon: 121.473701, country: 'CN' },
    { name: 'Shenzhen', chineseName: '深圳市', lat: 22.543099, lon: 114.057868, country: 'CN' }
  ]);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [aiComment, setAiComment] = useState<string>('');

  // Get device GPS location
  const getLocationAsync = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('无法获取定位：请在系统设置中授予“拟鑫天气”定位权限。');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const cityInfo = await getCityByCoords(latitude, longitude);
      setCurrentCity(cityInfo);
    } catch (err) {
      console.error(err);
      setError('GPS 定位获取失败，请确保手机定位服务已开启。');
    } finally {
      setIsLocating(false);
    }
  };

  // Attempt auto-location on mount
  useEffect(() => {
    const autoLocate = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = location.coords;
          const cityInfo = await getCityByCoords(latitude, longitude);
          setCurrentCity(cityInfo);
        }
      } catch (err) {
        console.error('Auto locate on mount failed:', err);
      }
    };
    autoLocate();
  }, []);

  // Load AI weather comment when weather data is successfully fetched
  useEffect(() => {
    if (weatherData) {
      const fetchAiComment = async () => {
        setAiComment('🤖 正在连线 AI 气象播报员，准备说骚话...');
        try {
          const settings = await loadSettings();
          if (settings.aiEnabled) {
            const comment = await generateWeatherComment(
              weatherData.current.cityName,
              weatherData.current.temp,
              weatherData.current.description,
              weatherData.current.tempMin,
              weatherData.current.tempMax,
              weatherData.current.humidity,
              weatherData.current.windSpeed
            );
            setAiComment(comment);
          } else {
            setAiComment('');
          }
        } catch (err) {
          console.error('Failed to generate AI comment for UI:', err);
          setAiComment('🤖 AI 气象播报员信号不太好，去设置里检查下配置吧！');
        }
      };
      fetchAiComment();
    }
  }, [weatherData]);

  // Configure daily 6:00 AM weather notifications when weather data is successfully fetched
  useEffect(() => {
    if (weatherData) {
      const setupNotifications = async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const cityName = weatherData.current.cityName;
            const temp = weatherData.current.temp;
            const desc = weatherData.current.description;
            const tempMin = weatherData.current.tempMin;
            const tempMax = weatherData.current.tempMax;
            const humidity = weatherData.current.humidity;
            const windSpeed = weatherData.current.windSpeed;

            // Generate dynamic AI comment for the morning notification
            let dynamicAiComment = '';
            try {
              const settings = await loadSettings();
              if (settings.aiEnabled) {
                dynamicAiComment = await generateWeatherComment(
                  cityName,
                  temp,
                  desc,
                  tempMin,
                  tempMax,
                  humidity,
                  windSpeed
                );
              }
            } catch (err) {
              console.error('Failed to generate AI weather comment for notification:', err);
            }

            // Cancel any existing daily scheduled weather notifications to avoid duplicates
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notification of scheduled) {
              if (notification.identifier === 'daily-weather-alarm') {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
              }
            }

            // Schedule daily at 6:00 AM
            await Notifications.scheduleNotificationAsync({
              identifier: 'daily-weather-alarm',
              content: {
                title: `☀️ 拟鑫天气 | ${cityName} · ${desc} · ${tempMin}°C ~ ${tempMax}°C`,
                body: dynamicAiComment ? `🤖 AI点评: ${dynamicAiComment}` : `今日当前气温 ${temp}°C，湿度 ${humidity}%。祝您今天开启美好的一天！`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: 6,
                minute: 0,
                repeats: true,
              },
            });
            console.log('Daily weather alarm scheduled successfully at 6:00 AM.');
          }
        } catch (err) {
          console.error('Failed to setup notifications:', err);
        }
      };
      setupNotifications();
    }
  }, [weatherData]);

  // Load weather data on city change
  useEffect(() => {
    const loadWeather = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherData(currentCity);
        setWeatherData(data);
      } catch (err: any) {
        console.error(err);
        setError('无法获取天气数据，请检查网络连接或稍后再试。');
      } finally {
        setIsLoading(false);
      }
    };
    loadWeather();
  }, [currentCity]);

  // Handle city search query changes
  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const results = await searchCity(text);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a city
  const selectCity = (city: CityInfo) => {
    setCurrentCity(city);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();

    // Add to search history if not already present
    if (!searchHistory.some(h => h.lat === city.lat && h.lon === city.lon)) {
      setSearchHistory([city, ...searchHistory.slice(0, 4)]);
    }
  };

  // Clear search input
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Render Theme Switcher row
  const renderThemeToggle = () => {
    const themes: { id: ThemeType; label: string }[] = [
      { id: 'glass', label: '玻璃拟态' },
      { id: 'neo', label: '实物拟态' },
      { id: 'minimal', label: '极简现代' }
    ];

    return (
      <View style={[styles.toggleContainer, activeTheme === 'glass' ? styles.toggleGlass : activeTheme === 'neo' ? styles.toggleNeo : styles.toggleMinimal]}>
        {themes.map((t) => {
          const isSelected = activeTheme === t.id;
          return (
            <InteractiveButton
              key={t.id}
              style={[
                styles.toggleBtn,
                isSelected ? (
                  activeTheme === 'glass' ? styles.toggleBtnGlassActive :
                  activeTheme === 'neo' ? styles.toggleBtnNeoActive :
                  styles.toggleBtnMinimalActive
                ) : undefined
              ]}
              onPress={() => setActiveTheme(t.id)}
            >
              <Text style={[
                styles.toggleBtnText,
                isSelected ? (
                  activeTheme === 'glass' ? styles.toggleTextGlassActive :
                  activeTheme === 'neo' ? styles.toggleTextNeoActive :
                  styles.toggleTextMinimalActive
                ) : (
                  activeTheme === 'glass' ? styles.toggleTextGlassInactive :
                  activeTheme === 'neo' ? styles.toggleTextNeoInactive :
                  styles.toggleTextMinimalInactive
                )
              ]}>
                {t.label}
              </Text>
            </InteractiveButton>
          );
        })}
      </View>
    );
  };

  // Render Theme-adapted Search Bar
  const renderSearchBar = () => {
    const isGlass = activeTheme === 'glass';
    const isNeo = activeTheme === 'neo';

    return (
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <View style={[
            styles.searchBar,
            isGlass ? styles.searchBarGlass : isNeo ? styles.searchBarNeo : styles.searchBarMinimal,
            { flex: 1 }
          ]}>
            <Search size={18} color={isGlass ? 'rgba(255,255,255,0.7)' : isNeo ? '#606A7C' : '#7F8C8D'} style={styles.searchIcon} />
            <TextInput
              placeholder="搜索城市 (例如: 广东省深圳市南山区, 东京, London)"
              placeholderTextColor={isGlass ? 'rgba(255,255,255,0.5)' : isNeo ? '#9EA8B6' : '#94A3B8'}
              style={[styles.searchInput, isGlass ? styles.inputGlass : isNeo ? styles.inputNeo : styles.inputMinimal]}
              value={searchQuery}
              onChangeText={handleSearchChange}
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <InteractiveButton onPress={clearSearch} style={styles.clearBtn}>
                <X size={18} color={isGlass ? '#FFFFFF' : isNeo ? '#606A7C' : '#1E1E24'} />
              </InteractiveButton>
            )}
          </View>

          <InteractiveButton 
            onPress={getLocationAsync} 
            style={[
              styles.locateBtn,
              isGlass ? styles.locateBtnGlass : isNeo ? styles.locateBtnNeo : styles.locateBtnMinimal
            ]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={isGlass ? '#00b080' : '#4F5D75'} />
            ) : (
              <MapPin size={18} color={isGlass ? '#FFFFFF' : isNeo ? '#606A7C' : '#1E1E24'} />
            )}
          </InteractiveButton>
        </View>

        {/* Dynamic Search Results Dropdown */}
        {searchQuery.length > 0 && (
          <View style={[
            styles.resultsDropdown,
            isGlass ? styles.dropdownGlass : isNeo ? styles.dropdownNeo : styles.dropdownMinimal
          ]}>
            {isSearching ? (
              <View style={styles.searchingState}>
                <ActivityIndicator size="small" color={isGlass ? '#FFFFFF' : '#4F5D75'} />
                <Text style={[styles.searchingText, isGlass ? styles.textGlass : styles.textNeo]}>正在检索城市...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, isGlass ? styles.textGlass : styles.textNeo]}>未找到匹配的城市</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <InteractiveButton 
                    style={[styles.resultItem, isGlass ? styles.resultItemGlass : styles.resultItemNeo]}
                    onPress={() => selectCity(item)}
                  >
                    <MapPin size={16} color={isGlass ? '#FFFFFF' : '#4F5D75'} style={styles.pinIcon} />
                    <View>
                      <Text style={[styles.resultName, isGlass ? styles.resultNameGlass : styles.resultNameNeo]}>
                        {item.chineseName}
                      </Text>
                      <Text style={[styles.resultSub, isGlass ? styles.resultSubGlass : styles.resultSubNeo]}>
                        {item.name}, {item.country} {item.state ? `· ${item.state}` : ''}
                      </Text>
                    </View>
                  </InteractiveButton>
                )}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  // Render main screen contents based on load state
  if (isLoading && !weatherData) {
    return (
      <View style={[styles.centerContainer, activeTheme === 'neo' ? styles.bgNeo : styles.bgGlass]}>
        <ActivityIndicator size="large" color={activeTheme === 'glass' ? '#FFFFFF' : '#4F5D75'} />
        <Text style={[styles.loadingText, activeTheme === 'glass' ? styles.textGlass : styles.textNeo]}>
          正在加载实时气象...
        </Text>
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={[styles.centerContainer, activeTheme === 'neo' ? styles.bgNeo : styles.bgGlass]}>
        <AlertTriangle size={48} color="#E74C3C" style={{ marginBottom: 16 }} />
        <Text style={[styles.errorText, activeTheme === 'glass' ? styles.textGlass : styles.textNeo]}>{error}</Text>
        <InteractiveButton 
          style={styles.retryBtn} 
          onPress={() => setCurrentCity(DEFAULT_CITY)}
        >
          <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>重试加载</Text>
        </InteractiveButton>
      </View>
    );
  }

  if (!weatherData) return null;

  // Render selected theme component
  switch (activeTheme) {
    case 'glass':
      return (
        <GlassmorphicTheme 
          data={weatherData} 
          themeToggle={renderThemeToggle()} 
          searchBar={renderSearchBar()} 
          aiComment={aiComment}
        />
      );
    case 'neo':
      return (
        <NeomorphicTheme 
          data={weatherData} 
          themeToggle={renderThemeToggle()} 
          searchBar={renderSearchBar()} 
          aiComment={aiComment}
        />
      );
    case 'minimal':
      return (
        <MinimalistTheme 
          data={weatherData} 
          themeToggle={renderThemeToggle()} 
          searchBar={renderSearchBar()} 
          aiComment={aiComment}
        />
      );
    default:
      return (
        <GlassmorphicTheme 
          data={weatherData} 
          themeToggle={renderThemeToggle()} 
          searchBar={renderSearchBar()} 
          aiComment={aiComment}
        />
      );
  }
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bgGlass: {
    backgroundColor: '#051c24', // Deep ocean teal matching Scheme 1 (starting gradient color)
  },
  bgNeo: {
    backgroundColor: '#E0E5EC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textGlass: {
    color: '#FFFFFF',
  },
  textNeo: {
    color: '#333A42',
  },
  // Theme Segmented Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  toggleGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  toggleNeo: {
    backgroundColor: '#E0E5EC',
    // Inset-like neomorphic container
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  toggleMinimal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnGlassActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleBtnNeoActive: {
    backgroundColor: '#E0E5EC',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  toggleBtnMinimalActive: {
    backgroundColor: '#1E1E24',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Text colors for active/inactive states
  toggleTextGlassActive: { color: '#083842' }, // Dark teal matching Scheme 1 instead of purple
  toggleTextGlassInactive: { color: 'rgba(255, 255, 255, 0.8)' },
  toggleTextNeoActive: { color: '#FF9F1C' },
  toggleTextNeoInactive: { color: '#7D8A99' },
  toggleTextMinimalActive: { color: '#FFFFFF' },
  toggleTextMinimalInactive: { color: '#7F8C8D' },

  // Search input styling
  searchWrapper: {
    position: 'relative',
    zIndex: 99,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 44,
  },
  searchBarGlass: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchBarNeo: {
    backgroundColor: '#E0E5EC',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  searchBarMinimal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  inputGlass: { color: '#FFFFFF' },
  inputNeo: { color: '#333A42' },
  inputMinimal: { color: '#1E1E24' },
  clearBtn: {
    padding: 4,
  },
  // Dropdown suggestions styles
  resultsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 20,
    maxHeight: 240,
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    padding: 8,
    elevation: 5,
  },
  dropdownGlass: {
    backgroundColor: 'rgba(5, 28, 36, 0.95)', // Frosted deep ocean teal dropdown matching Scheme 1 (#051c24)
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 96, 0.35)', // Glowing emerald cyan border
    ...Platform.select({
      web: { backdropFilter: 'blur(24px)' }
    })
  },
  dropdownNeo: {
    backgroundColor: '#E0E5EC',
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  dropdownMinimal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchingText: {
    marginLeft: 10,
    fontSize: 13,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  resultItemGlass: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultItemNeo: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D9E6',
  },
  pinIcon: {
    marginRight: 12,
  },
  resultName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultNameGlass: { color: '#FFFFFF' },
  resultNameNeo: { color: '#333A42' },
  resultSub: {
    fontSize: 11,
    marginTop: 2,
  },
  resultSubGlass: { color: 'rgba(255,255,255,0.6)' },
  resultSubNeo: { color: '#7D8A99' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locateBtn: {
    width: 44,
    height: 44,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locateBtnGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  locateBtnNeo: {
    backgroundColor: '#E0E5EC',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  locateBtnMinimal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
});
