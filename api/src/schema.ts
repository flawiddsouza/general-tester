import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-typebox'
import { type Static } from 'elysia'

export const workflows = sqliteTable('workflows', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    currentEnvironmentId: text('currentEnvironmentId'),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const workflow = createInsertSchema(workflows)
export type workflow = Static<typeof workflow>

export const environments = sqliteTable('environments', {
    id: text('id').primaryKey(),
    workflowId: text('workflowId').references(() => workflows.id, { onDelete: 'restrict' }).notNull(),
    name: text('name').notNull(),
    env: text('env', { mode: 'json' }).notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const environment = createInsertSchema(environments)
export type environment = Static<typeof environment>

export const nodes = sqliteTable('nodes', {
    id: text('id').primaryKey(),
    workflowId: text('workflowId').references(() => workflows.id, { onDelete: 'restrict' }).notNull(),
    type: text('type').notNull(),
    data: text('data', { mode: 'json' }).notNull(),
    position: text('position', { mode: 'json' }).notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const node = createInsertSchema(nodes)
export type node = Static<typeof node>

export const edges = sqliteTable('edges', {
    id: text('id').primaryKey(),
    workflowId: text('workflowId').references(() => workflows.id, { onDelete: 'restrict' }).notNull(),
    source: text('source').references(() => nodes.id, { onDelete: 'restrict' }).notNull(),
    sourceHandle: text('sourceHandle').notNull(),
    target: text('target').references(() => nodes.id, { onDelete: 'restrict' }).notNull(),
    targetHandle: text('targetHandle').notNull(),
    animated: integer('animated', { mode: 'boolean' }).notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const edge = createInsertSchema(edges)
export type edge = Static<typeof edge>

export const workflowRuns = sqliteTable('workflowRuns', {
    id: text('id').primaryKey(),
    workflowId: text('workflowId').references(() => workflows.id, { onDelete: 'restrict' }).notNull(),
    environmentId: text('environmentId').references(() => environments.id, { onDelete: 'restrict' }),
    status: integer('status').notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const workflowRun = createInsertSchema(workflowRuns)
export type workflowRun = Static<typeof workflowRun>

export const workflowLogs = sqliteTable('workflowLogs', {
    workflowRunId: text('workflowRunId').references(() => workflowRuns.id, { onDelete: 'restrict' }).notNull(),
    nodeId: text('nodeId').references(() => nodes.id, { onDelete: 'restrict' }),
    nodeType: text('nodeType'),
    message: text('message').notNull(),
    data: text('data', { mode: 'json' }),
    debug: integer('debug', { mode: 'boolean' }).notNull(),
    timestamp: text('timestamp'),
})

export const workflowLog = createInsertSchema(workflowLogs)
export type workflowLog = Static<typeof workflowLog>
