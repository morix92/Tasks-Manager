const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra'); // fs-extra per copiare cartelle

// Controlla che Tauri abbia impostato la cartella dati
if (!process.env.TASK_MANAGER_DATA_DIR) {
  console.warn("⚠️ TASK_MANAGER_DATA_DIR non definita ⇒ modalità DEV attiva");

  // Percorso locale (dentro la cartella backend) dove già risiede tasks.db
  const localDevPath = path.join(__dirname, '..','data');

  process.env.TASK_MANAGER_DATA_DIR = localDevPath;

  console.log("📁 TASK_MANAGER_DATA_DIR (DEV):", process.env.TASK_MANAGER_DATA_DIR);
} else {
  console.log("📁 TASK_MANAGER_DATA_DIR (TAURI):", process.env.TASK_MANAGER_DATA_DIR);
}

// Cartella persistente per DB e avatar
const dataDir = process.env.TASK_MANAGER_DATA_DIR;
const dbDir = path.join(dataDir, 'data');
fs.ensureDirSync(dbDir);

// Percorso del DB
const dbPath = path.join(dbDir, 'tasks.db');

// Inizializza DB
const db = new Database(dbPath);

module.exports = db;
