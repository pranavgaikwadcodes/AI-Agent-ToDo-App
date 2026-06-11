import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const todosTable = pgTable("todos", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    todo: text().notNull(),
    status: text().notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const messagesTable = pgTable("messages", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: text('session_id').notNull(),
    role: text().notNull(),
    content: text().notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
