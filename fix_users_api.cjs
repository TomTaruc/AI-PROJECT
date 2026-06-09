const fs = require('fs');

let file = fs.readFileSync('server.ts', 'utf8');

const sQuery = "SELECT id, username, email, role, created_at, used_access_code, last_login, is_active, created_by FROM users ORDER BY created_at DESC";
const tQuery = `SELECT u.id, u.username, u.email, u.role, u.created_at, u.used_access_code, u.last_login, u.is_active, u.created_by, (SELECT COUNT(m.id) FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.session_id IN (SELECT session_token FROM user_sessions WHERE user_id = u.id)) as message_count FROM users u ORDER BY u.created_at DESC`;

file = file.replace(sQuery, tQuery);

// Add a middleware to set headers for /api/*
if (!file.includes("app.use('/api', (req, res, next)")) {
    const afterHeadersIdx = file.indexOf('app.use(cookieParser());');
    if (afterHeadersIdx !== -1) {
        file = file.substring(0, afterHeadersIdx + 24) + "\napp.use('/api', (req, res, next) => { res.setHeader('Content-Type', 'application/json'); next(); });" + file.substring(afterHeadersIdx + 24);
    }
}

fs.writeFileSync('server.ts', file);
