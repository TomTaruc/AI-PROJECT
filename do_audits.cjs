const fs = require('fs');
const html = fs.readFileSync('admin/admin.html', 'utf8');
const server = fs.readFileSync('server.ts', 'utf8');
const auth = fs.readFileSync('auth_routes.ts', 'utf8');

const log = [];
let passed = 0;

function check(name, test) {
  if (test) {
     log.push(`[PASS] ${name}`);
     passed++;
  } else {
     log.push(`[FAIL] ${name}`);
  }
}

// Admin Panel Checks
check("NAV_ITEMS array exists", html.includes("const NAV_ITEMS = ["));
check("switchSection function exists", html.includes("function switchSection("));
check("adminFetch function exists", html.includes("async function adminFetch("));
check("DOMContentLoaded event listener", html.includes("document.addEventListener('DOMContentLoaded'"));
check("section-dashboard ID", html.includes('id="section-dashboard"'));
check("section-users ID", html.includes('id="section-users"'));
check("section-knowledge-base ID", html.includes('id="section-knowledge-base"'));
check("section-conversations ID", html.includes('id="section-conversations"'));
check("section-handoff-queue ID", html.includes('id="section-handoff-queue"'));
check("section-feedback ID", html.includes('id="section-feedback"'));
check("section-settings ID", html.includes('id="section-settings"'));

// Endpoints Checks
check("GET /api/admin/users", server.includes("app.get('/api/admin/users'"));
check("POST /api/admin/users/create", server.includes("app.post('/api/admin/users/create'"));
check("GET /api/admin/conversations", server.includes("app.get('/api/admin/conversations'"));
check("GET /api/admin/handoffs", server.includes("app.get('/api/admin/handoffs'"));
check("GET /api/admin/feedback", server.includes("app.get('/api/admin/feedback'"));

check("Role selection login", auth.includes("renderRoleSelection()"));

log.push(`\nTotal Passed: ${passed} / 17`);

fs.writeFileSync('audit_results.log', log.join('\n'));
console.log("Audits complete");
