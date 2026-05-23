import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // Weather API Keys
  weatherKeys: string[];
  activeWeatherIndex: number;
  
  // AI API Configs
  aiEnabled: boolean;
  aiEndpoint: string;
  aiModel: string;
  aiKeys: string[];
  activeAiIndex: number;
  aiPrompt: string;
}

const STORAGE_KEY = 'NIXIN_WEATHER_APP_SETTINGS';

export const DEFAULT_SETTINGS: AppSettings = {
  weatherKeys: ['dbc49d5f67580213ce6f79df25a38cb2'],
  activeWeatherIndex: 0,
  
  aiEnabled: true,
  aiEndpoint: 'https://ollama.com/v1/chat/completions',
  aiModel: 'deepseek-ai/DeepSeek-V3',
  aiKeys: ['c6c2da9ab7404675831eb2bda3b69c88.MSWN5AuYRTTiEu_ljGXhvJwg'],
  activeAiIndex: 0,
  aiPrompt: '你是一个幽默风趣、爱说骚话的天气播报员。请根据当前的天气数据，写一段幽默、风趣、带有一点点调侃或骚话的天气短评，字数限制在50字以内，必须保留核心天气信息（如温度和雨雪情况），体现出多变和幽默的特色。不要出现“好的”、“收到”等开场白，直接输出骚话内容。',
};

/**
 * Loads settings from AsyncStorage, merging with defaults if values are missing.
 */
export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue !== null) {
      const parsed = JSON.parse(jsonValue);
      // Clean and sanitize loaded arrays to make sure they are not empty
      const weatherKeys = (parsed.weatherKeys || []).filter((k: string) => k.trim() !== '');
      const aiKeys = (parsed.aiKeys || []).filter((k: string) => k.trim() !== '');
      
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        weatherKeys: weatherKeys.length > 0 ? weatherKeys : DEFAULT_SETTINGS.weatherKeys,
        aiKeys: aiKeys.length > 0 ? aiKeys : DEFAULT_SETTINGS.aiKeys,
      };
    }
  } catch (e) {
    console.error('loadSettings failed:', e);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Saves settings to AsyncStorage.
 */
export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    // Sanitize keys before saving
    settings.weatherKeys = settings.weatherKeys.map(k => k.trim()).filter(k => k !== '');
    settings.aiKeys = settings.aiKeys.map(k => k.trim()).filter(k => k !== '');
    
    if (settings.weatherKeys.length === 0) settings.weatherKeys = DEFAULT_SETTINGS.weatherKeys;
    if (settings.aiKeys.length === 0) settings.aiKeys = DEFAULT_SETTINGS.aiKeys;
    
    // Bounds check index
    if (settings.activeWeatherIndex >= settings.weatherKeys.length) {
      settings.activeWeatherIndex = 0;
    }
    if (settings.activeAiIndex >= settings.aiKeys.length) {
      settings.activeAiIndex = 0;
    }

    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('saveSettings failed:', e);
  }
};

/**
 * Moves to the next Weather key in the pool (failover load balancing).
 */
export const failoverWeatherKey = async (): Promise<string> => {
  const settings = await loadSettings();
  const poolSize = settings.weatherKeys.length;
  if (poolSize <= 1) {
    return settings.weatherKeys[0];
  }
  
  const oldIndex = settings.activeWeatherIndex;
  const newIndex = (oldIndex + 1) % poolSize;
  settings.activeWeatherIndex = newIndex;
  
  await saveSettings(settings);
  console.log(`[Load Balance] Weather Key failover triggered! Switched from index ${oldIndex} to ${newIndex}`);
  return settings.weatherKeys[newIndex];
};

/**
 * Moves to the next AI key in the pool (failover load balancing).
 */
export const failoverAiKey = async (): Promise<string> => {
  const settings = await loadSettings();
  const poolSize = settings.aiKeys.length;
  if (poolSize <= 1) {
    return settings.aiKeys[0];
  }
  
  const oldIndex = settings.activeAiIndex;
  const newIndex = (oldIndex + 1) % poolSize;
  settings.activeAiIndex = newIndex;
  
  await saveSettings(settings);
  console.log(`[Load Balance] AI Key failover triggered! Switched from index ${oldIndex} to ${newIndex}`);
  return settings.aiKeys[newIndex];
};
