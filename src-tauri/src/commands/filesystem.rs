use std::fs;
use std::env;
use walkdir::WalkDir;
use tauri::command;

#[command]
pub fn list_directory(path: String) -> Result<Vec<String>, String> {
    let mut entries = Vec::new();
    match fs::read_dir(&path) {
        Ok(paths) => {
            for path in paths {
                if let Ok(entry) = path {
                    if let Ok(file_name) = entry.file_name().into_string() {
                        entries.push(file_name);
                    }
                }
            }
            Ok(entries)
        }
        Err(e) => Err(format!("디렉토리를 읽지 못했습니다: {}", e)),
    }
}

#[command]
pub fn read_text_file(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("파일을 읽지 못했습니다: {}", e)),
    }
}

#[command]
pub fn write_text_file(path: String, content: String) -> Result<String, String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(format!("파일 쓰기 성공: {}", path)),
        Err(e) => Err(format!("파일 쓰기 실패: {}", e)),
    }
}

#[command]
pub fn delete_path(path: String) -> Result<String, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("경로를 찾을 수 없습니다: {}", e))?;
    if metadata.is_dir() {
        match fs::remove_dir_all(&path) {
            Ok(_) => Ok(format!("폴더 삭제 성공: {}", path)),
            Err(e) => Err(format!("폴더 삭제 실패: {}", e)),
        }
    } else {
        match fs::remove_file(&path) {
            Ok(_) => Ok(format!("파일 삭제 성공: {}", path)),
            Err(e) => Err(format!("파일 삭제 실패: {}", e)),
        }
    }
}

#[command]
pub fn find_files(path: String, query: String, depth: usize) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();
    for entry in WalkDir::new(&path).max_depth(depth).into_iter().filter_map(|e| e.ok()) {
        let file_name = entry.file_name().to_string_lossy().to_lowercase();
        if file_name.contains(&query_lower) {
            results.push(entry.path().to_string_lossy().into_owned());
        }
    }
    if results.is_empty() {
        return Ok(vec!["검색 결과가 없습니다.".to_string()]);
    }
    Ok(results)
}

#[command]
pub fn copy_path(source: String, destination: String) -> Result<String, String> {
    std::fs::copy(&source, &destination)
        .map(|_| format!("성공적으로 복사되었습니다: {} -> {}", source, destination))
        .map_err(|e| format!("복사 실패: {}", e))
}

#[command]
pub fn move_path(source: String, destination: String) -> Result<String, String> {
    std::fs::rename(&source, &destination)
        .map(|_| format!("성공적으로 이동(이름 변경)되었습니다: {} -> {}", source, destination))
        .map_err(|e| format!("이동 실패: {}", e))
}

#[command]
pub fn get_user_home() -> String {
    std::env::var("USERPROFILE")
        .unwrap_or_else(|_| std::env::var("HOME").unwrap_or_else(|_| "C:\\".to_string()))
}