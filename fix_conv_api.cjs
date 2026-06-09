const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

file = file.replace(/MAX\(c\.timestamp\) as timestamp/g, 'MAX(c.timestamp) as started_at');

fs.writeFileSync('server.ts', file);
