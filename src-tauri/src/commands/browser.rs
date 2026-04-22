use reqwest::Client;
use serde_json::json;

#[tauri::command]
pub async fn web_search(query: String, api_key: String) -> Result<String, String> {
    let client = Client::new();
    
    // Serper.dev 구글 검색 API 엔드포인트
    let res = client.post("https://google.serper.dev/search")
        .header("X-API-KEY", api_key)
        .header("Content-Type", "application/json")
        .json(&json!({
            "q": query,
            "gl": "kr", // 한국 지역 설정 (필요시 변경)
            "hl": "ko"  // 한국어 설정 (필요시 변경)
        }))
        .send()
        .await
        .map_err(|e| format!("검색 요청 실패: {}", e))?;

    let text = res.text().await.map_err(|e| format!("응답 본문 읽기 실패: {}", e))?;
    
    Ok(text)
}

#[tauri::command]
pub async fn read_webpage(url: String) -> Result<String, String> {
    let client = Client::new();
    
    // URL 앞에 r.jina.ai를 붙여서 Jina Reader API 호출
    let jina_url = format!("https://r.jina.ai/{}", url);
    
    let res = client.get(&jina_url)
        .header("Accept", "application/json") // 또는 텍스트만 원할 경우 기본값 사용
        .send()
        .await
        .map_err(|e| format!("Jina Reader 요청 실패: {}", e))?;

    let markdown_text = res.text().await.map_err(|e| format!("응답 본문 읽기 실패: {}", e))?;
    
    Ok(markdown_text)
}

// 사용자의 기본 브라우저로 특정 URL 열기
#[tauri::command]
pub fn open_url(url: String) -> Result<String, String> {
    // Windows의 'start' 명령어를 사용하여 기본 브라우저 호출
    let mut cmd = std::process::Command::new("cmd");
    cmd.arg("/C").arg("start").arg("").arg(&url);

    match cmd.spawn() {
        Ok(_) => Ok(format!("사용자의 기본 브라우저에서 다음 URL을 성공적으로 열었습니다: {}", url)),
        Err(e) => Err(format!("URL 열기 실패: {}", e)),
    }
}