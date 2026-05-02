import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openaiKey') || '');
  const [serperKey, setSerperKey] = useState(localStorage.getItem('serperKey') || '');
  const [elevenlabsKey, setElevenlabsKey] = useState(localStorage.getItem('elevenlabsKey') || '');
  const [voiceId, setVoiceId] = useState(localStorage.getItem('voiceId') || '');
  
  // 💡 폴더명 기준 블랙리스트
  const [scanBlacklistNames, setScanBlacklistNames] = useState(
    localStorage.getItem('scanBlacklistNames') || 'Windows, node_modules, .git, Temp, AppData'
  );

  // 💡 절대 경로 기준 블랙리스트 (예시 기본값 추가)
  const [scanBlacklistPaths, setScanBlacklistPaths] = useState(
    localStorage.getItem('scanBlacklistPaths') || 'C:\\Program Files\\WindowsApps'
  );

  useEffect(() => {
    localStorage.setItem('openaiKey', openaiKey);
    localStorage.setItem('serperKey', serperKey);
    localStorage.setItem('elevenlabsKey', elevenlabsKey);
    localStorage.setItem('voiceId', voiceId);
    localStorage.setItem('scanBlacklistNames', scanBlacklistNames);
    localStorage.setItem('scanBlacklistPaths', scanBlacklistPaths);
  }, [openaiKey, serperKey, elevenlabsKey, voiceId, scanBlacklistNames, scanBlacklistPaths]);

  return { 
    openaiKey, setOpenaiKey, 
    serperKey, setSerperKey, 
    elevenlabsKey, setElevenlabsKey, 
    voiceId, setVoiceId,
    scanBlacklistNames, setScanBlacklistNames,
    scanBlacklistPaths, setScanBlacklistPaths
  };
};