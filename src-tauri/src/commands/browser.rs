use reqwest::Client;
use serde_json::Value;
use tauri::command;

#[command]
pub async fn web_search(query: String, api_key: String) -> Result<String, String> {
    let client = Client::new();
    let res = client.post("https://api.tavily.com/search")
        .json(&serde_json::json!({
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": true
        }))
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;

    let json: Value = res.json().await.map_err(|e| format!("JSON 파싱 오류: {}", e))?;
    let mut result_text = String::new();
    
    if let Some(answer) = json["answer"].as_str() {
        if !answer.is_empty() { result_text.push_str(&format!("요약 답변: {}\n\n", answer)); }
    }
    
    if let Some(results) = json["results"].as_array() {
        result_text.push_str("검색 결과:\n");
        for item in results.iter().take(3) {
            let title = item["title"].as_str().unwrap_or("No title");
            let content = item["content"].as_str().unwrap_or("No content");
            result_text.push_str(&format!("- {}: {}\n", title, content));
        }
    }

    if result_text.is_empty() {
        Ok("검색 결과가 없습니다.".to_string())
    } else {
        Ok(result_text)
    }
}