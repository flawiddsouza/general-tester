import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-typebox'
import { type Static } from 'elysia'

export const workflows = sqliteTable('workflows', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    current_environment_id: text('current_environment_id'),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const workflow = createInsertSchema(workflows)
export type workflow = Static<typeof workflow>

export const environments = sqliteTable('environments', {
    id: text('id').primaryKey(),
    workflow_id: text('workflow_id').references(() => workflows.id).notNull(),
    name: text('name').notNull(),
    env: text('env', { mode: 'json' }).notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const environment = createInsertSchema(environments)
export type environment = Static<typeof environment>

export const nodes = sqliteTable('nodes', {
    id: text('id').primaryKey(),
    workflow_id: text('workflow_id').references(() => workflows.id).notNull(),
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
    workflow_id: text('workflow_id').references(() => workflows.id).notNull(),
    source: text('source').references(() => nodes.id).notNull(),
    sourceHandle: text('sourceHandle').notNull(),
    target: text('target').references(() => nodes.id).notNull(),
    targetHandle: text('targetHandle').notNull(),
    animated: integer('animated', { mode: 'boolean' }).notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export const edge = createInsertSchema(edges)
export type edge = Static<typeof edge>
