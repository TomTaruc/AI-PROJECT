const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// Update UI routes
server = server.replace(`app.get('/', require_user, (req, res, next) => {`, `app.get('/chat', require_user, (req, res, next) => {`);

// Also change admin redirect in auth logic if not already done, but auth_routes handles login
// Actually auth_routes has the redirects for login.

// Now fix the require_admin middleware to be correct
// It already redirects to /admin/login

fs.writeFileSync('server.ts', server);
