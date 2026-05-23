import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

// Render Weather Icon in clay/neomorphic colors
const renderWeatherIcon = (iconCode: string, size: number) => {
  const iconName = getLucideIconName(iconCode);
  // Soft, contrasty neomorphic colors
  const color = '#4F5D75';
  const props = { size, color };
  switch (iconName) {
    case 'Sun': return <Sun {...props} color="#FF9F1C" />; // Sunny is gold
    case 'CloudSun': return <Cloud {...props} color="#4F5D75" />;
    case 'Cloud': return <Cloud {...props} color="#7D8C9E" />;
    case 'Cloudy': return <Cloudy {...props} color="#6C7A89" />;
    case 'CloudDrizzle': return <CloudDrizzle {...props} color="#5D8AA8" />;
    case 'CloudRain': return <CloudRain {...props} color="#2D5F7C" />;
    case 'CloudLightning': return <CloudLightning {...props} color="#D9A05B" />;
    case 'Snowflake': return <Snowflake {...props} color="#95B9C7" />;
    case 'Wind': return <Wind {...props} color="#507B93" />;
    default: return <Cloud {...props} />;
  }
};

export default function NeomorphicTheme({ data, themeToggle, searchBar, aiComment }: ThemeProps) {
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

        {/* Current Weather Card with Double Neomorphic Shadows */}
        <View style={styles.neoCardBigOuter}>
          <View style={styles.neoCardBigInner}>
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
              <View style={styles.weatherIconContainerOuter}>
                <View style={styles.weatherIconContainerInner}>
                  {renderWeatherIcon(current.iconCode, 64)}
                </View>
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
        </View>

        {/* AI Weather Commentary Card (Neomorphic Style) */}
        {aiComment ? (
          <View style={[styles.neoCardMediumOuter, { marginBottom: 20 }]}>
            <View style={[styles.neoCardMediumInner, { paddingVertical: 14, paddingHorizontal: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  padding: 4, 
                  borderRadius: 8, 
                  backgroundColor: '#E0E5EC',
                  shadowColor: '#A3B1C6',
                  shadowOffset: { width: 1, height: 1 },
                  shadowOpacity: 0.8,
                  shadowRadius: 2,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: '#FFFFFF',
                }}>
                  <Cpu size={14} color="#FF9F1C" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4F5D75', letterSpacing: 0.5 }}>🤖 智能 AI 骚话点评</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#333A42', lineHeight: 18, fontWeight: '500' }}>
                {aiComment}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 24-Hour Forecast */}
        <Text style={styles.sectionTitle}>24小时预报</Text>
        <View style={styles.neoCardMediumOuter}>
          <View style={styles.neoCardMediumInner}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
              {hourly.map((item, idx) => (
                <View key={idx} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>{item.time}</Text>
                  <View style={styles.hourlyIconOuter}>
                    <View style={styles.hourlyIconInner}>
                      {renderWeatherIcon(item.iconCode, 24)}
                    </View>
                  </View>
                  <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                  <Text style={styles.hourlyDesc}>{item.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Detailed Stats Grid */}
        <Text style={styles.sectionTitle}>天气详情</Text>
        <View style={styles.statsGrid}>
          {/* Card 1: Humidity */}
          <View style={styles.statCardOuter}>
            <View style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <Droplets size={16} color="#606A7C" />
                <Text style={styles.statLabel}>湿度</Text>
              </View>
              <Text style={styles.statValue}>{current.humidity}%</Text>
              <Text style={styles.statSubText}>体感 {current.feelsLike}°C</Text>
            </View>
          </View>

          {/* Card 2: Wind */}
          <View style={styles.statCardOuter}>
            <View style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <Wind size={16} color="#606A7C" />
                <Text style={styles.statLabel}>风速</Text>
              </View>
              <Text style={styles.statValue}>{current.windSpeed} m/s</Text>
              <Text style={styles.statSubText}>风向角 {current.weatherId}°</Text>
            </View>
          </View>

          {/* Card 3: Sunrise/Sunset */}
          <View style={styles.statCardOuter}>
            <View style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <Sunrise size={16} color="#606A7C" />
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
          </View>

          {/* Card 4: Pressure */}
          <View style={styles.statCardOuter}>
            <View style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <Compass size={16} color="#606A7C" />
                <Text style={styles.statLabel}>气压</Text>
              </View>
              <Text style={styles.statValue}>{current.pressure} hP</Text>
              <Text style={styles.statSubText}>舒适高度</Text>
            </View>
          </View>
        </View>

        {/* 5-Day Forecast */}
        <Text style={styles.sectionTitle}>5天预报</Text>
        <View style={styles.neoCardMediumOuter}>
          <View style={styles.neoCardMediumInner}>
            {daily.map((item, idx) => (
              <View key={idx} style={[styles.dailyRow, idx === daily.length - 1 && styles.noBorder]}>
                <View style={styles.dailyDayContainer}>
                  <Text style={styles.dailyDay}>{item.dayName}</Text>
                  <Text style={styles.dailyDate}>{item.dateStr}</Text>
                </View>
                
                <View style={styles.dailyStatusContainer}>
                  <View style={styles.dailyIconOuter}>
                    <View style={styles.dailyIconInner}>
                      {renderWeatherIcon(item.iconCode, 20)}
                    </View>
                  </View>
                  <Text style={styles.dailyDesc}>{item.description}</Text>
                </View>

                <View style={styles.dailyTempRange}>
                  <Text style={styles.dailyTempMin}>{item.tempMin}°</Text>
                  <View style={styles.tempBarContainerOuter}>
                    <View style={styles.tempBarContainerInner}>
                      <View style={styles.tempBar} />
                    </View>
                  </View>
                  <Text style={styles.dailyTempMax}>{item.tempMax}°</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5EC',
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
    color: '#31363F',
  },
  searchSection: {
    marginBottom: 20,
  },
  // Double shadows for Big Neomorphic Card
  neoCardBigOuter: {
    backgroundColor: '#E0E5EC',
    borderRadius: 24,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  neoCardBigInner: {
    backgroundColor: '#E0E5EC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  // Double shadows for Medium Neomorphic Card
  neoCardMediumOuter: {
    backgroundColor: '#E0E5EC',
    borderRadius: 24,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  neoCardMediumInner: {
    backgroundColor: '#E0E5EC',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333A42',
  },
  dateText: {
    fontSize: 14,
    color: '#7D8A99',
    marginTop: 4,
  },
  // Sunken neomorphic container for big weather icon
  weatherIconContainerOuter: {
    borderRadius: 20,
    backgroundColor: '#E0E5EC',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  weatherIconContainerInner: {
    borderRadius: 20,
    backgroundColor: '#E0E5EC',
    padding: 10,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  tempText: {
    fontSize: 68,
    fontWeight: '300',
    color: '#333A42',
    lineHeight: 72,
  },
  conditionContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  conditionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4F5D75',
  },
  rangeText: {
    fontSize: 13,
    color: '#7D8A99',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333A42',
    marginBottom: 12,
    marginLeft: 4,
  },
  hourlyScroll: {
    paddingHorizontal: 4,
  },
  hourlyItem: {
    alignItems: 'center',
    width: 72,
    marginRight: 12,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#7D8A99',
    marginBottom: 8,
  },
  // Sunken icon container for hourly items
  hourlyIconOuter: {
    borderRadius: 14,
    backgroundColor: '#E0E5EC',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    marginBottom: 8,
  },
  hourlyIconInner: {
    borderRadius: 14,
    backgroundColor: '#E0E5EC',
    padding: 6,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333A42',
    marginBottom: 2,
  },
  hourlyDesc: {
    fontSize: 10,
    color: '#7D8A99',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCardOuter: {
    width: '48%',
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  statCardInner: {
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#606A7C',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333A42',
  },
  statSubText: {
    fontSize: 10,
    color: '#7D8A99',
    marginTop: 4,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D9E6',
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
    color: '#333A42',
  },
  dailyDate: {
    fontSize: 11,
    color: '#7D8A99',
    marginTop: 2,
  },
  dailyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  dailyIconOuter: {
    borderRadius: 10,
    backgroundColor: '#E0E5EC',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
  },
  dailyIconInner: {
    borderRadius: 10,
    backgroundColor: '#E0E5EC',
    padding: 4,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -1.5, height: -1.5 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: '#F0F3F7',
  },
  dailyDesc: {
    fontSize: 13,
    color: '#333A42',
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
    color: '#7D8A99',
    width: 25,
    textAlign: 'right',
  },
  dailyTempMax: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333A42',
    width: 25,
    textAlign: 'left',
  },
  // Sunken temperature bar
  tempBarContainerOuter: {
    flex: 1,
    marginHorizontal: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E5EC',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 1.5,
  },
  tempBarContainerInner: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#E0E5EC',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.9,
    shadowRadius: 1.5,
    overflow: 'hidden',
  },
  tempBar: {
    height: '100%',
    width: '65%',
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#4F5D75',
  },
});
