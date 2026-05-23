import { loadSettings, failoverAiKey } from './settingsService';

/**
 * Generates an LLM-powered humorous commentary ("trash talk") about the current weather.
 * Supports automated failover to next key in settings.aiKeys pool if quota runs out or rate limits hit.
 */
export const generateWeatherComment = async (
  cityName: string,
  temp: number,
  description: string,
  tempMin: number,
  tempMax: number,
  humidity: number,
  windSpeed: number
): Promise<string> => {
  const settings = await loadSettings();
  if (!settings.aiEnabled) {
    return '';
  }

  // Allow up to settings.aiKeys.length total tries (one try per available API key)
  const maxRetries = settings.aiKeys.length;
  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    // Reload settings inside the loop to ensure we use the newly failovered key index
    const activeSettings = await loadSettings();
    const activeKey = activeSettings.aiKeys[activeSettings.activeAiIndex];
    const endpoint = activeSettings.aiEndpoint;
    const model = activeSettings.aiModel;
    const prompt = activeSettings.aiPrompt;

    console.log(`[AI Request] Requesting completion using Key index ${activeSettings.activeAiIndex} and Model ${model}...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: prompt,
            },
            {
              role: 'user',
              content: `今日天气详情 - 城市: ${cityName}, 当前温度: ${temp}°C, 天气概况: ${description}, 温度区间: ${tempMin}°C ~ ${tempMax}°C, 湿度: ${humidity}%, 风速: ${windSpeed} m/s。`,
            },
          ],
          temperature: 0.85,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API response error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const content = responseData.choices?.[0]?.message?.content;
      if (content && content.trim() !== '') {
        return content.trim();
      } else {
        throw new Error('AI API returned empty message content.');
      }
    } catch (error: any) {
      console.error(`AI API call failed (Attempt ${currentRetry + 1}/${maxRetries}):`, error);
      currentRetry++;
      if (currentRetry < maxRetries) {
        // Trigger automatic key rotation!
        await failoverAiKey();
      }
    }
  }

  return '本AI气象官的额度已被彻底榨干（所有Key皆失效），请速前往 [设置] 页面添加有效密钥！';
};
export default generateWeatherComment;
