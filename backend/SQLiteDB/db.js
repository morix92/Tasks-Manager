const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra'); // fs-extra per copiare cartelle

// Controlla che Tauri abbia impostato la cartella dati
if (!process.env.TASK_MANAGER_DATA_DIR) {
  throw new Error("TASK_MANAGER_DATA_DIR non definita!");
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
