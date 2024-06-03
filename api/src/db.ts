import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import {
    workflows,
    workflow,
    environments,
    environment,
    nodes,
    node,
    edges,
    edge,
} from './schema'
import { eq } from 'drizzle-orm'

const sqlite = new Database('./data/store.db')
const db = drizzle(sqlite, { schema: { workflows, environments, nodes, edges } })

export async function getWorkflows() {
    return await db.select().from(workflows)
}

export async function getWorkflow(id: workflow['id']) {
    const nodesData = await db.select().from(nodes).where(eq(nodes.workflow_id, id))
    const edgesData = await db.select().from(edges).where(eq(edges.workflow_id, id))
    const environmentsData = await db.select().from(environments).where(eq(environments.workflow_id, id))

    return {
        environments: environmentsData,
        nodes: nodesData,
        edges: edgesData,
    }
}

export async function createWorkflow(workflow: workflow) {
    return await db.insert(workflows).values(workflow)
}

export async function updateWorkflow(id: workflow['id'], update: Partial<workflow>) {
    return await db.update(workflows).set(update)
       .where(eq(workflows.id, id))
}

export async function deleteWorkflow(id: workflow['id']) {
    return await db.delete(workflows).where(eq(workflows.id, id))
}

export async function createEnvironment(environment: environment) {
    return await db.insert(environments).values(environment)
}

export async function updateEnvironment(id: environment['id'], update: Partial<environment>) {
    return await db.update(environments).set(update)
       .where(eq(environments.id, id))
}

export async function deleteEnvironment(id: environment['id']) {
    return await db.delete(environments).where(eq(environments.id, id))
}

export async function createNode(node: node) {
    return await db.insert(nodes).values(node)
}

export async function updateNode(id: node['id'], update: Partial<node>) {
    return await db.update(nodes).set(update)
       .where(eq(nodes.id, id))
}

export async function deleteNode(id: node['id']) {
    return await db.delete(nodes).where(eq(nodes.id, id))
}

export async function createEdge(edge: edge) {
    return await db.insert(edges).values(edge)
}

export async function updateEdge(id: edge['id'], update: Partial<edge>) {
    return await db.update(edges).set(update)
       .where(eq(edges.id, id))
}

export async function deleteEdge(id: edge['id']) {
    return await db.delete(edges).where(eq(edges.id, id))
}
