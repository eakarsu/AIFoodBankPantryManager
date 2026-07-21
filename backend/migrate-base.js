'use strict';
const { initDb } = require('./server');
initDb().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
