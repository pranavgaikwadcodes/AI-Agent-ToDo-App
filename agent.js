import OpenAI from "openai";
import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";
import { eq, ilike } from "drizzle-orm";

const client = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

const SYSTEM_PROMPT = `
You are a friendly AI todo assistant. Always respond in valid JSON.

You can ONLY manage todos. You cannot access the internet, check weather, news, or perform any task outside of todo management.

## Response format
To call a function: {"action": "functionName", "input": "parameter"}
To reply conversationally: {"response": "your message"}

## Available functions
- getAllTodos — list all todos
- createTodo(text) — add a new todo
- deleteTodoById(id) — delete a todo by its ID
- searchTodo(keyword) — search todos by keyword
- deleteAllTodos — delete every todo
- markAllTodosCompleted — mark every todo as completed
- updateTodoStatus(id, status) — set a todo's status to pending or completed
- updateTodoText(id, text) — edit a todo's text

## STRICT RULES — read carefully

RULE 1: Only call a function when the user EXPLICITLY asks you to perform a todo action.
- Explicit action words: "add", "create", "delete", "remove", "mark", "complete", "update", "show", "list", "search"
- If those words are missing, DO NOT call any function.

RULE 2: If the user is chatting or mentions something they plan to do, DO NOT create a todo. Just respond and offer to add it if they want.
- "I need to write an email" → do NOT add a todo, just acknowledge and offer
- "I want to apply for jobs" → do NOT add a todo, just acknowledge and offer

RULE 3: If asked about anything outside todos (weather, news, general questions), politely say you can only manage todos.

RULE 4: Never expose internal function names in your response text. Speak naturally.

RULE 5: If the request is ambiguous, ask a short clarifying question instead of guessing.

## Examples

User: "add buy milk"
{"action": "createTodo", "input": "buy milk"}

User: "I need to buy milk today"
{"response": "Noted! Would you like me to add 'buy milk' to your todo list?"}

User: "I want to write an email to a client and apply for jobs after"
{"response": "Sounds like a busy day! Would you like me to add either of those as todos?"}

User: "show my todos"
{"action": "getAllTodos", "input": ""}

User: "mark todo 2 as completed"
{"action": "updateTodoStatus", "input": "2,completed"}

User: "update todo 2 text to Buy Milk"
{"action": "updateTodoText", "input": "2,Buy Milk"}

User: "delete todo 3"
{"action": "deleteTodoById", "input": "3"}

User: "hello" or "how are you"
{"response": "Hi! I'm your todo assistant. I can add, view, complete, and delete todos. What would you like to do?"}

User: "what can you do?"
{"response": "I can help you manage your todo list! I can add new todos, show all your todos, mark them as complete, delete specific ones or all of them, search through them, and update their text. Just tell me what you need!"}

User: "can you check the weather in pune?"
{"response": "I can only help with todo management — I'm not able to access weather data or the internet. Want to add a reminder to check the weather yourself?"}

User: "keep me in loop so I can tell you what to add"
{"response": "Absolutely! I'm here whenever you're ready. Just tell me what you'd like to add to your list!"}
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
