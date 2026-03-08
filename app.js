const { createServer } = require("node:http");

let DEVICES = [
  { id: 1, device: "Smart Lamp", status: "on", room: "Kitchen" }
];

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // сервер завжди повертає дані у форматі JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // GET список пристроїв фільтр по кімнаті (?room=Kitchen) 
  if (method === "GET" && pathname === "/devices") {
    const room = parsedUrl.searchParams.get("room");
    
    // Валідація: якщо параметр room переданий, він не має бути порожнім
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

  // POST додати новий пристрій 
  if (method === "POST" && pathname === "/devices") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        // Ліпша валідація вхідних даних для POST
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
        const newDevice = { 
          id: nextId, 
          device: data.device.trim(), 
          status: data.status, 
          room: data.room.trim() 
        };
        
        DEVICES.push(newDevice);
        res.statusCode = 201;
        res.end(JSON.stringify({ message: "Пристрій додано", item: newDevice }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Некоректний формат JSON" }));
      }
    });
    return;
  }

  // PATCH оновлення пристрою 
  if (method === "PATCH" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
    
    // Валідація ID
    if (isNaN(id)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Некоректний ID пристрою." }));
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const index = DEVICES.findIndex((item) => item.id === id);
        if (index === -1) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Пристрій не знайдено" }));
        }

        const updates = JSON.parse(body);
        if (updates.id) delete updates.id;

        // Ліпша валідація вхідних даних для PATCH
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
        res.end(JSON.stringify({ message: "Пристрій оновлено", item: DEVICES[index] }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Некоректний формат JSON" }));
      }
    });
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
    
    // Валідація ID
    if (isNaN(id)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Некоректний ID пристрою." }));
    }

    const originalLength = DEVICES.length;
    
    DEVICES = DEVICES.filter((item) => item.id !== id);

    if (DEVICES.length < originalLength) {
      res.statusCode = 200;
      res.end(JSON.stringify({ message: `Пристрій з id ${id} видалено` }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Пристрій не знайдено" }));
    }
    return;
  }


  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Маршрут не знайдено" }));
});

// Запуск сервера node --env-file=.env app.js
server.listen(PORT, HOSTNAME, () => {
  console.log(`Сервер Розумного дому працює за адресою http://${HOSTNAME}:${PORT}/`);
});