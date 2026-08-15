import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Cpu,
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  AiProvider,
  GeminiKeyManager,
  GEMINI_MODELS,
  DEEPSEEK_MODELS,
} from '../lib/geminiKey';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [activeProvider, setActiveProvider] = useState<AiProvider>('gemini');

  // Gemini Form State
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.7-flash');

  // DeepSeek Form State
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');
  const [deepseekBaseUrl, setDeepseekBaseUrl] = useState('https://api.deepseek.com');
  const [showAdvancedDeepseek, setShowAdvancedDeepseek] = useState(false);

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Initialize state from localStorage
  useEffect(() => {
    if (isOpen) {
      const currentProvider = GeminiKeyManager.getProvider();
      setActiveProvider(currentProvider);
      setGeminiKey(GeminiKeyManager.getApiKey('gemini'));
      setGeminiModel(GeminiKeyManager.getModel('gemini'));
      setDeepseekKey(GeminiKeyManager.getApiKey('deepseek'));
      setDeepseekModel(GeminiKeyManager.getModel('deepseek'));
      setDeepseekBaseUrl(GeminiKeyManager.getBaseUrl('deepseek'));
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentKey = activeProvider === 'deepseek' ? deepseekKey : geminiKey;
  const currentModel = activeProvider === 'deepseek' ? deepseekModel : geminiModel;
  const hasConfiguredKey = GeminiKeyManager.hasCustomKey();

  const handleTestAndSave = async () => {
    if (!currentKey.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: `请先输入您的 ${activeProvider === 'deepseek' ? 'DeepSeek' : 'Google Gemini'} API Key。`,
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await GeminiKeyManager.validateKey({
      provider: activeProvider,
      key: currentKey.trim(),
      model: currentModel,
      baseUrl: activeProvider === 'deepseek' ? deepseekBaseUrl.trim() : undefined,
    });

    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs,
    });

    if (res.success) {
      GeminiKeyManager.setProvider(activeProvider);
      if (activeProvider === 'deepseek') {
        GeminiKeyManager.setApiKey(deepseekKey.trim(), 'deepseek');
        GeminiKeyManager.setModel(deepseekModel, 'deepseek');
        GeminiKeyManager.setBaseUrl(deepseekBaseUrl.trim(), 'deepseek');
      } else {
        GeminiKeyManager.setApiKey(geminiKey.trim(), 'gemini');
        GeminiKeyManager.setModel(geminiModel, 'gemini');
      }
      if (onKeyUpdated) onKeyUpdated();
    }
  };

  const handleSaveWithoutTest = () => {
    GeminiKeyManager.setProvider(activeProvider);
    if (activeProvider === 'deepseek') {
      GeminiKeyManager.setApiKey(deepseekKey.trim(), 'deepseek');
      GeminiKeyManager.setModel(deepseekModel, 'deepseek');
      GeminiKeyManager.setBaseUrl(deepseekBaseUrl.trim(), 'deepseek');
    } else {
      GeminiKeyManager.setApiKey(geminiKey.trim(), 'gemini');
      GeminiKeyManager.setModel(geminiModel, 'gemini');
    }
    if (onKeyUpdated) onKeyUpdated();
    onClose();
  };

  const handleClear = () => {
    GeminiKeyManager.clearApiKey(activeProvider);
    if (activeProvider === 'deepseek') {
      setDeepseekKey('');
    } else {
      setGeminiKey('');
    }
    setTestResult({
      tested: true,
      success: true,
      message: `已清除 ${activeProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API Key，系统将切回默认环境模式。`,
    });
    if (onKeyUpdated) onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-1.5">
                <span>🔑 自定义 AI 模型与 API Key 通道</span>
              </h3>
              <p className="text-[11px] text-[#7A7264]">
                支持接入 Google Gemini 或 DeepSeek 官方 API，享有独立调用配额与高速智能响应
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8477] hover:text-[#2E2A24] text-xs p-1 rounded-lg hover:bg-[#EFEAE0] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Provider Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFEAE0] rounded-xl border border-[#E0D8CC]">
          <button
            type="button"
            onClick={() => {
              setActiveProvider('gemini');
              setTestResult(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeProvider === 'gemini'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#5E584F] hover:text-[#2E2A24] hover:bg-[#E6DFC\-D]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeProvider === 'gemini' ? 'text-amber-300' : ''}`} />
            <span>Google Gemini</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('deepseek');
              setTestResult(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeProvider === 'deepseek'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-[#5E584F] hover:text-[#1E3A8A] hover:bg-[#E6DFC\-D]'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${activeProvider === 'deepseek' ? 'text-blue-300' : ''}`} />
            <span>DeepSeek (深度求索)</span>
          </button>
        </div>

        {/* Status Indicator Card */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            hasConfiguredKey
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-[#F4EFE6] border-[#E5DFD2] text-[#5C5548]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                hasConfiguredKey ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
              }`}
            ></span>
            <span className="font-medium">
              {hasConfiguredKey
                ? `已激活专属 ${GeminiKeyManager.getActiveConfigInfo().providerName} API Key`
                : '当前使用系统默认环境 / 离线规则智能模式'}
            </span>
          </div>
          {hasConfiguredKey && (
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              已加密存储于本地
            </span>
          )}
        </div>

        {/* Provider Specific Forms */}
        {activeProvider === 'gemini' ? (
          <div className="space-y-4">
            {/* Gemini API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2E2A24] flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-800 hover:text-amber-900 flex items-center gap-1 font-normal underline underline-offset-2"
                >
                  <span>免费获取 API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono pl-3 pr-20 py-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9] focus:outline-none focus:border-[#2E2A24] text-[#2E2A24]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#8C8477] hover:text-[#2E2A24] text-xs rounded"
                    title={showPassword ? '隐藏' : '显示'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {geminiKey && (
                    <button
                      type="button"
                      onClick={() => setGeminiKey('')}
                      className="p-1 text-[#8C8477] hover:text-rose-600 text-xs rounded"
                      title="清空输入"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#8C8477]">
                Key 仅保存在您当前浏览器的 LocalStorage 中，并通过后端安全转发调用，绝不外泄。
              </p>
            </div>

            {/* Gemini Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2E2A24]">
                首选 Gemini 模型 (Default Model)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {GEMINI_MODELS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setGeminiModel(m.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      geminiModel === m.id
                        ? 'bg-[#2E2A24] text-[#FAF8F5] border-[#2E2A24] shadow-xs'
                        : 'bg-[#F6F2EA] border-[#E8E2D6] text-[#4A443B] hover:border-[#CCC3B4]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.recommended && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              geminiModel === m.id
                                ? 'bg-amber-400 text-[#2E2A24]'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            默认推荐
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          geminiModel === m.id ? 'text-[#D0C9BD]' : 'text-[#7A7264]'
                        }`}
                      >
                        {m.desc}
                      </div>
                    </div>
                    <div className="mt-0.5">
                      {geminiModel === m.id ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#CCC3B4]"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DeepSeek API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2E2A24] flex items-center justify-between">
                <span>DeepSeek API Key</span>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-800 hover:text-blue-900 flex items-center gap-1 font-normal underline underline-offset-2"
                >
                  <span>获取 DeepSeek Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full text-xs font-mono pl-3 pr-20 py-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9] focus:outline-none focus:border-blue-700 text-[#2E2A24]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#8C8477] hover:text-[#2E2A24] text-xs rounded"
                    title={showPassword ? '隐藏' : '显示'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {deepseekKey && (
                    <button
                      type="button"
                      onClick={() => setDeepseekKey('')}
                      className="p-1 text-[#8C8477] hover:text-rose-600 text-xs rounded"
                      title="清空输入"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#8C8477]">
                支持 DeepSeek 官方开放平台生成的 API Key (sk-开头)。
              </p>
            </div>

            {/* DeepSeek Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2E2A24]">
                首选 DeepSeek 模型 (Model)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {DEEPSEEK_MODELS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setDeepseekModel(m.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      deepseekModel === m.id
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                        : 'bg-[#F6F2EA] border-[#E8E2D6] text-[#4A443B] hover:border-[#CCC3B4]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.recommended && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              deepseekModel === m.id
                                ? 'bg-blue-300 text-blue-950'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            推荐
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          deepseekModel === m.id ? 'text-blue-100' : 'text-[#7A7264]'
                        }`}
                      >
                        {m.desc}
                      </div>
                    </div>
                    <div className="mt-0.5">
                      {deepseekModel === m.id ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-300" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#CCC3B4]"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Base URL setting (Optional Proxy / SiliconFlow / Custom) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedDeepseek(!showAdvancedDeepseek)}
                className="text-[11px] text-[#7A7264] hover:text-[#2E2A24] flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>高级自定义 Endpoint 接口地址 {showAdvancedDeepseek ? '▲' : '▼'}</span>
              </button>

              {showAdvancedDeepseek && (
                <div className="mt-2 p-3 rounded-xl bg-[#F0EBE1] border border-[#DDD5C7] space-y-2">
                  <label className="text-[11px] font-medium text-[#2E2A24] block">
                    API Base URL (默认: https://api.deepseek.com)
                  </label>
                  <input
                    type="text"
                    value={deepseekBaseUrl}
                    onChange={(e) => setDeepseekBaseUrl(e.target.value)}
                    placeholder="https://api.deepseek.com"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[#CCC3B4] bg-white text-[#2E2A24]"
                  />
                  <p className="text-[10px] text-[#7A7264] leading-relaxed">
                    若使用中转代理、硅基流动 (https://api.siliconflow.cn/v1) 等兼容端点，可直接在此处填入 Base URL。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test & Validation Result Notice */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>{testResult.success ? '验证成功' : '验证未通过'}</span>
                {testResult.latencyMs && (
                  <span className="text-[10px] font-mono text-[#7A7264]">
                    耗时: {testResult.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Security & Privacy Commitment */}
        <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E7E0D3] text-[11px] text-[#6E675B] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#2E2A24]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>私密与安全保障</span>
          </div>
          <p className="leading-relaxed">
            1. 您的 API Key 仅保存在当前浏览器的 LocalStorage 中，不会持久化到任何公共远端数据库。<br />
            2. 所有日记、事件提取、日结复盘与轨迹发现请求，均由本应用服务直连 Google GenAI 或 DeepSeek 官方接口。
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#EBE5DB]">
          <div>
            {hasConfiguredKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-medium flex items-center justify-center gap-1 transition-colors w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除当前 Key</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] text-xs font-medium transition-colors flex-1 sm:flex-initial text-center"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isTesting || !currentKey.trim()}
              className={`px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 flex-1 sm:flex-initial shadow-xs ${
                activeProvider === 'deepseek'
                  ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]'
                  : 'bg-[#2E2A24] hover:bg-[#433D35]'
              }`}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>正在连通测试...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>测试并保存连接</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
