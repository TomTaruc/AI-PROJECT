const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

const sHandoffGet = `
app.get('/api/admin/handoffs', require_admin, async (req, res) => {
   try {
     const result = await db.query('SELECT * FROM handoff_logs ORDER BY triggered_at DESC');
     res.json(result.rows);
   } catch(e) {
     res.status(500).json({error: e.message});
   }
});
`;

const sHandoffPatch = `
app.patch('/api/admin/handoff/:id', require_admin, async (req, res) => {
   try {
     const id = parseInt(req.params.id);
     await db.query('UPDATE handoff_logs SET status = $1 WHERE id = $2', [req.body.status, id]);
     res.json({success: true});
   } catch(e) {
     res.status(500).json({error: e.message});
   }
});
`;

const sFeedback = `
app.get('/api/admin/feedback', require_admin, async (req, res) => {
   try {
     const result = await db.query('SELECT * FROM feedback ORDER BY created_at DESC');
     res.json(result.rows);
   } catch(e) {
     res.status(500).json({error: e.message});
   }
});
`;

if (!file.includes("app.get('/api/admin/handoffs'")) {
    const attachIdx = file.indexOf("app.get('/api/admin/conversations/:session_id/messages'");
    if (attachIdx !== -1) {
       const attachEnd = file.indexOf("});", attachIdx) + 3;
       file = file.substring(0, attachEnd) + sHandoffGet + sHandoffPatch + sFeedback + file.substring(attachEnd);
    }
} else {
    // Endpoints exist, make sure they are correct
    console.log("Endpoints exist");
}

fs.writeFileSync('server.ts', file);
