import { loadSettings, failoverWeatherKey } from './settingsService';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export interface CityInfo {
  name: string;
  chineseName: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  description: string;
  iconCode: string;
  cityName: string;
  dt: number;
  sunrise: number;
  sunset: number;
  weatherId: number;
}

export interface HourlyForecast {
  time: string; // e.g. "15:00" or "现在"
  temp: number;
  iconCode: string;
  description: string;
}

export interface DailyForecast {
  dayName: string; // e.g. "周一"
  dateStr: string; // e.g. "05/23"
  tempMin: number;
  tempMax: number;
  iconCode: string;
  description: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

// Map English day to Chinese week day
const getChineseWeekDay = (date: Date): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

// Map OpenWeather Icon to description translations
export const getLucideIconName = (iconCode: string): string => {
  switch (iconCode.slice(0, 2)) {
    case '01':
      return 'Sun'; // clear sky
    case '02':
      return 'CloudSun'; // few clouds
    case '03':
      return 'Cloud'; // scattered clouds
    case '04':
      return 'Cloudy'; // broken/overcast clouds
    case '09':
      return 'CloudDrizzle'; // shower rain
    case '10':
      return 'CloudRain'; // rain
    case '11':
      return 'CloudLightning'; // thunderstorm
    case '13':
      return 'Snowflake'; // snow
    case '50':
      return 'Wind'; // mist/fog
    default:
      return 'Cloud';
  }
};

/**
 * A highly resilient fetch wrapper that implements automated failover round-robin 
 * on the OpenWeatherMap API keys pool.
 */
const fetchWithFailover = async (urlBuilder: (key: string) => string): Promise<any> => {
  const settings = await loadSettings();
  const maxRetries = settings.weatherKeys.length;
  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    const activeSettings = await loadSettings();
    const activeKey = activeSettings.weatherKeys[activeSettings.activeWeatherIndex];
    const url = urlBuilder(activeKey);

    try {
      const response = await fetch(url);
      
      // If key is invalid (401) or rate-limited (429), trigger failover instantly
      if (response.status === 401 || response.status === 429) {
        throw new Error(`Weather API returned Status Code: ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(`Weather API HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Weather API call failed (Attempt ${currentRetry + 1}/${maxRetries}):`, error);
      currentRetry++;
      if (currentRetry < maxRetries) {
        // Shift index to the next available API Key!
        await failoverWeatherKey();
      } else {
        throw error;
      }
    }
  }
  throw new Error('所有天气 API 密钥均已失效，请在 [设置] 中检查并更新您的天气 Key 池！');
};

/**
 * Searches for cities by name using OpenWeather Geocoding API with failover support
 */
export const searchCity = async (query: string): Promise<CityInfo[]> => {
  if (!query || query.trim() === '') return [];
  try {
    const data = await fetchWithFailover((key) => 
      `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${key}`
    );
    return data.map((item: any) => {
      const chineseName = item.local_names?.zh || item.local_names?.zh_cn || item.name;
      return {
        name: item.name,
        chineseName,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
        state: item.state,
      };
    });
  } catch (error) {
    console.error('searchCity error:', error);
    throw error;
  }
};

/**
 * Reverse geocoding to find city name from coordinates using OpenWeather API with failover support
 */
export const getCityByCoords = async (lat: number, lon: number): Promise<CityInfo> => {
  try {
    const data = await fetchWithFailover((key) => 
      `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`
    );
    if (data && data.length > 0) {
      const item = data[0];
      const chineseName = item.local_names?.zh || item.local_names?.zh_cn || item.name;
      return {
        name: item.name,
        chineseName,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
        state: item.state,
      };
    }
    return {
      name: 'Located Area',
      chineseName: '定位区域',
      lat,
      lon,
      country: 'CN',
    };
  } catch (error) {
    console.error('getCityByCoords error:', error);
    return {
      name: 'Located Area',
      chineseName: '定位区域',
      lat,
      lon,
      country: 'CN',
    };
  }
};

/**
 * Fetches current weather and 5-day forecast, compiling it into a unified WeatherData object with failover support
 */
export const fetchWeatherData = async (city: CityInfo): Promise<WeatherData> => {
  const { lat, lon, chineseName } = city;
  try {
    // 1. Fetch Current Weather
    const currentRaw = await fetchWithFailover((key) => 
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=zh_cn`
    );

    const current: CurrentWeather = {
      temp: Math.round(currentRaw.main.temp),
      feelsLike: Math.round(currentRaw.main.feels_like),
      tempMin: Math.round(currentRaw.main.temp_min),
      tempMax: Math.round(currentRaw.main.temp_max),
      humidity: currentRaw.main.humidity,
      pressure: currentRaw.main.pressure,
      windSpeed: Number(currentRaw.wind.speed.toFixed(1)),
      description: currentRaw.weather[0]?.description || '未知',
      iconCode: currentRaw.weather[0]?.icon || '02d',
      cityName: chineseName,
      dt: currentRaw.dt,
      sunrise: currentRaw.sys.sunrise,
      sunset: currentRaw.sys.sunset,
      weatherId: currentRaw.weather[0]?.id || 800,
    };

    // 2. Fetch Forecast
    const forecastRaw = await fetchWithFailover((key) => 
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=zh_cn`
    );

    const list: any[] = forecastRaw.list;

    // 3. Compile Hourly Forecast (First 8 intervals = 24 Hours)
    const hourly: HourlyForecast[] = list.slice(0, 8).map((item: any, idx: number) => {
      const date = new Date(item.dt * 1000);
      const timeStr = idx === 0 ? '现在' : `${date.getHours().toString().padStart(2, '0')}:00`;
      return {
        time: timeStr,
        temp: Math.round(item.main.temp),
        iconCode: item.weather[0]?.icon || '02d',
        description: item.weather[0]?.description || '未知',
      };
    });

    // 4. Compile Daily Forecast (Group by date, maximum 5 days)
    const dailyMap: { [dateStr: string]: any[] } = {};
    list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = [];
      }
      dailyMap[dateKey].push(item);
    });

    const daily: DailyForecast[] = Object.keys(dailyMap).map((dateKey) => {
      const items = dailyMap[dateKey];
      
      let tempMin = Infinity;
      let tempMax = -Infinity;
      items.forEach((item) => {
        if (item.main.temp_min < tempMin) tempMin = item.main.temp_min;
        if (item.main.temp_max > tempMax) tempMax = item.main.temp_max;
      });

      let noonItem = items[0];
      items.forEach((item) => {
        const itemDate = new Date(item.dt * 1000);
        if (itemDate.getHours() === 12) {
          noonItem = item;
        }
      });

      const dayDate = new Date(noonItem.dt * 1000);
      
      return {
        dayName: getChineseWeekDay(dayDate),
        dateStr: dateKey,
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        iconCode: noonItem.weather[0]?.icon || '02d',
        description: noonItem.weather[0]?.description || '未知',
      };
    });

    const finalDaily = daily.slice(0, 5);

    return {
      current,
      hourly,
      daily: finalDaily,
    };
  } catch (error) {
    console.error('fetchWeatherData error:', error);
    throw error;
  }
};
