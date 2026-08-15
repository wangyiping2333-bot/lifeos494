import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  ExternalLink,
  FileCode,
  FileArchive,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Storage } from '../lib/storage';
import {
  exportLifeOSMarkdownZip,
  exportLifeOSSingleMarkdown,
  importLifeOSFromMarkdownZip,
  importLifeOSFromMarkdownText,
} from '../lib/markdownSync';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
  onOpenApiKeyModal?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'json' | 'reset'>('markdown');
  const [importJson, setImportJson] = useState('');
  const [importMarkdown, setImportMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Markdown Zip Export
  const handleExportZip = async () => {
    try {
      setIsProcessing(true);
      await exportLifeOSMarkdownZip();
      setStatusMsg({
        type: 'success',
        text: 'Markdown ZIP 压缩包已成功打包并下载（内含全套独立 .md 文件，适配 Obsidian/Notion）。',
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `导出失败: ${e.message || e}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Markdown Export
  const handleExportSingleMd = () => {
    try {
      exportLifeOSSingleMarkdown();
      setStatusMsg({ type: 'success', text: '全量生活档案 (LifeOS_全量生活档案.md) 已下载至本地。' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `导出失败: ${e.message || e}` });
    }
  };

  // JSON Export
  const handleExportJson = () => {
    const json = Storage.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setStatusMsg({ type: 'success', text: '全量 JSON 备份数据已下载至本地。' });
  };

  // File Upload handler (handles both .zip and .md)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      if (file.name.endsWith('.zip')) {
        const res = await importLifeOSFromMarkdownZip(file);
        if (res.success) {
          setStatusMsg({ type: 'success', text: res.message });
          onDataReload();
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown')) {
        const text = await file.text();
        const res = importLifeOSFromMarkdownText(text);
        if (res.success) {
          setStatusMsg({ type: 'success', text: res.message });
          onDataReload();
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const ok = Storage.importBackupJson(text);
        if (ok) {
          setStatusMsg({ type: 'success', text: 'JSON 备份文件导入成功！' });
          onDataReload();
        } else {
          setStatusMsg({ type: 'error', text: 'JSON 数据格式有误，导入失败。' });
        }
      } else {
        setStatusMsg({ type: 'error', text: '请上传 .zip 压缩包、.md 文件或 .json 备份文件。' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `文件解析异常: ${err.message || err}` });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Markdown Text Import
  const handleImportMarkdownText = () => {
    if (!importMarkdown.trim()) return;
    const res = importLifeOSFromMarkdownText(importMarkdown);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      onDataReload();
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  // JSON Import
  const handleImportJson = () => {
    if (!importJson.trim()) return;
    const ok = Storage.importBackupJson(importJson);
    if (ok) {
      setStatusMsg({ type: 'success', text: 'JSON 备份数据导入成功！' });
      onDataReload();
    } else {
      setStatusMsg({ type: 'error', text: 'JSON 数据格式有误，导入失败。' });
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置为初始演示数据吗？（包含精选的待办、事件、账本、日结与外脑知识）')) {
      Storage.resetAllToDefault();
      setStatusMsg({ type: 'success', text: '已恢复至初始精选生活数据。' });
      onDataReload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2E2A24]">
                数据管理与 Markdown 导入导出
              </h3>
              <p className="text-[11px] text-[#7A7264]">
                全量数据本地加密存储 · 深度支持 Markdown / ZIP 知识库无缝迁移
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-200 text-[#8C8477] hover:text-[#2E2A24] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
        )}

        {/* Custom AI Key Quick Access */}
        {onOpenApiKeyModal && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-700" />
                <span>自定义 AI 模型通道 (Gemini / DeepSeek)</span>
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenApiKeyModal();
                }}
                className="text-amber-800 hover:text-amber-950 font-medium underline underline-offset-2 flex items-center gap-1"
              >
                <span>配置 API Key</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-amber-900/80 text-[11px] leading-relaxed">
              支持一键接入官方 Gemini 3.7 Flash 或 DeepSeek R1 深度推理，获得无限制专属计算资源。
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#EFE9DF] rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'markdown'
                ? 'bg-white text-[#2E2A24] shadow-xs'
                : 'text-[#7A7264] hover:text-[#2E2A24]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Markdown / ZIP (推荐)</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-white text-[#2E2A24] shadow-xs'
                : 'text-[#7A7264] hover:text-[#2E2A24]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-stone-600" />
            <span>JSON 备份</span>
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reset'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-[#7A7264] hover:text-[#2E2A24]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>重置</span>
          </button>
        </div>

        {/* TAB 1: Markdown / ZIP Management */}
        {activeTab === 'markdown' && (
          <div className="space-y-4">
            {/* Export Markdown */}
            <div className="p-4 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-stone-700" />
                  <span>导出 Markdown 格式档案</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Obsidian / Notion 兼容
                </span>
              </div>
              <p className="text-[#7A7264] leading-relaxed">
                将你的每日复盘（按天归档）、短期待办、生活事件簿、身心状态流水、财务账本、外脑知识库与愿景目标全部转换为结构化 Markdown 文件。
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleExportZip}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D35] flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <FileArchive className="w-3.5 h-3.5 text-amber-300" />
                  <span>一键导出 Markdown ZIP 压缩包</span>
                </button>

                <button
                  onClick={handleExportSingleMd}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#DDD6C8] text-[#2E2A24] text-xs font-medium hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-600" />
                  <span>导出全量单文件 (.md)</span>
                </button>
              </div>
            </div>

            {/* Import Markdown / ZIP */}
            <div className="p-4 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-stone-700" />
                  <span>导入 Markdown 文件或 ZIP 压缩包</span>
                </h4>
                <span className="text-[10px] text-[#7A7264]">支持 .zip / .md</span>
              </div>

              {/* Upload Button */}
              <div className="border-2 border-dashed border-[#DDD6C8] hover:border-stone-400 bg-white/70 rounded-xl p-4 text-center space-y-2 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.md,.markdown,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="md-file-uploader"
                />
                <label
                  htmlFor="md-file-uploader"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DECة] text-[#2E2A24] font-medium text-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-700" />
                  <span>选择或拖入 .zip 压缩包 / .md 笔记</span>
                </label>
                <p className="text-[11px] text-[#8C8477]">
                  系统会自动解压并解析各 .md 文件的 YAML Frontmatter 及段落，智能归并至待办、日结与知识库。
                </p>
              </div>

              {/* Or Paste Markdown Text */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-medium text-[#7A7264] flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  <span>或直接粘贴 Markdown 内容快速提取导入：</span>
                </label>
                <textarea
                  value={importMarkdown}
                  onChange={(e) => setImportMarkdown(e.target.value)}
                  placeholder={`例如粘贴复盘 Markdown：\n---\ntitle: 2026-08-15 晚间日结复盘\ndate: 2026-08-15\n---\n## 1. 今日发生\n- 下午直播两小时\n- 练习力量训练`}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#DDD6C8] font-mono leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleImportMarkdownText}
                    disabled={!importMarkdown.trim() || isProcessing}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D35] disabled:opacity-40"
                  >
                    解析并导入文本
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JSON Backup */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-2 text-xs">
              <h4 className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>导出全量 JSON 数据备份</span>
              </h4>
              <p className="text-[#7A7264]">
                打包完整的应用状态（包括愿景、原则、目标证据、事件、待办、账本与外脑知识库）。
              </p>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-1.5 rounded-lg bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D35]"
              >
                下载全量 JSON 备份
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-2 text-xs">
              <h4 className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>从 JSON 恢复全量数据</span>
              </h4>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="粘贴备份的 JSON 文本内容..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD6C8] font-mono"
              />
              <button
                onClick={handleImportJson}
                disabled={!importJson.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D35] disabled:opacity-40"
              >
                导入并覆盖 JSON 数据
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Reset Demo */}
        {activeTab === 'reset' && (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3 text-xs">
            <h4 className="font-semibold text-amber-950 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>重置为精选演示案例 (Default LifeOS Data)</span>
            </h4>
            <p className="text-amber-900/80 leading-relaxed">
              一键载入包含直播手作业务、母亲100元情绪觉察、健身力量训练、英语学习、7大维度晚间日结复盘、短期待办以及外脑知识库的完整沉浸式生活数据。
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-amber-800 text-amber-50 text-xs font-medium hover:bg-amber-900 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>重置并载入完整演示数据</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
