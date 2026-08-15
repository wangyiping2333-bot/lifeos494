import React, { useState } from 'react';
import { Compass, CheckCircle2, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface InnerCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InnerCompassModal: React.FC<InnerCompassModalProps> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState({
    bodyWilling: true,
    peacefulHeart: true,
    proactive: true,
    facingReality: true,
    feelsComplete: true,
    singlePointBalance: true,
  });

  const [notes, setNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const score =
    Object.values(answers).filter(Boolean).length * 1.66; // approx 10 points

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2E2A24]">
                🧭 内在指南针 (Inner Compass)
              </h3>
              <p className="text-[11px] text-[#7A7264]">
                “现在这样活，是不是越来越接近真实的自己？”
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8C8477] hover:text-[#2E2A24] text-xs">
            ✕
          </button>
        </div>

        {/* Philosophy Note */}
        <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E7E0D3] text-xs text-[#5C5548] leading-relaxed">
          <p>
            <strong>注意：</strong>
            Alignment (一致性) 不等于表面的舒服。例如：健身虽然很累，但心理踏实，这是高度对齐；而躺一天虽然舒服，但晚上强烈焦虑，这是不对齐。
          </p>
        </div>

        {/* 6 Dimension Checks */}
        <div className="space-y-2.5 text-xs">
          {/* Question 1 */}
          <div
            onClick={() => setAnswers({ ...answers, bodyWilling: !answers.bodyWilling })}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.bodyWilling
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">1. 身体是否愿意？</div>
              <div className="text-[11px] text-[#7A7264]">
                身体是放松舒展的，而不是持续处于抵抗、紧绷或耗竭状态。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.bodyWilling ? '✓ 是' : '✕ 否'}
            </span>
          </div>

          {/* Question 2 */}
          <div
            onClick={() => setAnswers({ ...answers, peacefulHeart: !answers.peacefulHeart })}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.peacefulHeart
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">2. 内心是否踏实？</div>
              <div className="text-[11px] text-[#7A7264]">
                行动完成后有一种落地的安稳感，而非狂躁的虚火。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.peacefulHeart ? '✓ 是' : '✕ 否'}
            </span>
          </div>

          {/* Question 3 */}
          <div
            onClick={() => setAnswers({ ...answers, proactive: !answers.proactive })}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.proactive
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">3. 是主动选择还是恐惧驱动？</div>
              <div className="text-[11px] text-[#7A7264]">
                出于对愿景的渴望而创造，而非出于被抛弃或惩罚的恐惧。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.proactive ? '✓ 主动选择' : '✕ 恐惧驱动'}
            </span>
          </div>

          {/* Question 4 */}
          <div
            onClick={() => setAnswers({ ...answers, facingReality: !answers.facingReality })}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.facingReality
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">4. 是面对现实还是逃避现实？</div>
              <div className="text-[11px] text-[#7A7264]">
                勇于正视真实的数字、关系、身体状态，不麻痹自己。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.facingReality ? '✓ 面对现实' : '✕ 逃避麻木'}
            </span>
          </div>

          {/* Question 5 */}
          <div
            onClick={() => setAnswers({ ...answers, feelsComplete: !answers.feelsComplete })}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.feelsComplete
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">5. 做完以后更完整还是更内耗？</div>
              <div className="text-[11px] text-[#7A7264]">
                行动带来了能力感与自我确认，而不是空虚与自责。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.feelsComplete ? '✓ 更完整' : '✕ 更内耗'}
            </span>
          </div>

          {/* Question 6 */}
          <div
            onClick={() =>
              setAnswers({ ...answers, singlePointBalance: !answers.singlePointBalance })
            }
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              answers.singlePointBalance
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-[#F6F2EA] border-[#DDD6C8] text-[#5C5548]'
            }`}
          >
            <div>
              <div className="font-semibold">6. 是否因为一个人/一件事打翻全盘？</div>
              <div className="text-[11px] text-[#7A7264]">
                守住生活基本盘，不让单点波动吞噬六大领域的平衡。
              </div>
            </div>
            <span className="font-bold text-sm">
              {answers.singlePointBalance ? '✓ 守住平衡' : '✕ 受到波及'}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-medium text-[#7A7264] mb-1">
            今日内在觉察记录 (选填)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="写下当下最真实的身心觉察..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl bg-[#F6F2EA] border border-[#DDD6C8]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EBE5DB]">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#7A7264]">当前对齐度:</span>
            <span className="font-mono font-bold text-amber-800 text-sm">
              {Math.round(score)} / 10
            </span>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D35] flex items-center gap-1"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>已保存觉察</span>
              </>
            ) : (
              <span>保存自检结果</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
