import { useState, useEffect } from "react";
import { load } from '@tauri-apps/plugin-store';
import { invoke } from "@tauri-apps/api/core";

export function useSettings() {
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(["filesystem", "system_info"]);
  const [fsWhitelist, setFsWhitelist] = useState<string[]>([]);
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);
  const [userHome, setUserHome] = useState<string>("");

  // 👇 새롭게 추가된 API 키 및 설정 상태
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [tavilyKey, setTavilyKey] = useState<string>("");
  const [elevenlabsKey, setElevenlabsKey] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const store = await load('freel_settings.json');
        
        const savedPlugins = await store.get<string[]>("installedPlugins");
        if (savedPlugins) setInstalledPlugins(savedPlugins);

        const savedWhitelist = await store.get<string[]>("fsWhitelist");
        if (savedWhitelist) setFsWhitelist(savedWhitelist);

        // 👇 설정 불러오기
        const savedOpenai = await store.get<string>("openaiKey");
        if (savedOpenai) setOpenaiKey(savedOpenai);

        const savedTavily = await store.get<string>("tavilyKey");
        if (savedTavily) setTavilyKey(savedTavily);

        const savedElevenlabs = await store.get<string>("elevenlabsKey");
        if (savedElevenlabs) setElevenlabsKey(savedElevenlabs);

        const savedVoiceId = await store.get<string>("voiceId");
        if (savedVoiceId) setVoiceId(savedVoiceId);

        const homePath = await invoke<string>("get_user_home");
        setUserHome(homePath);
      } catch (err) {
        console.error("설정 로드 실패:", err);
      } finally {
        setIsStoreLoaded(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isStoreLoaded) return; 

    const saveSettings = async () => {
      try {
        const store = await load('freel_settings.json');
        await store.set("installedPlugins", installedPlugins);
        await store.set("fsWhitelist", fsWhitelist);
        
        // 👇 설정 저장하기
        await store.set("openaiKey", openaiKey);
        await store.set("tavilyKey", tavilyKey);
        await store.set("elevenlabsKey", elevenlabsKey);
        await store.set("voiceId", voiceId);
        
        await store.save(); 
      } catch (err) {
        console.error("설정 저장 실패:", err);
      }
    };
    saveSettings();
  }, [installedPlugins, fsWhitelist, openaiKey, tavilyKey, elevenlabsKey, voiceId, isStoreLoaded]);

  return { 
    installedPlugins, setInstalledPlugins, 
    fsWhitelist, setFsWhitelist, 
    userHome,
    // 👇 반환 객체에 추가
    openaiKey, setOpenaiKey,
    tavilyKey, setTavilyKey,
    elevenlabsKey, setElevenlabsKey,
    voiceId, setVoiceId
  };
}