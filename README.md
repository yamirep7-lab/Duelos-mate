# MathDuel: arquitectura

**Stack:** Node.js + Express, Socket.io (WebSockets), SQLite con `better-sqlite3` (migrable a PostgreSQL sin cambiar el esquema), `bcrypt` + `express-session`, y Vanilla JS sin build para el frontend.

```
mathduel/
├── shared/mathGenerator.js   # generador procedural (Node y navegador)
├── server/
│   ├── index.js              # API REST, auth, sockets, matchmaking, duelo
│   ├── elo.js                # cálculo de ranking
│   └── schema.sql            # users, matches, h2h
└── public/index.html         # interfaz (HTML + CSS + JS)
```

**Arrancar:** `npm install && npm start`, y abre dos navegadores (uno en ventana privada) con dos usuarios para probar un duelo.

**Decisiones clave**
- El servidor es la autoridad del PvP: genera las preguntas, guarda las respuestas, aplica el bloqueo de 1 s tras cada error y decide el ganador. El cliente nunca recibe la respuesta.
- Duelo: gana quien primero acierta 10 preguntas. El rival ve tu progreso en vivo.
- H2H: una fila por pareja con `user_a < user_b`; la racha se guarda como (dueño, longitud).
- Elo: K=32; ganarle a alguien con más Elo suma más.

**Pendiente para producción:** `SESSION_SECRET` real, store de sesiones persistente (Redis), rate-limit en login, HTTPS, validar el récord de supervivencia en servidor, reconexión tras caída de red y matchmaking por rango de Elo.
