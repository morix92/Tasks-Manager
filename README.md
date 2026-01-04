# Tasks-Manager 
Applicazione desktop offline-only per la gestione e la calendarizzazione delle attività personali.

Il progetto nasce come full-stack showcase per dimostrare competenze su:
- architettura applicativa
- sviluppo backend
- frontend moderno
- applicazioni desktop cross-platform

L’applicazione è pensata per girare completamente in locale, senza dipendenze esterne o servizi cloud.

## Stato del progetto 
In sviluppo...

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

## Scelte Architetturali

### Obiettivo
L'applicazione è progettata per essere completamente offline e autonoma.
L'obiettivo finale è ottenere un unico eseguibile che riunisca frontend, backend e database.
### Perché SQLite?
SQLite consente all'app di funzionare senza servizi esterni, semplifica la distribuzione e la rende adatta ad un contesto desktop offline.
### Perché niente Docker?
Docker è stato inizialmente utilizzato durante lo sviluppo, ma successivamente rimosso per evitare inutili complessità non coerenti con l'obiettivo finale.


## Roadmap
- Setup progetto e documentazione iniziale
- Database SQLite con schema iniziale
- Backend API  (CRUD)
- Frontend Angular
- Integrazione FE <-> BE
- Integrazione Desktop con Tauri
- Build applicazione desktop (.exe)
- Rifinitura UX


## Avvio
Istruzioni disponibili a progetto completato, ma l'obiettivo finale è quello di fornire un file eseguibile con avvio immediato dell'applicazione e senza alcuna configurazione manuale
