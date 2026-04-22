import { invoke } from "@tauri-apps/api/core";
import { AgentModule } from "./types";

export const BrowserModule: AgentModule = {
  id: "browser",
  name: "Browser Module",
  description: "인터넷 웹 검색 (Serper.dev) 및 웹페이지 마크다운 추출 (Jina Reader)",
  
  getTools: () => [
    {
      type: "function",
      function: {
        name: "web_search",
        description: "Serper API를 사용하여 빠르고 정확한 구글 웹 검색 결과를 JSON 형태로 가져옵니다.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
      }
    },
    {
      type: "function",
      function: {
        name: "open_url",
        description: "사용자의 기본 브라우저를 띄워서 특정 URL 화면을 직접 열어줍니다.",
        parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
      }
    },
    {
      type: "function",
      function: {
        name: "read_webpage",
        description: "Jina Reader API를 통해 특정 웹페이지(URL)의 본문 텍스트를 깨끗한 Markdown 형태로 추출해 읽어옵니다.",
        parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
      }
    }
  ],

  // 💡 context 객체를 통해 serperKey를 받아옵니다.
  execute: async (toolName: string, args: any, context?: any): Promise<string> => {
    switch (toolName) {
      case "web_search":
        if (!context?.serperKey) {
          throw new Error("시스템 설정에서 Serper.dev API 키를 먼저 입력해주세요.");
        }
        return await invoke<string>("web_search", { query: args.query, apiKey: context.serperKey });
        
      case "open_url":
        return await invoke<string>("open_url", { url: args.url });
        
      case "read_webpage":
        // Jina Reader는 기본적으로 별도 API 키 없이 사용 가능합니다.
        return await invoke<string>("read_webpage", { url: args.url });
        
      default:
        throw new Error(`[BrowserModule] 지원하지 않는 도구입니다: ${toolName}`);
    }
  }
};