#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

use dirs::data_dir;

use tauri::{
    generate_context, Builder, Manager, WindowEvent, PhysicalPosition, PhysicalSize
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// ====== AUDIO (Rodio) tramite thread dedicato + canale ======
use rodio::{Decoder, OutputStream, Sink};
use std::io::BufReader;

// ====== LOG ======
use log::{error, info};

/// Messaggio verso il thread audio.
struct PlayCmd {
    path: PathBuf,
    volume: f32,
}

/// In `State` salviamo solo il trasmettitore (è Send + Sync).
struct AudioTx(mpsc::Sender<PlayCmd>);

// ====== WINRT (solo Windows) ======
#[cfg(target_os = "windows")]
use windows::{
    core::HSTRING,
    Data::Xml::Dom::XmlDocument,
    UI::Notifications::{ToastNotification, ToastNotificationManager},
};

#[cfg(target_os = "windows")]
fn escape_xml_text(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

#[cfg(target_os = "windows")]
fn escape_xml_attr(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

#[cfg(target_os = "windows")]
fn to_image_uri(path: &str) -> String {
    let lower = path.to_lowercase();
    if lower.starts_with("http://") || lower.starts_with("https://") || lower.starts_with("file://") {
        return path.to_string();
    }
    // path locale assoluto -> trasformo in file:///
    format!("file:///{}", path.replace('\\', "/"))
}

/// Comando invocabile dal FE: invia una richiesta di riproduzione al thread audio.
/// `name`: file nella cartella risorse `<resources>/assets/` (default: "notify.wav")
/// `volume`: 0.0 .. 1.0 (default: 1.0)
#[tauri::command]
fn play_sound(
    app: tauri::AppHandle,
    tx: tauri::State<'_, AudioTx>,
    name: Option<String>,
    volume: Option<f32>,
) -> Result<(), String> {
    let file_name = name.unwrap_or_else(|| "notify.wav".to_string());

    // Risolvi il path del file audio dalla resource dir del bundle
    let asset_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("resource_dir error: {e}"))?
        .join("assets")
        .join(file_name);

    if !asset_path.exists() {
        return Err(format!("Audio non trovato: {}", asset_path.display()));
    }

    let vol = volume.unwrap_or(1.0).clamp(0.0, 1.0);

    tx.0.send(PlayCmd {
        path: asset_path.clone(),
        volume: vol,
    })
    .map_err(|e| format!("Invio al thread audio fallito: {e}"))?;

    info!("[AUDIO] play_sound richiesto: {} (vol={})", asset_path.display(), vol);
    Ok(())
}

// ====== NUOVO COMANDO: Toast WinRT con immagine a sinistra (Windows) ======
#[tauri::command]
fn notify_with_image_winrt(
    _app: tauri::AppHandle,
    title: String,
    body: String,
    image_path: String,
) -> Result<(), String> {
    // ramo non-Windows: ritorna errore “gentile” a runtime
    #[cfg(not(target_os = "windows"))]
    {
        return Err("notify_with_image_winrt è disponibile solo su Windows".into());
    }

    // ramo Windows
    #[cfg(target_os = "windows")]
    {
        // AUMID che hai verificato funzionare
        let aumid = "it-morimanno-taskmanager";

        let title_esc = escape_xml_text(&title);
        let body_esc = escape_xml_text(&body);
        let img_uri = escape_xml_attr(&to_image_uri(&image_path));

        // Layout: immagine a sinistra + testo a destra (ToastGeneric)
        // Se vuoi rotonda: aggiungi hint-crop="circle" nell'elemento <image>
        let xml = format!(
r#"<toast>
  <visual>
    <binding template="ToastGeneric">
      <image placement="appLogoOverride" src="{src}" />
      <text>{title}</text>
      <text>{body}</text>
    </binding>
  </visual>
</toast>"#,
            src = img_uri,
            title = title_esc,
            body = body_esc
        );

        let doc = XmlDocument::new().map_err(|e| format!("XmlDocument new error: {e:?}"))?;
        doc.LoadXml(&HSTRING::from(xml))
            .map_err(|e| format!("LoadXml error: {e:?}"))?;

        let notifier = ToastNotificationManager::CreateToastNotifierWithId(&HSTRING::from(aumid))
            .map_err(|e| format!("CreateToastNotifierWithId error: {e:?}"))?;

        let toast = ToastNotification::CreateToastNotification(&doc)
            .map_err(|e| format!("CreateToastNotification error: {e:?}"))?;

        notifier
            .Show(&toast)
            .map_err(|e| format!("Show error: {e:?}"))?;

        Ok(())
    }
}

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
        // 📜 LOG: inizializziamo il plugin di log
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Debug)
                .build(),
        )
        // 🔔 Plugin notifiche Tauri (fallback per altri OS)
        .plugin(tauri_plugin_notification::init())
        // 🔊 Comandi invocabili dal FE
        .invoke_handler(tauri::generate_handler![play_sound, notify_with_image_winrt])
        // 🪟 Eventi finestra
        .on_window_event({
            let backend_for_events = backend_for_events;
            move |win, event| match event {
                WindowEvent::CloseRequested { api, .. } => {
                    // ⬇️ NON chiudere: nascondi nella tray
                    api.prevent_close();
                    let _ = win.hide();
                    // volendo: notifica/tooltip per informare l’utente che resta in tray
                }
                WindowEvent::Destroyed => {
                    let mut lock = backend_for_events.lock().unwrap();
                    if let Some(mut child) = lock.take() {
                        let _ = child.kill();
                    }
                }
                WindowEvent::Resized(_) => {
                    if let Ok(false) = win.is_maximized() {
                        let _ = win.set_position(PhysicalPosition::new(0, 0));
                    }
                }
                _ => {}
            }
        })
        .setup(move |app| {
            // ====== Avvio thread audio una sola volta ======
            let (tx, rx) = mpsc::channel::<PlayCmd>();

            thread::spawn(move || {
                let (stream, handle) = match OutputStream::try_default() {
                    Ok(v) => {
                        info!("[AUDIO] OutputStream creato (default device)");
                        v
                    }
                    Err(e) => {
                        error!("[AUDIO] OutputStream error: {e}");
                        return;
                    }
                };

                while let Ok(cmd) = rx.recv() {
                    info!("[AUDIO] Riproduco: {} (vol={})", cmd.path.display(), cmd.volume);
                    match std::fs::File::open(&cmd.path) {
                        Ok(file) => match Decoder::new(BufReader::new(file)) {
                            Ok(source) => match Sink::try_new(&handle) {
                                Ok(sink) => {
                                    sink.set_volume(cmd.volume);
                                    sink.append(source);

                                    thread::spawn(move || {
                                        sink.sleep_until_end();
                                    });
                                }
                                Err(e) => error!("[AUDIO] Sink error: {e}"),
                            },
                            Err(e) => error!("[AUDIO] Decoder error: {e}"),
                        },
                        Err(e) => error!("[AUDIO] Apertura file audio fallita: {e}"),
                    }
                }

                drop(stream);
                info!("[AUDIO] Thread audio terminato");
            });

            // Espone il transmitter come State
            app.manage(AudioTx(tx));

            // ------- Setup finestra -------
            let win = app.get_webview_window("main").unwrap();

            let medium_size = PhysicalSize::new(990, 990);
            win.set_resizable(false)?;
            win.unmaximize()?;
            win.set_size(medium_size)?;
            win.set_position(PhysicalPosition::new(0, 0))?;
            win.maximize()?;
            win.show()?;

            // ---------- System Tray ----------
            use tauri::{
                menu::{MenuBuilder, MenuItemBuilder},
                tray::{TrayIconBuilder, TrayIconEvent},
            };

            let app_handle = app.handle();

            // Menu: solo "Chiudi"
            let quit_i = MenuItemBuilder::with_id("quit", "Chiudi").build(app_handle)?;

            let tray_menu = MenuBuilder::new(app_handle)
                .items(&[&quit_i])
                .build()?;

            // Per poter chiudere correttamente il backend Node
            let backend_for_tray = backend_process.clone();

            let _tray = TrayIconBuilder::with_id("tm_tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TaskManager in esecuzione")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)  // evita menu con click sinistro
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => {
                        // kill backend
                        if let Ok(mut lock) = backend_for_tray.lock() {
                            if let Some(mut child) = lock.take() {
                                let _ = child.kill();
                            }
                        }
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        // SOLO doppio click apre la finestra
                        TrayIconEvent::DoubleClick { .. } => {
                            let app = tray.app_handle();
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.show();
                                let _ = win.unminimize();
                                let _ = win.set_focus();
                            }
                        }

                        // Ignora TUTTO il resto
                        TrayIconEvent::Click { .. } => {}     // nessuna azione
                        TrayIconEvent::Enter { .. } => {}
                        TrayIconEvent::Move { .. } => {}
                        TrayIconEvent::Leave { .. } => {}

                        // variante extra di sicurezza
                        _ => {}
                    }
                })
                .build(app_handle)?;

            Ok(())
        })
        .run(generate_context!())
        .expect("Errore durante l'esecuzione Tauri");

    // ---- 7) PULIZIA FINALE ----
    {
        let mut lock = backend_for_cleanup
            .lock()
            .expect("Errore lock backend");
        if let Some(mut child) = lock.take() {
            let _ = child.kill();
        }
    }
}