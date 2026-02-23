# Tasks-Manager 
Applicazione desktop offline-only per la gestione e la calendarizzazione delle attività personali.

Il progetto nasce come full-stack showcase per dimostrare competenze su:
- architettura applicativa
- sviluppo backend
- frontend moderno
- applicazioni desktop cross-platform

L’applicazione è pensata per girare completamente in locale, senza dipendenze esterne o servizi cloud.

## Features
- Creazione, modifica ed eliminazione attività
- Calendarizzazione con data e orario
- Gestione stato attività (pending, completed)
- Ricezione di notifiche windows
- Persistenza locale su SQLite
- Applicazione completamente offline
- Multi-profilo utente
- Personalizzazione dell'avatar del profilo e del suono della notifica

## Stato del progetto 
Completato.

## Tech Stack
- Database: SQLite (file-based, locale)
- Backend: Node.js (Express)
- Frontend: Angular
- Desktop: Tauri

## Architettura 
```
________________________________________________________________
|                                                          		|
|   +----------+   HTTP   +----------+          +------------+  |
|   | Frontend | <------> | Backend  | <------> |            |  |
|   | Angular  |          | Node.js  |          |   SQLite   |  |
|   +----------+          | Express  |          |            |	|
|                         +----------+          +------------+	|
|                                    	                     	|
|                                                          		|
|______________ Tauri - Desktop Container ______________________|

```

### Obiettivo
L'applicazione è progettata per essere completamente offline e autonoma.
L'obiettivo finale è ottenere un unico eseguibile che riunisca frontend, backend e database.

### Perché SQLite?
SQLite consente all'app di funzionare senza servizi esterni, semplifica la distribuzione e la rende adatta ad un contesto desktop offline.

## Milestones
- Setup progetto e documentazione iniziale
- Database SQLite con schema iniziale
- Backend API  (CRUD)
- Frontend Angular
- Integrazione FE <-> BE
- Integrazione Desktop con Tauri
- Implementazione notifiche 
- Build applicazione desktop (.exe)
- Rifinitura UX

## Installazione e Avvio
1. Scaricare il file `TaskManager_X.X.X_x64-setup.exe`
2. Eseguire il file di installazione
3. Se Windows mostra il messaggio "PC protetto da Windows":
   - Cliccare su "Ulteriori informazioni"
   - Selezionare "Esegui comunque"
4. Completare l'installazione
5. Avviare l'app tramite l'icona sul desktop

## Evolutive Future
### Notifiche Remote (Planned Feature)
È prevista l’integrazione di un sistema di notifiche remote tramite le API di Telegram.
Per ciascun profilo utente potrà essere associato un account Telegram. Al verificarsi di una scadenza o di un evento pianificato, l’applicazione invierà automaticamente, oltre alla notifica sul PC, un messaggio Telegram al profilo associato.

Nota: l’applicazione rimane progettata come desktop offline-first, tuttavia, l’invio delle notifiche Telegram, richiede una connessione Internet attiva e avviene solo se l’applicazione è in esecuzione (anche in background) sul PC dell’utente.