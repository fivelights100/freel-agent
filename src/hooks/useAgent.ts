import { useState, useEffect, useRef } from 'react';
import { ToolsExecutor } from '../agents/toolsExecutor';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

// ==========================================
// [1] AI 페르소나 및 시스템 지시문
// ==========================================
export const systemPrompt: Message = {
  role: 'system',
  content: `당신은 사용자의 PC 데스크톱을 제어하고 정보를 제공하는 유능한 AI 에이전트 'FreeL'입니다. 
1. 단순 대화나 간단한 작업(메모장 열기 등)은 즉시 실행하세요.
2. 2단계 이상의 복잡한 작업은 반드시 'make_plan' 도구를 먼저 호출하여 계획을 세운 뒤 실행하세요.
3. 작업 중 오류가 발생하면 스스로 분석하여 재시도하세요.`
};

// ==========================================
// [2] 🚀 최적화: 도구(Tools) 목록 전역 분리
// 함수 안에 있으면 매번 채팅을 칠 때마다 새로 메모리에 할당되므로 밖으로 빼냅니다.
// ==========================================
const AGENT_TOOLS = [
  {
          type: "function",
          function: {
            name: "make_plan",
            description: "2단계 이상의 복잡한 작업을 수행하기 전에 반드시 호출하여 실행 계획을 세웁니다.",
            parameters: {
              type: "object",
              properties: {
                steps: { type: "array", items: { type: "string" }, description: "수행할 작업 단계 목록" }
              },
              required: ["steps"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "system_execute",
            description: "PC에서 터미널 명령어를 실행하거나 응용 프로그램을 엽니다. 특정 exe 파일의 절대 경로를 전달하면 해당 프로그램을 실행합니다.",
            parameters: {
              type: "object",
              properties: {
                command: { type: "string", description: "실행할 명령어 또는 앱의 절대 경로 (예: \"C:\\Program Files\\app.exe\")" }
              },
              required: ["command"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "system_scan",
            description: "PC 전체 시스템을 스캔하여 앱과 폴더 경로를 캐시합니다. 'ALL'을 입력하면 연결된 모든 드라이브(C, D 등)를 자동으로 찾아 스캔합니다.",
            parameters: { 
              type: "object", 
              properties: { 
                path: { type: "string", description: "스캔할 절대 경로 또는 'ALL'" },
                depth: { type: "number", description: "최대 탐색 깊이" }
              } 
            }
          }
        },
        {
          type: "function",
          function: {
            name: "find_directory",
            description: "스캔된 캐시에서 특정 키워드가 포함된 '폴더(디렉토리)'의 절대 경로를 찾아 반환합니다. 특정 폴더의 위치를 모를 때 가장 먼저 사용하세요.",
            parameters: { 
              type: "object", 
              properties: { 
                keywords: { type: "array", items: { type: "string" }, description: "찾고자 하는 폴더 이름 키워드 목록" } 
              }, 
              required: ["keywords"] 
            }
          }
        },
        {
          type: "function",
          function: {
            name: "find_application",
            description: "스캔된 캐시 파일에서 특정 키워드가 포함된 애플리케이션(exe, bat)의 절대 경로를 찾아 반환합니다.",
            parameters: {
              type: "object",
              properties: {
                keywords: { type: "array", items: { type: "string" }, description: "검색할 프로그램 이름 키워드 목록" }
              },
              required: ["keywords"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "filesystem_write",
            description: "특정 경로에 새로운 텍스트 파일을 생성하거나, 기존 파일의 내용을 완전히 덮어씁니다.",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string", description: "파일을 저장할 절대 경로 (예: C:\\Users\\이름\\Desktop\\메모.txt)" },
                content: { type: "string", description: "파일에 작성할 내용" }
              },
              required: ["path", "content"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "filesystem_append",
            description: "기존에 존재하는 텍스트 파일의 끝에 새로운 내용을 덧붙입니다. 기존 내용은 보존됩니다.",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string", description: "내용을 추가할 파일의 절대 경로" },
                content: { type: "string", description: "추가할 텍스트 내용" }
              },
              required: ["path", "content"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "filesystem_delete",
            description: "지정된 경로의 파일이나 폴더를 완전히 삭제합니다. 이 작업은 되돌릴 수 없으므로 주의해서 사용해야 합니다.",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string", description: "삭제할 파일 또는 폴더의 절대 경로" }
              },
              required: ["path"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "web_search",
            description: "인터넷에서 최신 정보, 뉴스, 날씨 등을 구글링하여 검색합니다. 사용자 질문에 대한 최신 사실이 필요할 때 사용하세요.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "구글 검색에 사용할 키워드 (예: '오늘 서울 날씨', '최신 AI 동향')" }
              },
              required: ["query"]
            }
          }
        },
];

interface UseAgentProps {
  openai: any; 
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  serperKey?: string; 
  scanBlacklistNames?: string;
  scanBlacklistPaths?: string;
}

export const useAgent = ({ openai, messages, setMessages, serperKey, scanBlacklistNames, scanBlacklistPaths }: UseAgentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const executorRef = useRef<ToolsExecutor | null>(null);

  useEffect(() => {
    if (!executorRef.current) {
      executorRef.current = new ToolsExecutor();

      // 💡 [핵심] 앱 시작 시 웹소켓 연결이 안정화될 수 있도록 1.5초 후 자동 스캔 백그라운드 실행
      setTimeout(() => {
        const names = scanBlacklistNames ? scanBlacklistNames.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const paths = scanBlacklistPaths ? scanBlacklistPaths.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        
        console.log("[Auto-Scan] 초기 자동 스캔을 시작합니다 (모든 드라이브)...");
        executorRef.current?.executeTool("system_scan", {
          path: "ALL", // 💡 "C:\\" 에서 "ALL" 로 변경!!
          depth: 5,
          blacklistNames: names,
          blacklistPaths: paths
        }).then((res) => console.log("[Auto-Scan] 전체 스캔 완료!", res))
          .catch(e => console.error("[Auto-Scan] 자동 스캔 실패:", e));
      }, 1500);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing || !openai) return;
    setIsProcessing(true);
    
    let currentMessages = [...messages, { role: 'user', content: text } as Message];
    setMessages(currentMessages);

    try {
      let loopCount = 0;
      const MAX_LOOPS = 10;
      let isTaskComplete = false;

      while (loopCount < MAX_LOOPS && !isTaskComplete) {
        loopCount++;
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: currentMessages,
          tools: AGENT_TOOLS as any, // 분리해둔 상수를 사용
          tool_choice: "auto"
        });

        const responseMessage = response.choices[0].message;
        currentMessages = [...currentMessages, responseMessage as Message];
        setMessages([...currentMessages]);

        if (responseMessage.tool_calls) {
          for (const toolCall of responseMessage.tool_calls) {
            const action = toolCall.function.name;
            const parameters = JSON.parse(toolCall.function.arguments);
            let actionResult;

            if (action === "system_scan") {
              parameters.blacklistNames = scanBlacklistNames ? scanBlacklistNames.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
              parameters.blacklistPaths = scanBlacklistPaths ? scanBlacklistPaths.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
            }

            if (action === "make_plan") {
              actionResult = { status: 'success', message: "계획이 기록되었습니다.", plan: parameters.steps };
            } else if (action === "web_search") {
              if (!serperKey) {
                actionResult = { status: 'error', error: "Serper API 키가 없습니다." };
              } else {
                try {
                  const res = await fetch("https://google.serper.dev/search", {
                    method: "POST",
                    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ q: parameters.query, gl: "kr", hl: "ko" })
                  });
                  const data = await res.json();
                  const snippets = data.organic?.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n') || "결과 없음";
                  actionResult = { status: 'success', data: snippets };
                } catch (err) {
                  actionResult = { status: 'error', error: "검색 네트워크 오류" };
                }
              }
            } else {
              if (executorRef.current) {
                actionResult = await executorRef.current.executeTool(action, parameters);
              } else {
                actionResult = { status: 'error', error: "엔진 연결 끊김" };
              }
            }

            currentMessages = [...currentMessages, { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(actionResult) } as Message];
          }
          setMessages([...currentMessages]);
        } else {
          isTaskComplete = true;
        }
      }

      if (loopCount >= MAX_LOOPS && !isTaskComplete) {
        currentMessages = [...currentMessages, { role: 'assistant', content: "작업이 길어져 중단했습니다." } as Message];
        setMessages([...currentMessages]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '시스템 오류가 발생했습니다.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, sendMessage };
};