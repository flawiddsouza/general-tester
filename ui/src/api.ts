import { treaty } from '@elysiajs/eden'
import type { App } from '../../api/src/index'
import { Workflow, WorkflowData, Environment, Node, Edge, WorkflowRunData } from './global'
import { workflowRun } from '../../api/src/schema'

const client = treaty<App>('localhost:9002')

export async function getWorkflows(): Promise<Workflow[]> {
    const { data: workflows } = await client.api.workflows.get()

    return workflows as Workflow[]
}

export async function getWorkflow(id: string): Promise<WorkflowData> {
    const { data: workflowData } = await client.api.workflow({ id }).get()

    return workflowData as WorkflowData
}

export async function createWorkflow(workflow: Workflow): Promise<void> {
    const { data } = await client.api.workflow.post(workflow)
    console.log(data)
}

export async function updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<void> {
    const { data } = await client.api.workflow({ id }).put(workflow)
    console.log(data)
}

export async function deleteWorkflow(id: string): Promise<void> {
    const { data } = await client.api.workflow({ id }).delete()
    console.log(data)
}

export async function createEnvironment(environment: Environment): Promise<void> {
    const { data } = await client.api.environment.post(environment)
    console.log(data)
}

export async function updateEnvironment(id: string, environment: Partial<Environment>): Promise<void> {
    const { data } = await client.api.environment({ id }).put(environment)
    console.log(data)
}

export async function deleteEnvironment(id: string): Promise<void> {
    const { data } = await client.api.environment({ id }).delete()
    console.log(data)
}

export async function createNode(node: Node): Promise<void> {
    const { data } = await client.api.node.post(node)
    console.log(data)
}

export async function updateNode(id: string, node: Partial<Node>): Promise<void> {
    const { data } = await client.api.node({ id }).put(node)
    console.log(data)
}

export async function deleteNode(id: string): Promise<void> {
    const { data } = await client.api.node({ id }).delete()
    console.log(data)
}

export async function createEdge(edge: Edge): Promise<void> {
    const { data } = await client.api.edge.post(edge)
    console.log(data)
}

export async function deleteEdge(id: string): Promise<void> {
    const { data } = await client.api.edge({ id }).delete()
    console.log(data)
}

export async function runWorkflow(id: string): Promise<workflowRun> {
    const { data } = await client.api.workflow({ id }).run.post()
    return data as workflowRun
}

export async function getWorkflowRuns(id: string): Promise<workflowRun[]> {
    const { data } = await client.api.workflow({ id }).runs.get()
    return data as workflowRun[]
}

export async function stopWorkflowRun(id: string): Promise<void> {
    const { data } = await client.api['workflow-run']({ id }).stop.post()

    console.log(data)
}

export async function deleteWorkflowRun(id: string): Promise<void> {
    const { data } = await client.api['workflow-run']({ id }).delete()
    console.log(data)
}

export async function getWorkflowRunData(id: string): Promise<WorkflowRunData> {
    const { data } = await client.api['workflow-run']({ id }).get()
    return data as WorkflowRunData
}

export async function importWorkflow(workflowData: string): Promise<Workflow> {
    const { data } = await client.api.workflow.import.post({ workflowData })
    return data as Workflow
}
