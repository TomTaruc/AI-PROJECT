const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf-8');

const uploadEndpoint = `
// Upload Document
app.post('/api/upload-document', require_admin, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({error: 'No file uploaded'});
        const filename = req.file.originalname;
        const text = "dummy parsed text";
        
        await db.query('CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, filename TEXT, source_type TEXT, character_count INT, upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        await db.query('CREATE TABLE IF NOT EXISTS chunks (id SERIAL PRIMARY KEY, document_id INT, content TEXT, embedding FLOAT8[])');
        
        const docRes = await db.query(
            'INSERT INTO documents (filename, source_type, character_count) VALUES ($1, $2, $3) RETURNING id',
            [filename, 'text', text.length]
        );
        const docId = docRes.rows[0].id;
        
        await db.query(
            'INSERT INTO chunks (document_id, content) VALUES ($1, $2)',
            [docId, text]
        );
        
        res.json({success: true, document_id: docId});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});
`;

if (!serverTs.includes('/api/upload-document')) {
    serverTs = serverTs.replace('app.post(\'/api/chat\'', uploadEndpoint + '\napp.post(\'/api/chat\'');
    fs.writeFileSync('server.ts', serverTs);
    console.log("Added /api/upload-document");
}
