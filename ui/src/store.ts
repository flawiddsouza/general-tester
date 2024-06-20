import { defineStore } from 'pinia'
import { Workflow, Environment, Node, Edge, WorkflowLog } from '@/global'
import { nanoid } from 'nanoid'
import * as api from '@/api'
import { Ref } from 'vue'
import { workflowRun } from '../../api/src/schema'

interface State {
    webSocket: WebSocket | null
    workflows: Workflow[]
    activeWorkflow: Workflow | null
    environments: Environment[]
    selectedEnvironment: Environment | null
    nodes: Node[]
    edges: Edge[]
    workflowRuns: workflowRun[]
    activeWorkflowRun: workflowRun | null
    workflowLogs: WorkflowLog[]
    vueFlowRef: Ref<any> | null
    sidebarSelectedTab: 'workflows' | 'nodes' | 'runs' | 'log'
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
            workflowRuns: [],
            activeWorkflowRun: null,
            workflowLogs: [],
            vueFlowRef: null,
            sidebarSelectedTab: 'workflows',
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

            this.workflowLogs = []
            this.activeWorkflowRun = null
            this.fetchWorkflowRuns()
        },
        async runWorkflow(workflowId: Workflow['id']) {
            const workflowRun = await api.runWorkflow(workflowId)
            this.fetchWorkflowRuns()
            this.activeWorkflowRun = workflowRun
            this.sidebarSelectedTab = 'log'
        },
        addWorkflowLog(data: string) {
            const parsedData: WorkflowLog = JSON.parse(data)
            if(this.activeWorkflowRun?.id !== parsedData.workflowRunId) {
                return
            }
            this.workflowLogs.push(parsedData)
        },
        async fetchWorkflowRuns() {
            if (!this.activeWorkflow) {
                throw new Error('No active workflow')
            }

            this.workflowRuns = await api.getWorkflowRuns(this.activeWorkflow.id)
        },
        async fetchActiveWorkflowRunData() {
            if (!this.activeWorkflowRun) {
                throw new Error('No active workflow run')
            }

            const workflowRunData = await api.getWorkflowRunData(this.activeWorkflowRun.id)

            this.workflowLogs = workflowRunData.logs
        },
        async deleteWorkflowRun(workflowRunId: workflowRun['id']) {
            await api.deleteWorkflowRun(workflowRunId)

            if (this.activeWorkflowRun?.id === workflowRunId) {
                this.activeWorkflowRun = null
                this.workflowLogs = []
            }

            this.fetchWorkflowRuns()
        },
        async createEnvironment(environment: Environment) {
            if (!this.activeWorkflow) {
                throw new Error('No active workflow')
            }

            await api.createEnvironment({
                id: environment.id,
                name: environment.name,
                workflowId: this.activeWorkflow.id,
                env: {},
            })

            await this.changeEnvironment(environment.id)
        },
        async changeEnvironment(environmentId: Environment['id']) {
            if (!this.activeWorkflow) {
                throw new Error('No active workflow')
            }

            await this.updateWorkflow(this.activeWorkflow.id, { currentEnvironmentId: environmentId })
            this.activeWorkflow.currentEnvironmentId = environmentId

            await this.fetchActiveWorkflow()
        },
        async renameEnvironment(environmentId: Environment['id'], name: Environment['name']) {
            await api.updateEnvironment(environmentId, { name })

            const environment = this.environments.find(environment => environment.id === environmentId)
            if (environment) {
                environment.name = name
            }
        },
        async updateEnvironment(environmentId: Environment['id'], env: Environment['env']) {
            await api.updateEnvironment(environmentId, { env })
        },
        async deleteEnvironment(environmentId: Environment['id']) {
            if (!this.activeWorkflow) {
                throw new Error('No active workflow')
            }

            await api.deleteEnvironment(environmentId)

            if (this.selectedEnvironment?.id === environmentId) {
                const changeEnvironment = this.environments.find(environment => environment.id !== environmentId)
                if (changeEnvironment) {
                    await this.updateWorkflow(this.activeWorkflow.id, { currentEnvironmentId: changeEnvironment.id })
                    this.activeWorkflow.currentEnvironmentId = changeEnvironment.id
                } else {
                    await this.updateWorkflow(this.activeWorkflow.id, { currentEnvironmentId: null })
                    this.activeWorkflow.currentEnvironmentId = null
                }
            }

            await this.fetchActiveWorkflow()
        },
        async importWorkflow(workflowData: string) {
            const newWorkflow = await api.importWorkflow(workflowData)
            await this.fetchWorkflows(newWorkflow.id)
        },
    },
})

export type StoreType = ReturnType<typeof useStore>
