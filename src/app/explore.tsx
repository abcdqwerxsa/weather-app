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
import { useAppTheme } from '../services/themeContext';
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

  const { activeTheme, setActiveTheme } = useAppTheme();
  
  // Dynamic models fetch states
  const [modelList, setModelList] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

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

  // Fetch dynamic models list from the configured completions endpoint
  const handleFetchModels = async () => {
    if (!aiEndpoint) {
      if (Platform.OS === 'web') {
        alert('提示: 请先填写大模型 API 接口地址！');
      } else {
        Alert.alert('提示', '请先填写大模型 API 接口地址！');
      }
      return;
    }
    setIsFetchingModels(true);
    try {
      const firstKey = aiKeysStr.split(',')[0]?.trim() || '';
      
      let modelsUrl = aiEndpoint.trim().replace('/chat/completions', '/models');
      console.log(`[Models API] Fetching from ${modelsUrl}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (firstKey) {
        headers['Authorization'] = `Bearer ${firstKey}`;
      }

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          const models = data.data.map((m: any) => m.id);
          setModelList(models);
          setShowDropdown(true);
          if (Platform.OS === 'web') {
            alert(`🎉 成功获取了 ${models.length} 个可用大模型！已在下拉框为您展示。`);
          } else {
            Alert.alert('获取成功', `🎉 成功获取了 ${models.length} 个可用大模型！已在下拉框为您展示。`);
          }
          return;
        }
      }
      
      // Local Ollama backup
      if (aiEndpoint.includes('localhost') || aiEndpoint.includes('127.0.0.1')) {
        const ollamaTagsUrl = aiEndpoint.split('/v1')[0] + '/api/tags';
        const ollamaRes = await fetch(ollamaTagsUrl);
        if (ollamaRes.ok) {
          const ollamaData = await ollamaRes.json();
          if (Array.isArray(ollamaData.models)) {
            const models = ollamaData.models.map((m: any) => m.name);
            setModelList(models);
            setShowDropdown(true);
            if (Platform.OS === 'web') {
              alert(`🎉 成功获取了 ${models.length} 个本地 Ollama 模型！已在下拉框为您展示。`);
            } else {
              Alert.alert('获取成功', `🎉 成功获取了 ${models.length} 个本地 Ollama 模型！已在下拉框为您展示。`);
            }
            return;
          }
        }
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (err: any) {
      console.error(err);
      if (Platform.OS === 'web') {
        alert(`❌ 自动获取大模型列表失败，请检查您的接口地址与 Key 是否正确。已为您切换展示系统预置热门模型。\n(错误详情: ${err.message || err})`);
      } else {
        Alert.alert('获取失败', `❌ 自动获取大模型列表失败，请检查您的接口地址与 Key 是否正确。已为您切换展示系统预置热门模型。\n(错误详情: ${err.message || err})`);
      }
      setModelList(POPULAR_MODELS.map(m => m.id));
      setShowDropdown(true);
    } finally {
      setIsFetchingModels(false);
    }
  };

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

  const isGlass = activeTheme === 'glass';
  const isNeo = activeTheme === 'neo';
  const isMinimal = activeTheme === 'minimal';

  // Dynamic colors
  const containerColors = (isGlass 
    ? ['#071521', '#0B2332'] 
    : isNeo 
      ? ['#E0E5EC', '#E0E5EC'] 
      : ['#FAFAFA', '#FAFAFA']) as readonly [string, string, ...string[]];

  const containerStyle = [
    styles.container,
    isNeo && { backgroundColor: '#E0E5EC' },
    isMinimal && { backgroundColor: '#FAFAFA' }
  ];

  const cardStyle = isGlass ? styles.glassCard : isNeo ? styles.neoCard : styles.minimalCard;
  const inputStyle = isGlass ? styles.textInput : isNeo ? styles.neoTextInput : styles.minimalTextInput;
  const inputStyleSingle = isGlass ? styles.textInputSingle : isNeo ? styles.neoTextInputSingle : styles.minimalTextInputSingle;
  const textColor = isGlass ? '#FFFFFF' : isNeo ? '#333A42' : '#1E1E24';
  const subtextColor = isGlass ? 'rgba(255, 255, 255, 0.65)' : isNeo ? '#7D8A99' : '#64748B';
  const labelColor = isGlass ? 'rgba(255, 255, 255, 0.75)' : isNeo ? '#4F5D75' : '#475569';
  const themeColor = isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24';

  if (isLoading || !settings) {
    return (
      <LinearGradient colors={(isGlass ? ['#051c24', '#083842'] : isNeo ? ['#E0E5EC', '#E0E5EC'] : ['#FAFAFA', '#FAFAFA']) as readonly [string, string, ...string[]]} style={[styles.loadingContainer, !isGlass && { backgroundColor: isNeo ? '#E0E5EC' : '#FAFAFA' }]}>
        <ActivityIndicator size="large" color={isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24'} />
        <Text style={[styles.loadingText, { color: textColor }]}>正在加载系统配置...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={containerColors} style={containerStyle}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Title */}
          <View style={styles.header}>
            <Settings size={26} color={themeColor} style={{ marginRight: 10 }} />
            <Text style={[styles.titleText, { color: textColor }]}>拟鑫天气 - 系统设置</Text>
          </View>
          <Text style={[styles.subtitleText, { color: subtextColor }]}>在这里定制您的天气与 AI 密钥，支持多路负载均衡自动灾备。</Text>

          {/* Section 0: Theme Customization */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <Sliders size={20} color={themeColor} />
              <Text style={[styles.cardTitle, { color: textColor }]}>🎨 主题视觉风格定制</Text>
            </View>
            
            <Text style={[styles.label, { color: labelColor }]}>选择全局默认主题风格 (下次打开自动加载):</Text>
            
            <View style={styles.themeToggleRow}>
              {[
                { id: 'glass', label: '玻璃雾蒙蒙 (Glass)' },
                { id: 'neo', label: '实物微拟态 (Neomorphism)' },
                { id: 'minimal', label: '极简现代风 (Minimalist)' }
              ].map((t) => {
                const isSelected = activeTheme === t.id;
                return (
                  <InteractiveButton
                    key={t.id}
                    style={[
                      styles.themeToggleBtn,
                      isNeo && styles.themeToggleBtnNeo,
                      isMinimal && styles.themeToggleBtnMinimal,
                      isSelected && (
                        isGlass ? styles.themeToggleBtnActive : isNeo ? styles.themeToggleBtnNeoActive : styles.themeToggleBtnMinimalActive
                      )
                    ]}
                    onPress={() => setActiveTheme(t.id as any)}
                  >
                    <Text style={[
                      styles.themeToggleBtnText,
                      isNeo && { color: '#7D8A99' },
                      isMinimal && { color: '#64748B' },
                      isSelected && (
                        isGlass ? styles.themeToggleBtnTextActive : isNeo ? styles.themeToggleBtnTextNeoActive : styles.themeToggleBtnTextMinimalActive
                      )
                    ]}>
                      {t.label}
                    </Text>
                  </InteractiveButton>
                );
              })}
            </View>
          </View>

          {/* Section 1: Weather Config */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <CloudSun size={20} color={themeColor} />
              <Text style={[styles.cardTitle, { color: textColor }]}>🌦️ 天气服务密钥配置</Text>
            </View>
            
            <Text style={[styles.label, { color: labelColor }]}>OpenWeatherMap API Key 池 (支持逗号分隔多个 Key 灾备):</Text>
            <TextInput
              style={inputStyle}
              value={weatherKeysStr}
              onChangeText={setWeatherKeysStr}
              placeholder="请输入 OpenWeatherMap API Key"
              placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#A3B1C6'}
              multiline
            />
            
            {/* Failover Status Badge */}
            <View style={[styles.statusBadge, isNeo && styles.statusBadgeNeo, isMinimal && styles.statusBadgeMinimal]}>
              <CheckCircle2 size={14} color={isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24'} style={{ marginRight: 6 }} />
              <Text style={[styles.statusText, isGlass ? { color: '#00F260' } : isNeo ? { color: '#FF9F1C' } : { color: '#1E1E24' }]}>
                多密钥负载均衡已激活 (共 {settings.weatherKeys.length} 个密钥，当前运行第 {settings.activeWeatherIndex + 1} 个)
              </Text>
            </View>
          </View>

          {/* Section 2: AI Weather Teller Config */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <Cpu size={20} color={themeColor} />
              <Text style={[styles.cardTitle, { color: textColor }]}>🤖 AI 骚话天气播报员</Text>
              <Switch
                trackColor={{ false: '#767577', true: isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24' }}
                thumbColor={aiEnabled ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setAiEnabled}
                value={aiEnabled}
                style={styles.switch}
              />
            </View>

            {aiEnabled && (
              <View style={styles.aiForm}>
                <Text style={[styles.label, { color: labelColor }]}>大模型 API 接口地址 (支持兼容 OpenAI 接口):</Text>
                <TextInput
                  style={inputStyleSingle}
                  value={aiEndpoint}
                  onChangeText={setAiEndpoint}
                  placeholder="https://ollama.com/v1/chat/completions"
                  placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#A3B1C6'}
                />

                <Text style={[styles.label, { color: labelColor }]}>指定模型名称 (Model Name):</Text>
                <View style={{ position: 'relative', zIndex: 100, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[inputStyleSingle, { flex: 1, marginBottom: 0 }]}
                      value={aiModel}
                      onChangeText={setAiModel}
                      placeholder="deepseek-ai/DeepSeek-V3"
                      placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#A3B1C6'}
                      onFocus={() => setShowDropdown(true)}
                    />
                    <InteractiveButton
                      onPress={handleFetchModels}
                      style={[
                        styles.fetchModelsBtn,
                        isNeo && { backgroundColor: '#FF9F1C' },
                        isMinimal && { backgroundColor: '#1E1E24' }
                      ]}
                      disabled={isFetchingModels}
                    >
                      {isFetchingModels ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.fetchModelsBtnText}>获取列表</Text>
                      )}
                    </InteractiveButton>
                  </View>

                  {showDropdown && (modelList.length > 0 || POPULAR_MODELS.length > 0) && (
                    <View style={[
                      styles.dropdownListContainer,
                      isGlass ? styles.dropGlass : isNeo ? styles.dropNeo : styles.dropMinimal
                    ]}>
                      <ScrollView 
                        style={{ maxHeight: 180 }} 
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      >
                        {(modelList.length > 0 ? modelList : POPULAR_MODELS.map(m => m.id)).map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.dropdownItem,
                              aiModel === item && (isGlass ? styles.dropdownItemActive : isNeo ? styles.dropdownItemActiveNeo : styles.dropdownItemActiveMinimal)
                            ]}
                            onPress={() => {
                              setAiModel(item);
                              setShowDropdown(false);
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              { color: textColor },
                              aiModel === item && { color: themeColor, fontWeight: 'bold' }
                            ]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      
                      <TouchableOpacity
                        style={styles.closeDropdownBtn}
                        onPress={() => setShowDropdown(false)}
                      >
                        <Text style={[styles.closeDropdownText, isNeo && { color: '#FF9F1C' }, isMinimal && { color: '#1E1E24' }]}>收起列表 ↑</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Popular Models Quick Select */}
                <Text style={[styles.label, { color: labelColor, marginTop: 4 }]}>常见模型快捷点选 (本地 Ollama 或 SiliconFlow):</Text>
                <View style={styles.pillsContainer}>
                  {POPULAR_MODELS.map((item) => {
                    const isSelected = aiModel === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pill,
                          isNeo && styles.pillNeo,
                          isMinimal && styles.pillMinimal,
                          isSelected && (
                            isGlass ? styles.pillActive : isNeo ? styles.pillNeoActive : styles.pillMinimalActive
                          )
                        ]}
                        onPress={() => setAiModel(item.id)}
                      >
                        <Text style={[
                          styles.pillText,
                          isNeo && { color: '#7D8A99' },
                          isMinimal && { color: '#64748B' },
                          isSelected && (
                            isGlass ? styles.pillTextActive : isNeo ? styles.pillTextNeoActive : styles.pillTextMinimalActive
                          )
                        ]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { color: labelColor }]}>AI API Key 池 (支持逗号分隔多个 Key 自动灾备):</Text>
                <TextInput
                  style={inputStyle}
                  value={aiKeysStr}
                  onChangeText={setAiKeysStr}
                  placeholder="请输入兼容大模型的 API Key"
                  placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#A3B1C6'}
                  multiline
                />

                {/* AI Failover Status Badge */}
                <View style={[styles.statusBadge, isNeo && styles.statusBadgeNeo, isMinimal && styles.statusBadgeMinimal]}>
                  <CheckCircle2 size={14} color={isGlass ? '#00b080' : isNeo ? '#FF9F1C' : '#1E1E24'} style={{ marginRight: 6 }} />
                  <Text style={[styles.statusText, isGlass ? { color: '#00F260' } : isNeo ? { color: '#FF9F1C' } : { color: '#1E1E24' }]}>
                    AI负载均衡已激活 (共 {settings.aiKeys.length} 个密钥，当前运行第 {settings.activeAiIndex + 1} 个)
                  </Text>
                </View>

                <Text style={[styles.label, { color: labelColor }]}>自定义 AI 系统 Prompt (定制您喜欢的幽默风格):</Text>
                <TextInput
                  style={[inputStyle, styles.promptInput]}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  numberOfLines={4}
                  placeholder="在这里输入您的 AI 指导语..."
                  placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#A3B1C6'}
                />
              </View>
            )}

            {!aiEnabled && (
              <View style={styles.disabledPanel}>
                <Text style={[styles.disabledText, { color: subtextColor }]}>AI 骚话天气播报员已关闭，首页和通知栏将只展示常规气象数据。</Text>
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
    marginTop: 6,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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

  // Neomorphic card styles in explore.tsx
  neoCard: {
    backgroundColor: '#E0E5EC',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  neoTextInput: {
    backgroundColor: '#E0E5EC',
    borderRadius: 14,
    color: '#333A42',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -1.5, height: -1.5 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
  },
  neoTextInputSingle: {
    backgroundColor: '#E0E5EC',
    borderRadius: 14,
    color: '#333A42',
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -1.5, height: -1.5 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
  },

  // Minimalist card styles in explore.tsx
  minimalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  minimalTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    color: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  minimalTextInputSingle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    color: '#1E1E24',
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    marginBottom: 14,
  },

  // Dropdown list styles
  dropdownListContainer: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    zIndex: 9999,
  },
  dropGlass: {
    backgroundColor: 'rgba(5, 28, 36, 0.98)',
    borderColor: 'rgba(0, 242, 96, 0.35)',
  },
  dropNeo: {
    backgroundColor: '#E0E5EC',
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dropMinimal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(0, 176, 128, 0.15)',
  },
  dropdownItemActiveNeo: {
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
  },
  dropdownItemActiveMinimal: {
    backgroundColor: 'rgba(30, 30, 36, 0.1)',
  },
  dropdownItemText: {
    fontSize: 12.5,
  },
  dropdownItemTextActive: {
    color: '#00F260',
    fontWeight: 'bold',
  },
  closeDropdownBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
  },
  closeDropdownText: {
    color: '#00b080',
    fontSize: 11,
    fontWeight: '600',
  },
  fetchModelsBtn: {
    backgroundColor: '#00b080',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fetchModelsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Theme Toggle Row in Settings
  themeToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  themeToggleBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleBtnNeo: {
    backgroundColor: '#E0E5EC',
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  themeToggleBtnMinimal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  themeToggleBtnActive: {
    backgroundColor: 'rgba(0, 176, 128, 0.15)',
    borderColor: '#00b080',
  },
  themeToggleBtnNeoActive: {
    backgroundColor: '#E0E5EC',
    borderColor: '#FF9F1C',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -1.5, height: -1.5 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  themeToggleBtnMinimalActive: {
    backgroundColor: '#1E1E24',
    borderColor: '#1E1E24',
  },
  themeToggleBtnText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  themeToggleBtnTextActive: {
    color: '#00b080',
    fontWeight: 'bold',
  },
  themeToggleBtnTextNeoActive: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  themeToggleBtnTextMinimalActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Dynamic badge and text stylings
  statusBadgeNeo: {
    backgroundColor: 'rgba(255, 159, 28, 0.08)',
    borderColor: 'rgba(255, 159, 28, 0.25)',
  },
  statusBadgeMinimal: {
    backgroundColor: 'rgba(30, 30, 36, 0.05)',
    borderColor: 'rgba(30, 30, 36, 0.15)',
  },

  // Pills stylings
  pillNeo: {
    backgroundColor: '#E0E5EC',
    borderColor: '#FFFFFF',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  pillMinimal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  pillNeoActive: {
    backgroundColor: '#E0E5EC',
    borderColor: '#FF9F1C',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -1.5, height: -1.5 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  pillMinimalActive: {
    backgroundColor: '#1E1E24',
    borderColor: '#1E1E24',
  },
  pillTextNeoActive: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  pillTextMinimalActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
