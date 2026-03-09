const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const NODE_ENV = process.env.NODE_ENV;

// Валідація
if (!PORT || isNaN(PORT)) {
  console.error("Помилка: PORT відсутній або має некоректне значення.");
  process.exit(1);
}
if (!HOSTNAME) {
  console.error("Помилка: HOSTNAME відсутній.");
  process.exit(1);
}
if (!NODE_ENV || !['development', 'production'].includes(NODE_ENV)) {
  console.error("Помилка: NODE_ENV відсутній або некоректний (має бути development або production).");
  process.exit(1);
}

// для використання в app.js
module.exports = {
  PORT: parseInt(PORT, 10),
  HOSTNAME,
  NODE_ENV
};