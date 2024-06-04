import { treaty } from '@elysiajs/eden'
import type { App } from '../../api/src/index'
import { Workflow, WorkflowData, Environment, Node, Edge } from './global'

const client = treaty<App>('localhost:9002')

export async function getWorkflows(): Promise<Workflow[]> {
    const { data: workflows } = await client.workflows.get()

    return workflows as Workflow[]
}

export async function getWorkflow(id: string): Promise<WorkflowData> {
    const { data: workflowData } = await client.workflow({ id }).get()

    return workflowData as WorkflowData
}

export async function createWorkflow(workflow: Workflow): Promise<void> {
    const { data } = await client.workflow.post(workflow)
    console.log(data)
}

export async function updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<void> {
    const { data } = await client.workflow({ id }).put(workflow)
    console.log(data)
}

export async function deleteWorkflow(id: string): Promise<void> {
    const { data } = await client.workflow({ id }).delete()
    console.log(data)
}

export async function createEnvironment(environment: Environment): Promise<void> {
    const { data } = await client.environment.post(environment)
    console.log(data)
}

export async function updateEnvironment(id: string, environment: Partial<Environment>): Promise<void> {
    const { data } = await client.environment({ id }).put(environment)
    console.log(data)
}

export async function deleteEnvironment(id: string): Promise<void> {
    const { data } = await client.environment({ id }).delete()
    console.log(data)
}

export async function createNode(node: Node): Promise<void> {
    const { data } = await client.node.post(node)
    console.log(data)
}

export async function updateNode(id: string, node: Partial<Node>): Promise<void> {
    const { data } = await client.node({ id }).put(node)
    console.log(data)
}

export async function deleteNode(id: string): Promise<void> {
    const { data } = await client.node({ id }).delete()
    console.log(data)
}

export async function createEdge(edge: Edge): Promise<void> {
    const { data } = await client.edge.post(edge)
    console.log(data)
}

export async function deleteEdge(id: string): Promise<void> {
    const { data } = await client.edge({ id }).delete()
    console.log(data)
}

export async function runWorkflow(id: string): Promise<void> {
    const { data } = await client.workflow({ id }).run.post()
    console.log(data)
}
