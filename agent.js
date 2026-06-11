import OpenAI from "openai";
import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";
import { eq, ilike } from "drizzle-orm";

const client = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

const SYSTEM_PROMPT = `
You are a helpful AI todo assistant. Always respond in valid JSON.

Available functions:
- getAllTodos(): Get all todos
- createTodo(todo): Create new todo
- deleteTodoById(id): Delete todo by ID
- searchTodo(search): Search todos
- deleteAllTodos(): Delete all todos
- markAllTodosCompleted(): Mark all todos as completed
- updateTodoStatus(id, status): Update todo status by ID
- updateTodoText(id, text): Update todo text by ID

Response formats:
- To call function: {"action": "functionName", "input": "parameter"}
- To respond: {"response": "your message"}

Examples:
User: "show my todos"
Response: {"action": "getAllTodos", "input": ""}

User: "add buy milk"
Response: {"action": "createTodo", "input": "buy milk"}

User: "hello"
Response: {"response": "Hi! I can help manage your todos."}

User: "update todo 2 text to Buy Milk"
Response: {"action": "updateTodoText", "input": "2,Buy Milk"}

User: "mark todo 1 as completed"
Response: {"action": "updateTodoStatus", "input": "1,completed"}
`;

async function getAllTodos() {
    return await db.select().from(todosTable);
}

async function createTodo(todo) {
    const [result] = await db
        .insert(todosTable)
        .values({ todo, status: 'pending' })
        .returning({ id: todosTable.id });
    return result.id;
}

async function deleteTodoById(id) {
    await db.delete(todosTable).where(eq(todosTable.id, id));
    return `Deleted todo ${id}`;
}

async function updateTodoStatus(id, status) {
    await db.update(todosTable).set({ status }).where(eq(todosTable.id, id));
    return `Updated todo ${id} status to: ${status}`;
}

async function deleteAllTodos() {
    await db.delete(todosTable);
    return "Deleted all todos";
}

async function markAllTodosCompleted() {
    await db.update(todosTable).set({ status: 'completed' });
    return "Marked all todos as completed";
}

async function updateTodoText(id, text) {
    await db.update(todosTable).set({ todo: text }).where(eq(todosTable.id, id));
    return `Updated todo ${id} text to: ${text}`;
}

async function searchTodo(search) {
    return await db
        .select()
        .from(todosTable)
        .where(ilike(todosTable.todo, `%${search}%`));
}

const tools = {
    getAllTodos,
    createTodo,
    deleteTodoById,
    searchTodo,
    updateTodoStatus,
    deleteAllTodos,
    markAllTodosCompleted,
    updateTodoText,
};

async function executeTool(functionName, input) {
    const fn = tools[functionName];
    if (!fn) throw new Error(`Unknown function: ${functionName}`);

    switch (functionName) {
        case 'getAllTodos':
        case 'deleteAllTodos':
        case 'markAllTodosCompleted':
            return await fn();
        case 'createTodo':
        case 'searchTodo':
            return await fn(input);
        case 'deleteTodoById':
            return await fn(parseInt(input));
        case 'updateTodoStatus': {
            const [id, status] = String(input).split(',').map(s => s.trim());
            return await fn(parseInt(id), status);
        }
        case 'updateTodoText': {
            if (typeof input === 'object') {
                return await fn(parseInt(input.id), input.text);
            }
            const str = String(input);
            const commaIdx = str.indexOf(',');
            return await fn(parseInt(str.slice(0, commaIdx).trim()), str.slice(commaIdx + 1).trim());
        }
        default:
            return await fn();
    }
}

export async function runAgent(conversationHistory, userMessage) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: userMessage },
    ];

    for (let i = 0; i < 10; i++) {
        const chat = await client.chat.completions.create({
            model: 'qwen2.5:3b',
            messages,
            response_format: { type: 'json_object' },
        });

        const raw = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: raw });

        const action = JSON.parse(raw);

        if (action.response) return action.response;

        if (action.action) {
            try {
                const result = await executeTool(action.action, action.input);
                messages.push({
                    role: 'user',
                    content: `Function ${action.action} returned: ${JSON.stringify(result)}`,
                });
            } catch (err) {
                messages.push({
                    role: 'user',
                    content: `Function ${action.action} error: ${err.message}`,
                });
            }
        }
    }

    return "I couldn't complete that request. Please try again.";
}
