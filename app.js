const { createServer } = require("node:http");
const config = require("./config"); 

let DEVICES = [
  { id: 1, device: "Smart Lamp", status: "on", room: "Kitchen" }
];

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  res.on('finish', () => {
    let level = 'INFO';
    if (res.statusCode >= 500) level = 'ERROR';
    else if (res.statusCode >= 400) level = 'WARN';

    const logMessage = `${new Date().toISOString()} | ${level} | ${method} | ${pathname} | ${res.statusCode}`;

    if (config.NODE_ENV === 'development') {
      console.log(logMessage); 
    } else if (config.NODE_ENV === 'production' && res.statusCode >= 400) {
      console.error(logMessage); 
    }
  });

  if (method === "GET" && pathname === "/health") {
    const healthInfo = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
    res.statusCode = 200;
    return res.end(JSON.stringify(healthInfo));
  }

  if (method === "GET" && pathname === "/devices") {
    const room = parsedUrl.searchParams.get("room");
    if (room !== null && room.trim() === "") {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Параметр 'room' не може бути порожнім." }));
    }
    let results = [...DEVICES];
    if (room) {
      results = results.filter((item) => item.room.toLowerCase() === room.toLowerCase());
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  if (method === "POST" && pathname === "/devices") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        if (!data.device || typeof data.device !== 'string' || data.device.trim() === '') {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'device' є обов'язковим і має бути не порожнім текстом." }));
        }
        if (!data.status || !['on', 'off'].includes(data.status)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'status' є обов'язковим (дозволені значення: 'on' або 'off')." }));
        }
        if (!data.room || typeof data.room !== 'string' || data.room.trim() === '') {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'room' є обов'язковим і має бути не порожнім текстом." }));
        }

        const nextId = DEVICES.length > 0 ? Math.max(...DEVICES.map(d => d.id)) + 1 : 1;
        const newDevice = { id: nextId, device: data.device.trim(), status: data.status, room: data.room.trim() };
        
        DEVICES.push(newDevice);
        res.statusCode = 201;
        res.end(JSON.stringify({ message: "Пристрій додано", item: newDevice }));
      } catch (err) {
        res.statusCode = 400; res.end(JSON.stringify({ error: "Некоректний JSON" }));
      }
    });
    return;
  }

  if (method === "PATCH" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
    if (isNaN(id)) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Некоректний ID пристрою." })); }

    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const index = DEVICES.findIndex((item) => item.id === id);
        if (index === -1) { res.statusCode = 404; return res.end(JSON.stringify({ error: "Пристрій не знайдено" })); }

        const updates = JSON.parse(body);
        if (updates.id) delete updates.id;

        if (updates.device !== undefined && (typeof updates.device !== 'string' || updates.device.trim() === '')) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'device' має бути не порожнім текстом." }));
        }
        if (updates.status !== undefined && !['on', 'off'].includes(updates.status)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'status' може бути лише 'on' або 'off'." }));
        }
        if (updates.room !== undefined && (typeof updates.room !== 'string' || updates.room.trim() === '')) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'room' має бути не порожнім текстом." }));
        }

        DEVICES[index] = { ...DEVICES[index], ...updates };
        res.statusCode = 200;
        res.end(JSON.stringify({ message: "Оновлено", item: DEVICES[index] }));
      } catch (err) { res.statusCode = 400; res.end(JSON.stringify({ error: "Некоректний JSON" })); }
    });
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
    if (isNaN(id)) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Некоректний ID пристрою." })); }

    const originalLength = DEVICES.length;
    DEVICES = DEVICES.filter((item) => item.id !== id);

    if (DEVICES.length < originalLength) {
      res.statusCode = 200; res.end(JSON.stringify({ message: `Видалено` }));
    } else {
      res.statusCode = 404; res.end(JSON.stringify({ error: "Не знайдено" }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Маршрут не знайдено" }));
});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Сервер працює в режимі [${config.NODE_ENV}] за адресою http://${config.HOSTNAME}:${config.PORT}/`);
});

function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Запит на зупинку. Закриваємо HTTP сервер...`);
  
  const shutdownTimeout = setTimeout(() => {
    console.error("Сервер не встиг закритися за 10 секунд. Примусове завершення (process.exit(1)).");
    process.exit(1);
  }, 10000);

  server.close((err) => {
    clearTimeout(shutdownTimeout);
    if (err) {
      console.error("Помилка при закритті сервера:", err);
      process.exit(1);
    }
    console.log("Сервер успішно закрито. Ресурси звільнено. (process.exit(0)).");
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection: ${reason}`);
  gracefulShutdown('unhandledRejection');
});