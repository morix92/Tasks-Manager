#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};

use dirs::data_dir;
use tauri::{generate_context, Builder, Manager, WindowEvent};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn main() {
    // ---- 1) PREPARAZIONE DIRECTORY DATI ----
    let data_path: PathBuf = data_dir().unwrap().join("TaskManager");
    fs::create_dir_all(&data_path).unwrap();

    // ---- 2) PERCORSI DEL BACKEND NODE ----
    let exe_path = std::env::current_exe().unwrap();
    let exe_dir = exe_path.parent().unwrap();
    let backend_dir = exe_dir.join("_up_").join("backend");
    let node_path = backend_dir.join("node").join("node.exe");
    let index_js = backend_dir.join("index.js");

    // ---- 3) STATO DEL PROCESSO NODE ----
    let backend_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

    // ---- 4) AVVIO DEL BACKEND NODE ----
    {
        let mut cmd = Command::new(node_path);
        cmd.arg(index_js)
            .current_dir(&backend_dir)
            .env("TASK_MANAGER_DATA_DIR", &data_path);

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let child = cmd.spawn().expect("Impossibile avviare il backend Node");
        *backend_process.lock().unwrap() = Some(child);
    }

    // ---- 5) CLONI PER EVENTI E PULIZIA ----
    let backend_for_events = backend_process.clone();
    let backend_for_cleanup = backend_process.clone();

    // ---- 6) COSTRUZIONE DELL'APP TAURI ----
    Builder::default()
        // Nota: niente più debounce su Moved, niente flag minimized.
        .on_window_event({
            let backend_for_events = backend_for_events;

            move |win, event| {
                match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        let mut lock = backend_for_events.lock().unwrap();
                        if let Some(mut child) = lock.take() {
                            let _ = child.kill();
                        }
                        win.app_handle().exit(0);
                    }

                    WindowEvent::Destroyed => {
                        let mut lock = backend_for_events.lock().unwrap();
                        if let Some(mut child) = lock.take() {
                            let _ = child.kill();
                        }
                    }

                    _ => {}
                }
            }
        })
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            // 1) Avvio massimizzato
            win.maximize()?;
            // 2) Da qui in poi l’utente può fare tutto liberamente:
            //    - niente set_resizable(false)
            //    - nessun vincolo post-avvio
            win.show()?;
            Ok(())
        })
        .run(generate_context!())
        .expect("Errore durante l'esecuzione Tauri");

    // ---- 7) PULIZIA FINALE ----
    {
        let mut lock = backend_for_cleanup.lock().expect("Errore lock backend");
        if let Some(mut child) = lock.take() {
            let _ = child.kill();
        }
    }
}