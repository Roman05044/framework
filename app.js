const { createServer } = require("node:http");

// БД пристроїв
let DEVICES = [
  { id: 1, device: "Smart Lamp", status: "on", room: "Kitchen" }
];

//.env
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  //сервер завжди повертає дані у форматі JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //GET список пристроїв фільтр по кімнаті (?room=Kitchen) 
  if (method === "GET" && pathname === "/devices") {
    const room = parsedUrl.searchParams.get("room");
    let results = [...DEVICES];

    if (room) {
      results = results.filter((item) => item.room.toLowerCase() === room.toLowerCase());
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  //POST додати новий пристрій 
  if (method === "POST" && pathname === "/devices") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        // Валідація вхідних даних
        if (!data.device || !data.status || !data.room) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поля 'device', 'status' та 'room' є обов'язковими." }));
        }

        const nextId = DEVICES.length > 0 ? Math.max(...DEVICES.map(d => d.id)) + 1 : 1;
        const newDevice = { id: nextId, device: data.device, status: data.status, room: data.room };
        
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

  //PATCH оновлення пристрою 
  if (method === "PATCH" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
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

  //DELETE
  if (method === "DELETE" && pathname.startsWith("/devices/")) {
    const id = parseInt(pathname.split("/")[2]);
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

  // Обробка всіх інших маршрутів
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Маршрут не знайдено" }));
});

// Запуск сервера node --env-file=.env app.js
server.listen(PORT, HOSTNAME, () => {
  console.log(`Сервер Розумного дому працює за адресою http://${HOSTNAME}:${PORT}/`);
});
