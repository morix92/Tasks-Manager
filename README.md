# Tasks-Manager 
Applicazione desktop per la gestione e la calendarizzazione delle proprie attività.

L'obiettivo è realizzare un sistema completo full-stack utilizzabile come:
- Desktop App (Electron)
- Web App (Browser)

## Stato del progetto 
In sviluppo...

## Tech Stack
- Frontend: Angular
- Desktop: Electron
- Backend: Node.js (Express)
- Database: PostgreSQL
- Orchestrazione: Docker Compose


## Architettura 
```
____________________________________________________
|                                                          		|
|   +----------+          +----------+          +------------+  |
|   | Frontend | <------> | Backend  | <------> |            |  |
|   | Angular  |          | Node.js  |          | PostgreSQL |  |
|   +----------+          | Express  |          |            |	|
|        ^                +----------+          +------------+	|
|        |                                                 		|
|   +----------+                                           		|
|   | Electron |                                           		|
|   | Desktop  |                                           		|
|   +----------+                                           		|
|                                                          		|
|_________________ Docker Compose orchestration ________________|

```

## Roadmap
- Setup progetto e documentazione iniziale
- Database PostgreSQL con schema iniziale
- Backend API  (CRUD)
- Frontend Angular
- Integrazione FE <-> BE
- Desktop App con Electron
- Web App servita dal Backend
- Docker Compose per avvio completo
- Funzionalità aggiuntive


## Avvio
Istruzioni disponibili a progetto completato
