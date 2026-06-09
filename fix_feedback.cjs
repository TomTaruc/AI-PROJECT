const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

file = file.replace('SELECT id, session_id, rating, message_content, created_at FROM feedback', 'SELECT id, session_id, rating, message, created_at FROM feedback');

fs.writeFileSync('server.ts', file);
