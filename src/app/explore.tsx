import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Alert, 
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  CloudSun, 
  Cpu, 
  Save, 
  RotateCcw,
  Sliders,
  CheckCircle2
} from 'lucide-react-native';
import { 
  loadSettings, 
  saveSettings, 
  DEFAULT_SETTINGS, 
  AppSettings 
} from '../services/settingsService';
import InteractiveButton from '../components/InteractiveButton';

const POPULAR_MODELS = [
  { name: 'DeepSeek-V3', id: 'deepseek-ai/DeepSeek-V3' },
  { name: 'DeepSeek-R1', id: 'deepseek-ai/DeepSeek-R1' },
  { name: 'Ollama R1 (7B)', id: 'deepseek-r1:7b' },
  { name: 'Ollama Qwen (7B)', id: 'qwen2.5:7b' },
  { name: 'Ollama Llama3', id: 'llama3' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [weatherKeysStr, setWeatherKeysStr] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiEndpoint, setAiEndpoint] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('');
  const [aiKeysStr, setAiKeysStr] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  // Load configuration from AsyncStorage on mount
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const data = await loadSettings();
      setSettings(data);
      
      // Populate form states
      setWeatherKeysStr(data.weatherKeys.join(', '));
      setAiEnabled(data.aiEnabled);
      setAiEndpoint(data.aiEndpoint);
      setAiModel(data.aiModel);
      setAiKeysStr(data.aiKeys.join(', '));
      setAiPrompt(data.aiPrompt);
      
      setIsLoading(false);
    };
    fetchConfig();
  }, []);

  // Save Config
  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    
    // Parse key pools (split by comma and filter out empty strings)
    const weatherKeys = weatherKeysStr
      .split(',')
      .map(k => k.trim())
      .filter(k => k !== '');
      
    const aiKeys = aiKeysStr
      .split(',')
      .map(k => k.trim())
      .filter(k => k !== '');

    if (weatherKeys.length === 0) {
      Alert.alert('提示', '天气 API 密钥池不能为空！已为您恢复为系统默认天气 Key。');
      setIsSaving(false);
      return;
    }

    if (aiEnabled && aiKeys.length === 0) {
      Alert.alert('提示', '启用 AI 播报时，AI 密钥池不能为空！');
      setIsSaving(false);
      return;
    }

    const newSettings: AppSettings = {
      ...settings,
      weatherKeys,
      aiEnabled,
      aiEndpoint: aiEndpoint.trim(),
      aiModel: aiModel.trim(),
      aiKeys,
      aiPrompt: aiPrompt.trim(),
    };

    await saveSettings(newSettings);
    setSettings(newSettings);
    setIsSaving(false);

    if (Platform.OS === 'web') {
      alert('🎉 系统设置已成功保存！密钥负载均衡已实时生效。');
    } else {
      Alert.alert('成功', '🎉 系统设置已保存！密钥负载均衡已实时生效。');
    }
  };

  // Restore Defaults
  const handleRestoreDefaults = () => {
    const restore = async () => {
      setIsSaving(true);
      await saveSettings(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
      
      // Reset form states
      setWeatherKeysStr(DEFAULT_SETTINGS.weatherKeys.join(', '));
      setAiEnabled(DEFAULT_SETTINGS.aiEnabled);
      setAiEndpoint(DEFAULT_SETTINGS.aiEndpoint);
      setAiModel(DEFAULT_SETTINGS.aiModel);
      setAiKeysStr(DEFAULT_SETTINGS.aiKeys.join(', '));
      setAiPrompt(DEFAULT_SETTINGS.aiPrompt);
      
      setIsSaving(false);
      
      if (Platform.OS === 'web') {
        alert('🔄 已成功恢复为系统出厂默认配置！');
      } else {
        Alert.alert('重置成功', '🔄 已恢复系统出厂默认配置！');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('您确定要清空当前所有设置，恢复到系统最初的天气 API 和大模型默认配置吗？')) {
        restore();
      }
    } else {
      Alert.alert(
        '确认重置',
        '您确定要清空当前所有设置，恢复到系统最初的天气 API 和大模型默认配置吗？',
        [
          { text: '取消', style: 'cancel' },
          { text: '恢复默认', style: 'destructive', onPress: restore }
        ]
      );
    }
  };

  if (isLoading || !settings) {
    return (
      <LinearGradient colors={['#051c24', '#083842']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b080" />
        <Text style={styles.loadingText}>正在加载系统配置...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#051c24', '#083842']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Title */}
          <View style={styles.header}>
            <Settings size={26} color="#00b080" style={{ marginRight: 10 }} />
            <Text style={styles.titleText}>拟鑫天气 - 系统设置</Text>
          </View>
          <Text style={styles.subtitleText}>在这里定制您的天气与 AI 密钥，支持多路负载均衡自动灾备。</Text>

          {/* Section 1: Weather Config */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <CloudSun size={20} color="#00b080" />
              <Text style={styles.cardTitle}>🌦️ 天气服务密钥配置</Text>
            </View>
            
            <Text style={styles.label}>OpenWeatherMap API Key 池 (支持逗号分隔多个 Key 灾备):</Text>
            <TextInput
              style={styles.textInput}
              value={weatherKeysStr}
              onChangeText={setWeatherKeysStr}
              placeholder="请输入 OpenWeatherMap API Key"
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
            />
            
            {/* Failover Status Badge */}
            <View style={styles.statusBadge}>
              <CheckCircle2 size={14} color="#00b080" style={{ marginRight: 6 }} />
              <Text style={styles.statusText}>
                多密钥负载均衡已激活 (共 {settings.weatherKeys.length} 个密钥，当前运行第 {settings.activeWeatherIndex + 1} 个)
              </Text>
            </View>
          </View>

          {/* Section 2: AI Weather Teller Config */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Cpu size={20} color="#00b080" />
              <Text style={styles.cardTitle}>🤖 AI 骚话天气播报员</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#00b080' }}
                thumbColor={aiEnabled ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setAiEnabled}
                value={aiEnabled}
                style={styles.switch}
              />
            </View>

            {aiEnabled && (
              <View style={styles.aiForm}>
                <Text style={styles.label}>大模型 API 接口地址 (支持兼容 OpenAI 接口):</Text>
                <TextInput
                  style={styles.textInputSingle}
                  value={aiEndpoint}
                  onChangeText={setAiEndpoint}
                  placeholder="https://ollama.com/v1/chat/completions"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />

                <Text style={styles.label}>指定模型名称 (Model Name):</Text>
                <TextInput
                  style={styles.textInputSingle}
                  value={aiModel}
                  onChangeText={setAiModel}
                  placeholder="deepseek-ai/DeepSeek-V3"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />

                {/* Popular Models Quick Select */}
                <View style={styles.pillsContainer}>
                  {POPULAR_MODELS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.pill,
                        aiModel === item.id && styles.pillActive
                      ]}
                      onPress={() => setAiModel(item.id)}
                    >
                      <Text style={[
                        styles.pillText,
                        aiModel === item.id && styles.pillTextActive
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>AI API Key 池 (支持逗号分隔多个 Key 自动灾备):</Text>
                <TextInput
                  style={styles.textInput}
                  value={aiKeysStr}
                  onChangeText={setAiKeysStr}
                  placeholder="请输入兼容大模型的 API Key"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                />

                {/* AI Failover Status Badge */}
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={14} color="#00b080" style={{ marginRight: 6 }} />
                  <Text style={styles.statusText}>
                    AI负载均衡已激活 (共 {settings.aiKeys.length} 个密钥，当前运行第 {settings.activeAiIndex + 1} 个)
                  </Text>
                </View>

                <Text style={styles.label}>自定义 AI 系统 Prompt (定制您喜欢的幽默风格):</Text>
                <TextInput
                  style={[styles.textInput, styles.promptInput]}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  numberOfLines={4}
                  placeholder="在这里输入您的 AI 指导语..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            )}

            {!aiEnabled && (
              <View style={styles.disabledPanel}>
                <Text style={styles.disabledText}>AI 骚话天气播报员已关闭，首页和通知栏将只展示常规气象数据。</Text>
              </View>
            )}
          </View>

          {/* Section 3: Tactile Action Buttons */}
          <View style={styles.actionRow}>
            <InteractiveButton 
              onPress={handleRestoreDefaults} 
              style={[styles.btn, styles.btnReset]}
            >
              <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>恢复默认</Text>
            </InteractiveButton>

            <InteractiveButton 
              onPress={handleSave} 
              style={[styles.btn, styles.btnSave]}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>保存配置</Text>
                </>
              )}
            </InteractiveButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 96, 0.25)', // Glowing emerald cyan border
    shadowColor: '#00F260',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      }
    })
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textInputSingle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    marginBottom: 14,
  },
  promptInput: {
    minHeight: 90,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 96, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 242, 96, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  statusText: {
    color: '#00F260',
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  aiForm: {
    marginTop: 4,
  },
  disabledPanel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnReset: {
    backgroundColor: '#E74C3C',
  },
  btnSave: {
    backgroundColor: '#00b080',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: -4,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pillActive: {
    backgroundColor: 'rgba(0, 176, 128, 0.15)',
    borderColor: '#00b080',
  },
  pillText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#00b080',
    fontWeight: 'bold',
  },
});
