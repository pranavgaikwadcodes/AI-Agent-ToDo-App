import OpenAI from "openai";
import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";
import { eq, ilike } from "drizzle-orm";
import readlineSync from "readline-sync";

const client = new OpenAI({
    baseURL: 'http://localhost:11434/v1',  // Ollama server
    apiKey: 'ollama' // Required but not actually used by Ollama
});

// Tools
async function getAllTodos() {
    try {
        const todos = await db.select().from(todosTable);
        return todos;
    } catch (error) {
        console.log("Error getting todos:", error.message);
        return [];
    }
}

async function createTodo(todo) {
    const [result] = await db
        .insert(todosTable)
        .values({ todo, status: 'pending' })
        .returning({
            id: todosTable.id,
        });
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
    try {
        const todos = await db
            .select()
            .from(todosTable)
            .where(ilike(todosTable.todo, `%${search}%`));
        return todos;
    } catch (error) {
        console.log("Error searching todos:", error.message);
        return [];
    }
}

const tools = {
    getAllTodos: getAllTodos,
    createTodo: createTodo,
    deleteTodoById: deleteTodoById,
    searchTodo: searchTodo,
    updateTodoStatus: updateTodoStatus,
    deleteAllTodos: deleteAllTodos,
    markAllTodosCompleted: markAllTodosCompleted,
    updateTodoText: updateTodoText,
};

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


const messages = [
    { role: "system", content: SYSTEM_PROMPT },
];

while (true) {
    const query = readlineSync.question('>> ');

    // Exit condition
    if (query.toLowerCase() === 'quit' || query.toLowerCase() === 'exit') {
        console.log("Goodbye!");
        break;
    }

    // Add user message (plain text, not JSON)
    messages.push({ role: 'user', content: query });

    try {
        const chat = await client.chat.completions.create({
            model: 'qwen2.5:3b',
            messages: messages,
            response_format: { type: 'json_object' },
        });

        const result = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: result });

        const action = JSON.parse(result);
        console.log("AI Action:", JSON.stringify(action, null, 2));

        // Handle response (just talking to user)
        if (action.response) {
            console.log('AI:', action.response);
            // No break - continue conversation
        }
        // Handle function call
        else if (action.action) {
            const functionName = action.action;
            const fn = tools[functionName];

            if (!fn) {
                console.log(`Error: Function ${functionName} not found`);
                continue;
            }

            try {
                let observation;

                // Handle different function types
                if (functionName === 'getAllTodos' || functionName === 'deleteAllTodos' || functionName === 'markAllTodosCompleted') {
                    observation = await fn();
                } else if (functionName === 'createTodo') {
                    observation = await fn(action.input);
                } else if (functionName === 'deleteTodoById') {
                    observation = await fn(parseInt(action.input));
                } else if (functionName === 'searchTodo') {
                    observation = await fn(action.input);
                } else if (functionName === 'updateTodoStatus') {
                    // This needs special handling for 2 parameters
                    const [id, status] = action.input.split(',').map(s => s.trim());
                    observation = await fn(parseInt(id), status);
                } else if (functionName === 'updateTodoText') {
                    let id, text;
                    if (typeof action.input === 'object') {
                        id = action.input.id;
                        text = action.input.text;
                    } else {
                        [id, text] = action.input.split(',', 2).map(s => s.trim());
                    }
                    observation = await fn(parseInt(id), text);
                } else {
                    // For functions that take no parameters
                    observation = await fn();
                }

                console.log("Function result:", observation);

                // Add function result to conversation for AI to interpret
                messages.push({
                    role: 'user',
                    content: `Function ${functionName} returned: ${JSON.stringify(observation)}`
                });

            } catch (error) {
                console.log("Function error:", error.message);
                messages.push({
                    role: 'user',
                    content: `Function ${functionName} error: ${error.message}`
                });
            }
        }
        // Handle unexpected format
        else {
            console.log("AI: I'm not sure how to respond to that. Can you rephrase?");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}