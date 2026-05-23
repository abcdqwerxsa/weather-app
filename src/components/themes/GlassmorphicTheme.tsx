import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Compass, 
  Sunrise, 
  Sunset,
  Droplets,
  Wind,
  Cpu
} from 'lucide-react-native';
import { WeatherData } from '../../services/weatherApi';
import AnimatedWeatherIcon from '../AnimatedWeatherIcon';

interface ThemeProps {
  data: WeatherData;
  themeToggle: React.ReactNode;
  searchBar: React.ReactNode;
  aiComment?: string;
}

// Select background dynamic gradient based on weather condition (Scheme 1 flagship theme)
const getGradientColors = (iconCode: string): readonly [string, string, ...string[]] => {
  const code = iconCode.slice(0, 2);
  switch (code) {
    case '01': // Clear sky
      return ['#051c24', '#083842', '#00656a', '#00837a', '#00b080']; // Sunset ocean gold-green blending to emerald
    case '02': // Few clouds
    case '03': // Scattered clouds
    case '04': // Cloudy
      return ['#071521', '#0B2332', '#014C53', '#006E72', '#009083']; // Deep storm indigo to rich ocean emerald
    case '09': // Drizzle
    case '10': // Rain
    case '11': // Thunderstorm
      return ['#030C12', '#081D26', '#003A3F', '#044C51', '#006056']; // Deep dark ocean rain
    case '13': // Snow
      return ['#14252D', '#1D3B46', '#265360', '#3E7B8D', '#83A4D4']; // Arctic icy frozen teal
    default:
      return ['#071521', '#0B2332', '#014C53', '#006E72', '#009083'];
  }
};

export default function GlassmorphicTheme({ data, themeToggle, searchBar, aiComment }: ThemeProps) {
  const { current, hourly, daily } = data;
  const gradient = getGradientColors(current.iconCode);

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Actions */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>拟鑫天气</Text>
          {themeToggle}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          {searchBar}
        </View>

        {/* Current Weather Card */}
        <View style={styles.glassCardBig}>
          <View style={styles.mainInfo}>
            <View>
              <Text style={styles.cityName}>{current.cityName}</Text>
              <Text style={styles.dateText}>
                {new Date(current.dt * 1000).toLocaleDateString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </Text>
            </View>
            <View style={styles.weatherIconContainer}>
              <AnimatedWeatherIcon iconCode={current.iconCode} size={72} />
            </View>
          </View>

          <View style={styles.tempContainer}>
            <Text style={styles.tempText}>{current.temp}°</Text>
            <View style={styles.conditionContainer}>
              <Text style={styles.conditionText}>{current.description}</Text>
              <Text style={styles.rangeText}>
                最高 {current.tempMax}°  最低 {current.tempMin}°
              </Text>
            </View>
          </View>
        </View>

        {/* AI Weather Commentary Card */}
        {aiComment ? (
          <View style={[styles.glassCardMedium, { paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ padding: 4, borderRadius: 8, backgroundColor: 'rgba(0, 242, 96, 0.15)', marginRight: 8 }}>
                <Cpu size={14} color="#00F260" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#00F260', letterSpacing: 0.5 }}>🤖 智能 AI 骚话点评</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 18, fontWeight: '500' }}>
              {aiComment}
            </Text>
          </View>
        ) : null}

        {/* 24-Hour Forecast */}
        <Text style={styles.sectionTitle}>24小时预报</Text>
        <View style={styles.glassCardMedium}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
            {hourly.map((item, idx) => (
              <View key={idx} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{item.time}</Text>
                <View style={styles.hourlyIcon}>
                  <AnimatedWeatherIcon iconCode={item.iconCode} size={28} />
                </View>
                <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                <Text style={styles.hourlyDesc}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Detailed Stats Grid */}
        <Text style={styles.sectionTitle}>天气详情</Text>
        <View style={styles.statsGrid}>
          {/* Card 1: Humidity */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Droplets size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statLabel}>湿度</Text>
            </View>
            <Text style={styles.statValue}>{current.humidity}%</Text>
            <Text style={styles.statSubText}>当前体感温度 {current.feelsLike}°C</Text>
          </View>

          {/* Card 2: Wind */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Wind size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statLabel}>风速</Text>
            </View>
            <Text style={styles.statValue}>{current.windSpeed} m/s</Text>
            <Text style={styles.statSubText}>风向角度 {current.weatherId}°</Text>
          </View>

          {/* Card 3: Sunrise/Sunset */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Sunrise size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statLabel}>日出</Text>
            </View>
            <Text style={styles.statValue}>
              {new Date(current.sunrise * 1000).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
            <Text style={styles.statSubText}>
              日落 {new Date(current.sunset * 1000).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
          </View>

          {/* Card 4: Pressure */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Compass size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statLabel}>气压</Text>
            </View>
            <Text style={styles.statValue}>{current.pressure} hPa</Text>
            <Text style={styles.statSubText}>高度适中，空气舒适</Text>
          </View>
        </View>

        {/* 5-Day Forecast */}
        <Text style={styles.sectionTitle}>5天预报</Text>
        <View style={styles.glassCardMedium}>
          {daily.map((item, idx) => (
            <View key={idx} style={[styles.dailyRow, idx === daily.length - 1 && styles.noBorder]}>
              <View style={styles.dailyDayContainer}>
                <Text style={styles.dailyDay}>{item.dayName}</Text>
                <Text style={styles.dailyDate}>{item.dateStr}</Text>
              </View>
              
              <View style={styles.dailyStatusContainer}>
                <AnimatedWeatherIcon iconCode={item.iconCode} size={24} />
                <Text style={styles.dailyDesc}>{item.description}</Text>
              </View>

              <View style={styles.dailyTempRange}>
                <Text style={styles.dailyTempMin}>{item.tempMin}°</Text>
                {/* Temp progress bar */}
                <View style={styles.tempBarContainer}>
                  <LinearGradient 
                    colors={['#80c1ff', '#ffb366']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tempBar} 
                  />
                </View>
                <Text style={styles.dailyTempMax}>{item.tempMax}°</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  searchSection: {
    marginBottom: 20,
  },
  glassCardBig: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 96, 0.35)', // Glowing emerald cyan border
    shadowColor: '#00F260',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
      }
    })
  },
  glassCardMedium: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 96, 0.25)', // Glowing emerald cyan border
    shadowColor: '#00F260',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      }
    })
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  weatherIconContainer: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  tempText: {
    fontSize: 72,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 76,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  conditionContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  conditionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rangeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hourlyScroll: {
    paddingHorizontal: 4,
  },
  hourlyItem: {
    alignItems: 'center',
    width: 68,
    marginRight: 12,
  },
  hourlyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 8,
  },
  hourlyIcon: {
    marginBottom: 8,
    height: 32,
    justifyContent: 'center',
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hourlyDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 14,
    width: '48%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 96, 0.2)', // Glowing emerald cyan border
    shadowColor: '#00F260',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      }
    })
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statSubText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  dailyDayContainer: {
    width: 60,
  },
  dailyDay: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dailyDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  dailyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  dailyDesc: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dailyTempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    justifyContent: 'flex-end',
  },
  dailyTempMin: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    width: 25,
    textAlign: 'right',
  },
  dailyTempMax: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    width: 25,
    textAlign: 'left',
  },
  tempBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  tempBar: {
    height: '100%',
    width: '70%',
    alignSelf: 'center',
    borderRadius: 2,
  },
});
