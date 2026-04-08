import { useState } from "react";
import { PLUGIN_REGISTRY } from "../config/plugins";

export function PluginView({ 
  installedPlugins, 
  setInstalledPlugins,
  fsWhitelist,
  setFsWhitelist,
  // 👇 새롭게 추가된 인덱싱 설정 Props
  indexingBasePath = "",
  setIndexingBasePath,
  indexingDepth = 3,
  setIndexingDepth
}: { 
  installedPlugins: string[], 
  setInstalledPlugins: React.Dispatch<React.SetStateAction<string[]>>,
  fsWhitelist: string[],
  setFsWhitelist: React.Dispatch<React.SetStateAction<string[]>>,
  indexingBasePath?: string,
  setIndexingBasePath?: React.Dispatch<React.SetStateAction<string>>,
  indexingDepth?: number,
  setIndexingDepth?: React.Dispatch<React.SetStateAction<number>>
}) {
  
  const [pluginTab, setPluginTab] = useState<"list" | "settings">("list");
  const [newPathInput, setNewPathInput] = useState("");
  // C:\ 경로 제한을 위한 에러 상태
  const [basePathError, setBasePathError] = useState("");

  const togglePlugin = (pluginId: string) => {
    setInstalledPlugins(prev => {
      if (prev.includes(pluginId)) return prev.filter(id => id !== pluginId);
      return [...prev, pluginId];
    });
  };

  const handleAddPath = () => {
    const trimmedPath = newPathInput.trim();
    if (trimmedPath && !fsWhitelist.includes(trimmedPath)) {
      setFsWhitelist([...fsWhitelist, trimmedPath]);
      setNewPathInput(""); 
    }
  };

  const handleRemovePath = (targetPath: string) => {
    setFsWhitelist(fsWhitelist.filter(p => p !== targetPath));
  };

  // ✅ 탐색 시작 기준 변경 핸들러 (C:\ 예외 처리)
  const handleBasePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (setIndexingBasePath) setIndexingBasePath(val);

    const upperVal = val.trim().toUpperCase();
    if (upperVal === "C:\\" || upperVal === "C:/") {
      setBasePathError("C:\\ 최상단 경로는 지정할 수 없습니다.");
    } else {
      setBasePathError("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-blue-100">
          🧩 플러그인 관리
        </h2>
        
        <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setPluginTab("list")}
            className={`px-4 py-1 text-xs font-semibold rounded-md transition-colors ${pluginTab === "list" ? "bg-blue-500 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"}`}
          >
            목록
          </button>
          <button
            onClick={() => setPluginTab("settings")}
            className={`px-4 py-1 text-xs font-semibold rounded-md transition-colors ${pluginTab === "settings" ? "bg-blue-500 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"}`}
          >
            설정
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
        
        {/* ===================== [1] 플러그인 목록 탭 ===================== */}
        {pluginTab === "list" && PLUGIN_REGISTRY.map((plugin) => {
          const isInstalled = installedPlugins.includes(plugin.id);
          return (
            <div key={plugin.id} className={`border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center transition-all ${isInstalled ? "bg-white/10 backdrop-blur-md border-white/30" : "bg-black/20 border-white/5 opacity-60 grayscale"}`}>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${isInstalled ? "text-white" : "text-white/50"}`}>{plugin.name}</h3>
                <p className="text-xs text-white/60 mt-1 break-words whitespace-normal">{plugin.description}</p>
              </div>
              <button onClick={() => togglePlugin(plugin.id)} className={`shrink-0 w-full sm:w-auto text-xs px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors ${isInstalled ? "bg-red-500/80 hover:bg-red-500 text-white" : "bg-blue-500 hover:bg-blue-400 text-white"}`}>
                {isInstalled ? "삭제" : "설치"}
              </button>
            </div>
          );
        })}

        {/* ===================== [2] 플러그인 설정 탭 ===================== */}
        {pluginTab === "settings" && (
          installedPlugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/40 text-sm">
              <span className="text-4xl mb-3 grayscale opacity-50">📦</span>
              설치된 플러그인이 없습니다.
            </div>
          ) : (
            installedPlugins.map(pluginId => {
              const plugin = PLUGIN_REGISTRY.find(p => p.id === pluginId);
              if (!plugin) return null;
              
              return (
                <div key={plugin.id} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-400 text-lg">⚙️</span>
                    <h3 className="font-semibold text-white text-sm">{plugin.name} 상세 설정</h3>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-xs text-white/60">
                    
                    {plugin.id === "filesystem" ? (
                      <div className="mt-2 space-y-6">
                        {/* 1. 화이트리스트 영역 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white/90">🛡️ 안전한 경로 목록 (White List)</h4>
                          </div>
                          <p className="text-[10px] text-white/50 mb-3 leading-relaxed">
                            AI가 접근할 수 있는 폴더 경로만 추가하세요.<br/>
                            (예: <code className="bg-black/50 px-1 rounded">C:\Users\이름\Desktop\AI_Workspace</code>)<br/>
                            <span className="text-yellow-400/80">※ 목록이 비어있으면 모든 경로 접근이 허용되므로 매우 위험합니다!</span>
                          </p>

                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              value={newPathInput}
                              onChange={(e) => setNewPathInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPath(); }}
                              placeholder="허용할 폴더의 전체 경로를 입력하세요..."
                              className="flex-1 bg-black/50 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                            />
                            <button onClick={handleAddPath} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
                              추가
                            </button>
                          </div>

                          <ul className="space-y-1.5">
                            {fsWhitelist.map((path, idx) => (
                              <li key={idx} className="flex justify-between items-center bg-blue-900/20 border border-blue-500/30 px-3 py-2 rounded-md text-xs text-blue-100">
                                <span className="truncate mr-2 flex-1" title={path}>{path}</span>
                                <button 
                                  onClick={() => handleRemovePath(path)} 
                                  className="text-red-400 hover:text-red-300 font-bold px-1 text-sm shrink-0"
                                  title="경로 삭제"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                            {fsWhitelist.length === 0 && (
                              <div className="text-center py-4 bg-black/20 border border-white/5 rounded-md text-[10px] text-white/40">
                                등록된 경로가 없습니다. 현재 모든 경로에 대한 접근이 허용되어 있습니다.
                              </div>
                            )}
                          </ul>
                        </div>

                        {/* ✅ 2. 인덱싱 설정 영역 추가 */}
                        <div className="pt-5 border-t border-white/10">
                          <h4 className="font-semibold text-white/90 mb-2">🗂️ 인덱싱</h4>
                          <p className="text-[10px] text-white/50 mb-4 leading-relaxed">
                            AI가 파일 탐색을 시작할 기준 위치와 하위 폴더 탐색 깊이를 설정합니다.
                          </p>

                          <div className="space-y-4">
                            {/* 탐색 시작 기준 */}
                            <div>
                              <label className="block text-white/70 mb-1.5">탐색 시작 기준 (경로)</label>
                              <input
                                type="text"
                                value={indexingBasePath}
                                onChange={handleBasePathChange}
                                placeholder="예: C:\Users\이름\Documents"
                                className={`w-full bg-black/50 border ${basePathError ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-blue-400'} rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors`}
                              />
                              {basePathError && <p className="text-red-400 text-[10px] mt-1">{basePathError}</p>}
                            </div>

                            {/* 파일 깊이 */}
                            <div>
                              <label className="block text-white/70 mb-1.5">파일 깊이 (최대 5)</label>
                              <select
                                value={indexingDepth}
                                onChange={(e) => setIndexingDepth && setIndexingDepth(Number(e.target.value))}
                                className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 transition-colors"
                              >
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <option key={num} value={num}>{num}단계</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <p>이 플러그인은 현재 기본값으로 최적화되어 작동 중입니다.</p>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}