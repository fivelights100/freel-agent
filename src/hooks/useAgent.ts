import { useState } from "react";
import OpenAI from "openai";
import { 
  MAIN_INTENT_PROMPT, PLANNER_PROMPT, WEB_SEARCHER_PROMPT, 
  SECURITY_ASSESSOR_PROMPT, QA_VALIDATOR_PROMPT, MAIN_EXECUTOR_PROMPT 
} from "../agents/prompts";
import { 
  READ_TOOLS, WEB_TOOLS, EXECUTE_TOOLS, 
  getAllowedTools, executeToolCall 
} from "../agents/toolsExecutor";

export { systemPrompt } from "../agents/prompts"; 

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
};

interface UseAgentProps {
  openai: OpenAI | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  installedModules: string[];
  fsWhitelist: string[];
  userHome: string;
  setSystemStatus: React.Dispatch<React.SetStateAction<string>>;
  indexingDepth: number;
  serperKey: string; // 💡 tavilyKey에서 serperKey로 변경
}

const parseJsonSafe = (text: string | null) => {
  if (!text) return {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : "{}");
  } catch (e) {
    console.warn("JSON 파싱 실패 원본:", text);
    return {};
  }
};

export function useAgent({
  openai, messages, setMessages, installedModules, fsWhitelist, userHome, setSystemStatus, serperKey
}: UseAgentProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);

  // [핵심 로직] 권한이 제한된 에이전트의 자율 주행 루프
  const runAgentLoop = async (agentName: string, systemPrompt: string, userPrompt: string, allowedToolNames: string[]) => {
    if (!openai) throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    const allowedTools = getAllowedTools(installedModules, allowedToolNames); 
    let loopMessages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    let isDone = false;
    let loopCount = 0;
    const MAX_LOOPS = 10; 
    let finalJsonResponse: any = null;

    while (!isDone && loopCount < MAX_LOOPS) {
      loopCount++;
      setSystemStatus(`${agentName} 동작 중... (${loopCount})`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: loopMessages as any,
        tools: allowedTools.length > 0 ? allowedTools : undefined,
        tool_choice: allowedTools.length > 0 ? "auto" : undefined,
      });

      const msg = response.choices[0].message as Message;
      loopMessages.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const call of msg.tool_calls) {
          // 💡 serperKey를 주입
          const result = await executeToolCall(call, serperKey);
          loopMessages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: result });
        }
      } else {
        isDone = true;
        try {
          const contentStr = msg.content || "{}";
          const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
          finalJsonResponse = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
        } catch (e) {
          console.warn(`${agentName} JSON 파싱 실패, 원본:`, msg.content);
        }
      }
    }
    
    // 파싱 실패 또는 무한루프 강제 종료 시 안전한 더미 데이터 반환
    if (!finalJsonResponse) {
      finalJsonResponse = { 
        summary: "작업을 완료하지 못했습니다.", 
        steps: [], 
        execution_status: "FAIL",
        execution_logs: "도구 호출 횟수 초과 또는 알 수 없는 오류로 강제 종료되었습니다.",
        status: "FAIL",
        detail: "응답 파싱 불가",
        feedback: "응답 파싱 불가"
      };
    }
    return finalJsonResponse;
  };

  const sendMessage = async (userMsg: string) => {
    if (!openai) {
      setMessages(prev => [...prev, { role: "assistant", content: "🚨 OpenAI API Key를 먼저 등록해 주세요." } as Message]);
      return;
    }
    setIsProcessing(true);
    let currentMessages = [...messages, { role: "user", content: userMsg } as Message];
    setMessages(currentMessages);

    try {
      // 1. 총괄 에이전트 (의도 파악)
      setSystemStatus("의도 분석 중...");
      const intentRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: MAIN_INTENT_PROMPT }, { role: "user", content: userMsg }]
      });
      const intent = parseJsonSafe(intentRes.choices[0].message.content);

      if (intent.type === "chat") {
        setMessages(prev => [...prev, { role: "assistant", content: intent.response }]);
        return;
      }

      // 🔄 최대 5번까지 기획과 검증을 반복하는 루프 시작
      let planAttempts = 0;
      const MAX_PLAN_ATTEMPTS = 5;
      let isPlanApproved = false;
      let qaFeedback = "";
      
      let finalPlanResult: any = null;
      let finalWebReport = "웹 검색을 수행하지 않았습니다.";

      while (planAttempts < MAX_PLAN_ATTEMPTS && !isPlanApproved) {
        planAttempts++;
        
        // 2. 기획/설계 에이전트
        setSystemStatus(`기획/설계 중... (시도 ${planAttempts}/${MAX_PLAN_ATTEMPTS})`);
        let plannerContext = `사용자 요청: ${userMsg}\n시스템 홈: ${userHome}`;
        if (qaFeedback !== "") {
          plannerContext += `\n\n🚨 [이전 계획 거절 사유 - 반드시 수정하여 재설계할 것]:\n${qaFeedback}`;
        }
        
        const planResult = await runAgentLoop("기획/설계 에이전트", PLANNER_PROMPT, plannerContext, READ_TOOLS);

        // 3. 웹 검색 에이전트 (기획자가 필요하다고 판단했을 때만)
        let webReport = "웹 검색이 필요하지 않음.";
        if (planResult.requires_web_search) {
          setSystemStatus(`웹 검색 진행 중...`);
          const webContext = `사용자 요청: ${userMsg}\n검색할 항목: ${planResult.search_item || "관련 정보"}`;
          const webResult = await runAgentLoop("웹 검색 에이전트", WEB_SEARCHER_PROMPT, webContext, WEB_TOOLS);
          webReport = `[제목: ${webResult.title || '알 수 없음'}]\n요약 내용: ${webResult.abridged_text || '웹 검색 요약 실패'}`;
        }

        // 4. 위험성 평가 에이전트
        setSystemStatus(`위험성 평가 중... (${planAttempts})`);
        const assessRes = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SECURITY_ASSESSOR_PROMPT },
            { role: "user", content: `계획: ${JSON.stringify(planResult.steps)}\n화이트리스트: ${fsWhitelist.length > 0 ? fsWhitelist.join(", ") : "전체 허용"}` }
          ]
        });
        const assessCheck = parseJsonSafe(assessRes.choices[0].message.content);
        
        if (assessCheck.status === "FAIL") {
          qaFeedback = `위험성 평가 거절 사유: ${assessCheck.detail}`;
          continue; // 처음 기획 단계로 돌아감
        }

        // 5. 실행 전 검증 에이전트 (QA)
        setSystemStatus(`실행 전 검증 중... (${planAttempts})`);
        const qaPreRes = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: QA_VALIDATOR_PROMPT },
            { role: "user", content: `검증 모드: 사전(pre)\n목표: ${userMsg}\n계획: ${JSON.stringify(planResult.steps)}\n현재 루프 시도 횟수: ${planAttempts}` }
          ]
        });
        const qaPreCheck = parseJsonSafe(qaPreRes.choices[0].message.content);
        
        // 💡 상태값이 RETRY일 경우 피드백 기록 후 재기획. PASS면 루프 탈출.
        if (qaPreCheck.status === "RETRY") {
          qaFeedback = `논리 검증 피드백: ${qaPreCheck.feedback}`;
        } else {
          isPlanApproved = true;
          finalPlanResult = planResult;
          finalWebReport = webReport;
        }
      } // 🔄 루프 종료

      // 5회 시도 후에도 통과 못한 경우 방어 로직
      if (!isPlanApproved) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `⚠️ 복잡한 문제로 인해 5번의 재설계 시도에도 안전한 실행 계획을 수립하지 못했습니다.\n\n마지막 거절 사유: ${qaFeedback}\n\n요청을 조금 더 구체적으로 나누어 다시 질문해 주세요.` 
        }]);
        return; 
      }

      // 6. 메인 실행 에이전트
      setSystemStatus("계획 실행 중...");
      const execContext = `목표: ${userMsg}\n계획: ${JSON.stringify(finalPlanResult.steps)}\n참고 웹 정보: ${finalWebReport}`;
      const execResult = await runAgentLoop("실행 에이전트", MAIN_EXECUTOR_PROMPT, execContext, [...EXECUTE_TOOLS, ...READ_TOOLS]);

      // 7. 사후 검증 에이전트
      setSystemStatus("최종 결과 검증 중...");
      const qaPostRes = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: QA_VALIDATOR_PROMPT },
          { role: "user", content: `검증 모드: 사후(post)\n원래 목표: ${userMsg}\n실행 로그: ${JSON.stringify(execResult.execution_logs)}` }
        ]
      });
      const qaPostCheck = parseJsonSafe(qaPostRes.choices[0].message.content);

      // 최종 답변 출력
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✅ 작업이 완료되었습니다. (상태: **${execResult.execution_status}**)\n\n${execResult.execution_logs}\n\n💡 QA 코멘트: ${qaPostCheck.feedback || '특이사항 없음'}` 
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ 처리 중 시스템 오류 발생: ${error}` }]);
    } finally {
      setIsProcessing(false);
      setSystemStatus("대기 중...");
    }
  };

  return { isProcessing, sendMessage };
}