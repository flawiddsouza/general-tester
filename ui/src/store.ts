import { defineStore } from 'pinia'
import { Workflow, Environment, Node, Edge, WorkflowLog } from '@/global'
import { nanoid } from 'nanoid'
import * as api from '@/api'

interface State {
    webSocket: WebSocket | null
    workflows: Workflow[]
    activeWorkflow: Workflow | null
    environments: Environment[]
    selectedEnvironment: Environment | null
    nodes: Node[]
    edges: Edge[]
    workflowLogs: WorkflowLog []
}

export const useStore = defineStore('store', {
    state: (): State => {
        return {
            webSocket: null,
            workflows: [],
            activeWorkflow: null,
            environments: [],
            selectedEnvironment: null,
            nodes: [],
            edges: [],
            workflowLogs: [],
        }
    },
    actions: {
        async addNode(node: Node) {
            await api.createNode(node)
        },
        async updateNode(nodeId: Node['id'], data: Partial<Node>) {
            await api.updateNode(nodeId, data)
        },
        async deleteNode(nodeId: Node['id']) {
            await api.deleteNode(nodeId)
        },
        async addEdge(edge: Edge) {
            await api.createEdge(edge)
        },
        async deleteEdge(edgeId: Edge['id']) {
            await api.deleteEdge(edgeId)
        },
        async fetchWorkflows(workflowId?: Workflow['id']) {
            this.workflows = await api.getWorkflows()
            if (workflowId) {
                this.activeWorkflow = this.workflows.find(workflow => workflow.id === workflowId) ?? null
            }
        },
        async createWorkflow(workflow: { name: Workflow['name'] }) {
            const workflowId = nanoid()

            await api.createWorkflow({
                id: workflowId,
                name: workflow.name,
                currentEnvironmentId: null,
            })

            await this.fetchWorkflows(workflowId)
        },
        async updateWorkflow(workflowId: Workflow['id'], data: Partial<Workflow>) {
            const workflow = this.workflows.find(workflow => workflow.id === workflowId)
            if (!workflow) {
                throw new Error('Workflow not found')
            }

            await api.updateWorkflow(workflowId, data)
        },
        async deleteWorkflow(workflowId: Workflow['id']) {
            const workflow = this.workflows.find(workflow => workflow.id === workflowId)
            if (!workflow) {
                throw new Error('Workflow not found')
            }

            await api.deleteWorkflow(workflowId)

            if (this.activeWorkflow?.id === workflowId) {
                this.activeWorkflow = null
                this.environments = []
                this.selectedEnvironment = null
                this.nodes = []
                this.edges = []
            }

            await this.fetchWorkflows()
        },
        async fetchActiveWorkflow() {
            if (!this.activeWorkflow) {
                throw new Error('No active workflow')
            }

            const workflowData = await api.getWorkflow(this.activeWorkflow.id)

            this.environments = workflowData.environments
            this.selectedEnvironment = this.environments.find(environment => environment.id === this.activeWorkflow?.currentEnvironmentId) ?? null
            this.nodes = workflowData.nodes
            this.edges = workflowData.edges
        },
        async runWorkflow(workflowId: Workflow['id']) {
            await api.runWorkflow(workflowId)
        },
        addWorkflowLog(data: string) {
            this.workflowLogs.push(JSON.parse(data))
        }
    },
})

export type StoreType = ReturnType<typeof useStore>
