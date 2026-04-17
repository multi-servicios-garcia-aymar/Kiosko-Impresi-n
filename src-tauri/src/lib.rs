use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_trial_data(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Create directory if it doesn't exist
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let trial_file = app_dir.join(".trial_info");
    
    if trial_file.exists() {
        let content = fs::read_to_string(trial_file).map_err(|e| e.to_string())?;
        Ok(content)
    } else {
        // First time use: Save current timestamp
        let now = chrono::Utc::now().to_rfc3339();
        fs::write(&trial_file, &now).map_err(|e| e.to_string())?;
        Ok(now)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();
  
  #[cfg(debug_assertions)]
  {
    builder = builder.plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    );
  }

  builder
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![get_machine_id, get_trial_data])
    .setup(|app| {
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
