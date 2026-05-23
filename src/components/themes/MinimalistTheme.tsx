import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Cloudy, 
  CloudDrizzle, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Droplets, 
  Compass, 
  Sunrise, 
  Sunset,
  Cpu
} from 'lucide-react-native';
import { WeatherData, getLucideIconName } from '../../services/weatherApi';

interface ThemeProps {
  data: WeatherData;
  themeToggle: React.ReactNode;
  searchBar: React.ReactNode;
  aiComment?: string;
}

// Render Weather Icon in elegant minimalist outline style
const renderWeatherIcon = (iconCode: string, size: number) => {
  const iconName = getLucideIconName(iconCode);
  const color = '#1E1E24';
  const props = { size, color };
  switch (iconName) {
    case 'Sun': return <Sun {...props} color="#E67E22" />;
    case 'CloudSun': return <Cloud {...props} />;
    case 'Cloud': return <Cloud {...props} />;
    case 'Cloudy': return <Cloudy {...props} />;
    case 'CloudDrizzle': return <CloudDrizzle {...props} />;
    case 'CloudRain': return <CloudRain {...props} color="#2980B9" />;
    case 'CloudLightning': return <CloudLightning {...props} color="#F1C40F" />;
    case 'Snowflake': return <Snowflake {...props} color="#3498DB" />;
    case 'Wind': return <Wind {...props} />;
    default: return <Cloud {...props} />;
  }
};

export default function MinimalistTheme({ data, themeToggle, searchBar, aiComment }: ThemeProps) {
  const { current, hourly, daily } = data;

  return (
    <View style={styles.container}>
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
        <View style={styles.cardBig}>
          <View style={styles.mainInfo}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cityName} numberOfLines={2}>{current.cityName}</Text>
              <Text style={styles.dateText}>
                {new Date(current.dt * 1000).toLocaleDateString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </Text>
            </View>
            <View style={styles.weatherIconContainer}>
              {renderWeatherIcon(current.iconCode, 56)}
            </View>
          </View>

          <View style={styles.tempContainer}>
            <Text style={styles.tempText}>{current.temp}°</Text>
            <View style={styles.conditionContainer}>
              <Text style={styles.conditionText}>{current.description}</Text>
              <Text style={styles.rangeText}>
                最高 {current.tempMax}°  ·  最低 {current.tempMin}°
              </Text>
            </View>
          </View>
        </View>

        {/* AI Weather Commentary Card (Minimalist Style) */}
        {aiComment ? (
          <View style={[styles.cardMedium, { paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ padding: 4, borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 8 }}>
                <Cpu size={14} color="#1E1E24" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E1E24', letterSpacing: 0.5 }}>🤖 智能 AI 骚话点评</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#2C3E50', lineHeight: 18, fontWeight: '500' }}>
              {aiComment}
            </Text>
          </View>
        ) : null}

        {/* 24-Hour Forecast */}
        <Text style={styles.sectionTitle}>24小时预报</Text>
        <View style={styles.cardMedium}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
            {hourly.map((item, idx) => (
              <View key={idx} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{item.time}</Text>
                <View style={styles.hourlyIcon}>
                  {renderWeatherIcon(item.iconCode, 24)}
                </View>
                <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                <Text style={styles.hourlyDesc}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Detailed Stats */}
        <Text style={styles.sectionTitle}>天气详情</Text>
        <View style={styles.statsGrid}>
          {/* Card 1: Humidity */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Droplets size={16} color="#7F8C8D" />
              <Text style={styles.statLabel}>湿度</Text>
            </View>
            <Text style={styles.statValue}>{current.humidity}%</Text>
            <Text style={styles.statSubText}>体感 {current.feelsLike}°C</Text>
          </View>

          {/* Card 2: Wind */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Wind size={16} color="#7F8C8D" />
              <Text style={styles.statLabel}>风速</Text>
            </View>
            <Text style={styles.statValue}>{current.windSpeed} m/s</Text>
            <Text style={styles.statSubText}>风向角度 {current.weatherId}°</Text>
          </View>

          {/* Card 3: Sunrise/Sunset */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Sunrise size={16} color="#7F8C8D" />
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
              <Compass size={16} color="#7F8C8D" />
              <Text style={styles.statLabel}>气压</Text>
            </View>
            <Text style={styles.statValue}>{current.pressure} hPa</Text>
            <Text style={styles.statSubText}>适宜</Text>
          </View>
        </View>

        {/* 5-Day Forecast */}
        <Text style={styles.sectionTitle}>5天预报</Text>
        <View style={styles.cardMedium}>
          {daily.map((item, idx) => (
            <View key={idx} style={[styles.dailyRow, idx === daily.length - 1 && styles.noBorder]}>
              <View style={styles.dailyDayContainer}>
                <Text style={styles.dailyDay}>{item.dayName}</Text>
                <Text style={styles.dailyDate}>{item.dateStr}</Text>
              </View>
              
              <View style={styles.dailyStatusContainer}>
                {renderWeatherIcon(item.iconCode, 20)}
                <Text style={styles.dailyDesc}>{item.description}</Text>
              </View>

              <View style={styles.dailyTempRange}>
                <Text style={styles.dailyTempMin}>{item.tempMin}°</Text>
                <Text style={styles.dailyTempDivider}>/</Text>
                <Text style={styles.dailyTempMax}>{item.tempMax}°</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 0.5,
  },
  searchSection: {
    marginBottom: 20,
    zIndex: 999,
    position: 'relative',
  },
  cardBig: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardMedium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E24',
  },
  dateText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 4,
  },
  weatherIconContainer: {
    padding: 6,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  tempText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#1E1E24',
    lineHeight: 68,
  },
  conditionContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  conditionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  rangeText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  hourlyScroll: {
    paddingHorizontal: 2,
  },
  hourlyItem: {
    alignItems: 'center',
    width: 64,
    marginRight: 12,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  hourlyIcon: {
    marginBottom: 6,
  },
  hourlyTemp: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E24',
  },
  hourlyDesc: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: '48%',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E24',
  },
  statSubText: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
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
    color: '#1E1E24',
  },
  dailyDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 2,
  },
  dailyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  dailyDesc: {
    fontSize: 13,
    color: '#2C3E50',
    marginLeft: 8,
  },
  dailyTempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  dailyTempMin: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  dailyTempDivider: {
    fontSize: 12,
    color: '#BDC3C7',
    marginHorizontal: 4,
  },
  dailyTempMax: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1E24',
    textAlign: 'left',
  },
});
