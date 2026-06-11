import OpenAI from "openai";
import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";
import { eq, ilike } from "drizzle-orm";
import readlineSync from "readline-sync";

const client = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama'
});

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', gray: '\x1b[90m', blue: '\x1b[34m',
};
const col = (color, text) => `${c[color]}${text}${c.reset}`;

// ── Todo display ──────────────────────────────────────────────────────────────
function printTodos(todos) {
    if (!todos || todos.length === 0) {
        console.log(`\n  ${col('gray', 'No todos found.')}\n`);
        return;
    }
    console.log();
    for (const t of todos) {
        const done = t.status === 'completed';
        const icon  = done ? col('green', '✓') : col('yellow', '○');
        const text  = done ? col('dim', t.todo) : t.todo;
        const id    = col('gray', `#${String(t.id).padStart(3)}`);
        console.log(`  ${icon}  ${id}  ${text}`);
    }
    const completed = todos.filter(t => t.status === 'completed').length;
    const pending   = todos.length - completed;
    const parts = [];
    if (completed) parts.push(col('green', `${completed} completed`));
    if (pending)   parts.push(col('yellow', `${pending} pending`));
    console.log(`\n  ${col('gray', `${todos.length} total`)} · ${parts.join(col('gray', ' · '))}\n`);
}

// ── Tool functions ────────────────────────────────────────────────────────────
async function getAllTodos() {
    return db.select().from(todosTable);
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
    return `Deleted todo #${id}`;
}

async function updateTodoStatus(id, status) {
    await db.update(todosTable).set({ status }).where(eq(todosTable.id, id));
    return `Updated #${id} → ${status}`;
}

async function deleteAllTodos() {
    await db.delete(todosTable);
    return "All todos deleted";
}

async function markAllTodosCompleted() {
    await db.update(todosTable).set({ status: 'completed' });
    return "All todos marked as completed";
}

async function updateTodoText(id, text) {
    await db.update(todosTable).set({ todo: text }).where(eq(todosTable.id, id));
    return `Updated #${id} text to: ${text}`;
}

async function searchTodo(search) {
    return db.select().from(todosTable).where(ilike(todosTable.todo, `%${search}%`));
}

const tools = {
    getAllTodos, createTodo, deleteTodoById, searchTodo,
    updateTodoStatus, deleteAllTodos, markAllTodosCompleted, updateTodoText,
};

// ── Execute action from AI response ──────────────────────────────────────────
async function executeAction(action) {
    const { action: fn, input } = action;
    switch (fn) {
        case 'getAllTodos':
        case 'deleteAllTodos':
        case 'markAllTodosCompleted':
            return tools[fn]();
        case 'createTodo':
            return tools.createTodo(input);
        case 'deleteTodoById':
            return tools.deleteTodoById(parseInt(input));
        case 'searchTodo':
            return tools.searchTodo(input);
        case 'updateTodoStatus': {
            const [id, status] = input.split(',').map(s => s.trim());
            return tools.updateTodoStatus(parseInt(id), status);
        }
        case 'updateTodoText': {
            let id, text;
            if (typeof input === 'object') {
                ({ id, text } = input);
            } else {
                [id, text] = input.split(',', 2).map(s => s.trim());
            }
            return tools.updateTodoText(parseInt(id), text);
        }
        default:
            throw new Error(`Unknown function: ${fn}`);
    }
}

// ── AI call ───────────────────────────────────────────────────────────────────
async function ask(messages) {
    const chat = await client.chat.completions.create({
        model: 'qwen2.5:3b',
        messages,
        response_format: { type: 'json_object' },
    });
    return chat.choices[0].message.content;
}

// ── Prompts ───────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a helpful AI todo assistant. Always respond in valid JSON.

Available functions:
- getAllTodos(): Get all todos
- createTodo(todo): Create new todo
- deleteTodoById(id): Delete todo by ID
- searchTodo(search): Search todos by text
- deleteAllTodos(): Delete all todos
- markAllTodosCompleted(): Mark all todos as completed
- updateTodoStatus(id, status): Update todo status (pending/completed)
- updateTodoText(id, text): Update todo text

Response formats:
- To call a function: {"action": "functionName", "input": "parameter"}
- To respond conversationally: {"response": "your message"}

For two-param functions use comma-separated input: "id,value"
`;

const SUMMARY_PROMPT = `
You are a helpful AI todo assistant. Always respond in valid JSON.
The user performed an action and you have the result. Give a short, friendly one-line summary.
Format: {"response": "your message"}
Keep it concise — one sentence max.
`;

// ── Main loop ─────────────────────────────────────────────────────────────────
const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

console.log(`\n  ${col('cyan', col('bold', 'Todo Assistant'))}  ${col('gray', '— type "exit" to quit')}\n`);

while (true) {
    const query = readlineSync.question(col('cyan', '>> '));

    if (!query.trim()) continue;
    if (query.toLowerCase() === 'quit' || query.toLowerCase() === 'exit') {
        console.log(`\n  ${col('gray', 'Goodbye!')}\n`);
        break;
    }

    messages.push({ role: 'user', content: query });

    try {
        // Step 1: AI decides what to do
        const raw = await ask(messages);
        messages.push({ role: 'assistant', content: raw });
        const action = JSON.parse(raw);

        if (action.response) {
            // Pure conversational reply
            console.log(`\n  ${col('blue', 'AI')}  ${action.response}\n`);

        } else if (action.action) {
            // Step 2: Execute the function
            let observation;
            try {
                observation = await executeAction(action);
            } catch (err) {
                console.log(`\n  ${col('red', '✗')}  ${err.message}\n`);
                messages.push({ role: 'user', content: `Function error: ${err.message}` });
                continue;
            }

            // Step 3: Display result with local formatting
            if (Array.isArray(observation)) {
                printTodos(observation);
            } else {
                console.log(`\n  ${col('green', '✓')}  ${observation}\n`);
            }

            // Step 4: Ask AI for a short natural-language summary
            const summaryMessages = [
                { role: 'system', content: SUMMARY_PROMPT },
                { role: 'user', content: `Action: ${action.action}, Result: ${JSON.stringify(observation)}` },
            ];
            try {
                const summaryRaw = await ask(summaryMessages);
                const summary = JSON.parse(summaryRaw);
                if (summary.response) {
                    console.log(`  ${col('blue', 'AI')}  ${summary.response}\n`);
                }
            } catch {
                // summary is optional — silently skip if it fails
            }

            // Keep function result in main conversation history
            messages.push({
                role: 'user',
                content: `Function ${action.action} returned: ${JSON.stringify(observation)}`
            });

        } else {
            console.log(`\n  ${col('gray', "I'm not sure how to help with that. Try rephrasing.")}\n`);
        }

    } catch (err) {
        console.error(`\n  ${col('red', 'Error')}  ${err.message}\n`);
    }
}
