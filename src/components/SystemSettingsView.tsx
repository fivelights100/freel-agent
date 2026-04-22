import { useState } from "react";

export function SystemSettingsView({
  openaiKey, setOpenaiKey,
  serperKey, setSerperKey,
  elevenlabsKey, setElevenlabsKey,
  voiceId, setVoiceId
}: {
  openaiKey: string, setOpenaiKey: (v: string) => void,
  serperKey: string, setSerperKey: (v: string) => void,
  elevenlabsKey: string, setElevenlabsKey: (v: string) => void,
  voiceId: string, setVoiceId: (v: string) => void
}) {
  const [settingsTab, setSettingsTab] = useState<"general" | "advanced">("advanced");

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-blue-100">
          ⚙️ 시스템 설정
        </h2>
      </div>

      <div className="flex gap-2 mb-4 shrink-0 bg-black/20 p-1 rounded-xl">
        <button
          onClick={() => setSettingsTab("general")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${settingsTab === "general" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}
        >
          일반
        </button>
        <button
          onClick={() => setSettingsTab("advanced")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${settingsTab === "advanced" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}
        >
          고급
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
        {settingsTab === "general" ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/50 text-xs">
            일반 설정 기능은 추후 업데이트 예정입니다.
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-400 text-lg">🔑</span>
              <h3 className="font-semibold text-white text-sm">API 설정</h3>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-xs text-white/60 space-y-4">
              <div>
                <label className="block text-white/70 mb-1.5 font-semibold">OpenAI API Key (GPT 에이전트)</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1.5 font-semibold">Serper API Key (웹 검색)</label>
                <input
                  type="password"
                  value={serperKey}
                  onChange={(e) => setSerperKey(e.target.value)}
                  placeholder="Serper API Key 입력"
                  className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-white/10">
                <label className="block text-white/70 mb-1.5 font-semibold">ElevenLabs API Key (음성 출력)</label>
                <input
                  type="password"
                  value={elevenlabsKey}
                  onChange={(e) => setElevenlabsKey(e.target.value)}
                  placeholder="ElevenLabs Key"
                  className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1.5 font-semibold">ElevenLabs Voice ID</label>
                <input
                  type="text"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="예: 21m00Tcm4TlvDq8ikWAM"
                  className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md text-[10px] text-blue-200/80 leading-relaxed text-center">
                ※ 입력하신 API 키는 암호화되어 사용자 PC 내부에만 안전하게 저장됩니다.<br/>변경 시 즉시 적용됩니다.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}