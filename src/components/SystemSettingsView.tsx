import React, { useState, useEffect, useCallback } from "react";

interface SystemSettingsViewProps {
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  openaiKey: string;
  setOpenaiKey: React.Dispatch<React.SetStateAction<string>>;
  serperKey: string;
  setSerperKey: React.Dispatch<React.SetStateAction<string>>;
  elevenlabsKey: string;
  setElevenlabsKey: React.Dispatch<React.SetStateAction<string>>;
  voiceId: string;
  setVoiceId: React.Dispatch<React.SetStateAction<string>>;
  scanBlacklistNames: string;
  setScanBlacklistNames: React.Dispatch<React.SetStateAction<string>>;
  scanBlacklistPaths: string;
  setScanBlacklistPaths: React.Dispatch<React.SetStateAction<string>>;
}

export const SystemSettingsView = ({
  selectedModel, setSelectedModel,
  openaiKey, setOpenaiKey,
  serperKey, setSerperKey,
  elevenlabsKey, setElevenlabsKey,
  voiceId, setVoiceId,
  scanBlacklistNames, setScanBlacklistNames,
  scanBlacklistPaths, setScanBlacklistPaths
}: SystemSettingsViewProps) => {
  
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 💡 Ollama 모델 목록을 불러오는 함수 (수동 새로고침 지원)
  const fetchOllamaModels = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      const data = await res.json();
      const modelNames = data.models.map((m: any) => m.name);
      setOllamaModels(modelNames);
      
      // 만약 현재 선택된 모델이 삭제되었거나 없다면, 목록의 첫 번째 모델로 자동 선택
      if (modelNames.length > 0 && !modelNames.includes(selectedModel)) {
        setSelectedModel(modelNames[0]);
      }
    } catch (error) {
      console.error("Ollama 서버를 찾을 수 없습니다:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // UI 피드백을 위한 약간의 지연
    }
  }, [selectedModel, setSelectedModel]);

  // 컴포넌트 마운트 시 최초 1회 실행
  useEffect(() => {
    fetchOllamaModels();
  }, [fetchOllamaModels]);

  return (
    <div className="p-2 sm:p-6 text-white overflow-y-auto h-full custom-scrollbar">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>⚙️</span> 시스템 설정
        </h2>

        {/* 1. 로컬 AI 모델 설정 구역 */}
        <section className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-bold text-blue-300">🧠 AI 뇌 (로컬 모델) 선택</h3>
              <p className="text-xs text-white/50 mt-1">Ollama에 설치된 모델을 자유롭게 교체하여 사용할 수 있습니다.</p>
            </div>
            <button 
              onClick={fetchOllamaModels} 
              disabled={isRefreshing}
              className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/30 flex items-center gap-1"
            >
              {isRefreshing ? "갱신 중..." : "🔄 목록 새로고침"}
            </button>
          </div>
          
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
          >
            {ollamaModels.length === 0 ? (
              <option value={selectedModel}>{selectedModel} (Ollama 연결 대기중...)</option>
            ) : (
              ollamaModels.map(name => (
                <option key={name} value={name}>{name}</option>
              ))
            )}
          </select>
        </section>

        {/* 2. 외부 API 키 설정 구역 */}
        <section className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-amber-300 mb-1">🔑 외부 서비스 API 키</h3>
            <p className="text-xs text-white/50 mb-4">웹 검색, 음성 합성 등을 위한 외부 서비스 연동 키를 입력하세요. (로컬에만 안전하게 저장됩니다)</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/80">OpenAI API Key (선택 사항)</label>
            <input 
              type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..." spellCheck={false}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-amber-500/50 focus:bg-black/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/80">Serper API Key (웹 검색용)</label>
            <input 
              type="password" value={serperKey} onChange={(e) => setSerperKey(e.target.value)}
              placeholder="Google 검색 결과를 가져오기 위한 키" spellCheck={false}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-amber-500/50 focus:bg-black/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/80">ElevenLabs API Key (음성 합성용)</label>
            <input 
              type="password" value={elevenlabsKey} onChange={(e) => setElevenlabsKey(e.target.value)}
              placeholder="고품질 AI 음성 생성을 위한 키" spellCheck={false}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-amber-500/50 focus:bg-black/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-white/80">Voice ID (ElevenLabs 목소리 설정)</label>
            <input 
              type="text" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}
              placeholder="예: 21m00Tcm4TlvDq8ikWAM" spellCheck={false}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-amber-500/50 focus:bg-black/50 transition-all placeholder:text-white/20 font-mono"
            />
          </div>
        </section>

        {/* 3. 시스템 스캐너 설정 구역 */}
        <section className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col gap-4">
          <div className="pt-4 border-t border-white/10 mt-6">
          <h3 className="text-sm font-bold text-amber-300 mb-3">🛡️ 스캔 블랙리스트 설정</h3>
          <div className="mb-3">
            <label className="block text-[11px] text-white/50 mb-1">무시할 폴더/파일 이름 (쉼표로 구분)</label>
            <input 
              type="text" 
              value={scanBlacklistNames} 
              onChange={(e) => setScanBlacklistNames(e.target.value)} 
              className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-sm text-white" 
              placeholder="node_modules, .git, venv" 
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/50 mb-1">무시할 전체 경로 (쉼표로 구분)</label>
            <input 
              type="text" 
              value={scanBlacklistPaths} 
              onChange={(e) => setScanBlacklistPaths(e.target.value)} 
              className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-sm text-white" 
              placeholder="C:\Windows, /System" 
            />
          </div>
        </div>
        </section>

      </div>
    </div>
  );
}