import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
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
    workflowRuns,
    workflowRun,
    workflowLogs,
    workflowLog,
} from './schema'
import { desc, eq, inArray } from 'drizzle-orm'
import { mkdir, exists } from 'node:fs/promises'
import { WorkflowData } from './global'
import { nanoid } from 'nanoid'

if (!await exists('./data')) {
    await mkdir('./data')
}

const sqlite = new Database('./data/store.db')
sqlite.exec('PRAGMA journal_mode = WAL;')
sqlite.exec('PRAGMA foreign_keys = ON;')

const db = drizzle(sqlite, { schema: { workflows, environments, nodes, edges } })

try {
    console.log('Running migrations...')
    migrate(db,{
        migrationsFolder: './drizzle',
    })
    console.log('Migrations complete!')
} catch (e) {
    console.error('Error running migrations', e)
    process.exit(1)
}

export async function getWorkflows() {
    return await db.select().from(workflows)
}

export async function getWorkflow(id: workflow['id']): Promise<WorkflowData> {
    const workflowData = await db.select().from(workflows).where(eq(workflows.id, id))
    const nodesData = await db.select().from(nodes).where(eq(nodes.workflowId, id))
    const edgesData = await db.select().from(edges).where(eq(edges.workflowId, id))
    const environmentsData = await db.select().from(environments).where(eq(environments.workflowId, id))

    return {
        workflow: workflowData[0],
        environments: environmentsData as environment[],
        nodes: nodesData as node[],
        edges: edgesData,
    }
}

export async function createWorkflow(workflow: workflow) {
    const environmentId = nanoid()
    workflow.currentEnvironmentId = environmentId
    await db.insert(workflows).values(workflow)
    await db.insert(environments).values({
        id: environmentId,
        name: 'Default',
        workflowId: workflow.id,
        env: {}
    })
}

export async function updateWorkflow(id: workflow['id'], update: Partial<workflow>) {
    return await db.update(workflows).set(update)
       .where(eq(workflows.id, id))
}

export async function deleteWorkflow(id: workflow['id']) {
    await db.delete(environments).where(eq(environments.workflowId, id))
    await db.delete(edges).where(eq(edges.workflowId, id))
    await db.delete(nodes).where(eq(nodes.workflowId, id))
    const workflowRunsData = await db.select(workflowRun.id).from(workflowRuns).where(eq(workflowRuns.workflowId, id))
    const workflowRunIds = workflowRunsData.map((run) => run.id)
    if (workflowRunIds.length > 0) {
        await db.delete(workflowLogs).where(inArray(workflowLogs.workflowRunId, workflowRunIds))
    }
    await db.delete(workflowRuns).where(eq(workflowRuns.workflowId, id))
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
    await db.delete(edges).where(eq(edges.source, id))
    await db.delete(edges).where(eq(edges.target, id))
    return await db.delete(nodes).where(eq(nodes.id, id))
}

export async function createEdge(edge: edge) {
    return await db.insert(edges).values(edge)
}

export async function deleteEdge(id: edge['id']) {
    return await db.delete(edges).where(eq(edges.id, id))
}

export async function getWorkflowRuns(workflowId: workflow['id']) {
    return await db.select().from(workflowRuns).where(eq(workflowRuns.workflowId, workflowId)).orderBy(desc( workflowRuns.createdAt))
}

export async function createWorkflowRun(run: workflowRun) {
    return await db.insert(workflowRuns).values(run)
}

export async function updateWorkflowRun(id: workflowRun['id'], update: Partial<workflowRun>) {
    return await db.update(workflowRuns).set(update)
       .where(eq(workflowRuns.id, id))
}

export async function deleteWorkflowRun(id: workflowRun['id']) {
    await db.delete(workflowLogs).where(eq(workflowLogs.workflowRunId, id))
    return await db.delete(workflowRuns).where(eq(workflowRuns.id, id))
}

export async function getWorkflowRunLogs(workflowRunId: workflowRun['id']) {
    return await db.select().from(workflowLogs).where(eq(workflowLogs.workflowRunId, workflowRunId))
}

export async function createWorkflowLog(log: workflowLog) {
    return await db.insert(workflowLogs).values(log)
}

export async function importWorkflow(workflowDataString: string) : Promise<workflow> {
    const workflowData: WorkflowData = JSON.parse(workflowDataString)

    const newWorkflowId = nanoid()
    const newWorkflow = {
        ...workflowData.workflow,
        id: newWorkflowId,
        currentEnvironmentId: null
    }
    await createWorkflow(newWorkflow)

    for (const environment of workflowData.environments) {
        const newEnvironment = {
            ...environment,
            id: nanoid(),
            workflowId: newWorkflowId
        }
        await createEnvironment(newEnvironment)
    }

    const nodeIdMap = new Map<string, string>()

    for (const node of workflowData.nodes) {
        const newNodeId = nanoid()
        nodeIdMap.set(node.id, newNodeId)
        await createNode({
            ...node,
            id: newNodeId,
            workflowId: newWorkflowId
        })
    }

    for (const edge of workflowData.edges) {
        const newEdgeId = nanoid()
        const newEdge = {
            ...edge,
            id: newEdgeId,
            workflowId: newWorkflowId,
            source: nodeIdMap.get(edge.source) || edge.source,
            target: nodeIdMap.get(edge.target) || edge.target
        }
        await createEdge(newEdge)
    }

    return newWorkflow
}
