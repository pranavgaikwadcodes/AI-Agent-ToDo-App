import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './db/index.js';
import { todosTable, messagesTable } from './db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { runAgent } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/todos', async (_req, res) => {
    try {
        const todos = await db.select().from(todosTable).orderBy(asc(todosTable.createdAt));
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/:sessionId', async (req, res) => {
    try {
        const msgs = await db
            .select()
            .from(messagesTable)
            .where(eq(messagesTable.sessionId, req.params.sessionId))
            .orderBy(asc(messagesTable.createdAt));
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message?.trim()) {
        return res.status(400).json({ error: 'sessionId and message are required' });
    }

    try {
        const history = await db
            .select()
            .from(messagesTable)
            .where(eq(messagesTable.sessionId, sessionId))
            .orderBy(asc(messagesTable.createdAt));

        const conversationHistory = history.map(m => ({ role: m.role, content: m.content }));

        await db.insert(messagesTable).values({
            sessionId,
            role: 'user',
            content: message.trim(),
        });

        const response = await runAgent(conversationHistory, message.trim());

        await db.insert(messagesTable).values({
            sessionId,
            role: 'assistant',
            content: response,
        });

        res.json({ response });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/messages/:sessionId', async (req, res) => {
    try {
        await db.delete(messagesTable).where(eq(messagesTable.sessionId, req.params.sessionId));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve built React app in production
const distPath = join(__dirname, 'client/dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
});

await migrate(db, { migrationsFolder: './drizzle' });
console.log('Database migrations applied');

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
