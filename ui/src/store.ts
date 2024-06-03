import { defineStore } from 'pinia'
import { Workflow, Environment, Node, Edge } from '@/global'
import { nanoid } from 'nanoid'

interface State {
    workflows: Workflow[]
    activeWorkflow: Workflow | null
    environments: Environment[]
    selectedEnvironment: Environment | null
    nodes: Node[]
    edges: Edge[]
}

export const useStore = defineStore('counter', {
    state: (): State => {
        return {
            workflows: [],
            activeWorkflow: null,
            environments: [],
            selectedEnvironment: null,
            nodes: [],
            edges: [],
        }
    },
    actions: {
        addNode(node: Node) {
            this.nodes.push(node)
        },
        addEdge(edge: Edge) {
            this.edges.push(edge)
        },
        fetchFlow() {
            const id1 = nanoid()
            const id2 = nanoid()
            const id3 = nanoid()
            const id4 = nanoid()
            const id5 = nanoid()

            this.environments = [
                {
                    id: nanoid(),
                    workflowId: '1',
                    name: 'Development',
                    env: {
                        apiUrl: 'http://localhost:3000',
                        socketUrl: 'ws://localhost:3000',
                    },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    name: 'Production',
                    env: {
                        baseUrl: 'https://example.com',
                        socketUrl: 'wss://example.com',
                    },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                }
            ]

            this.selectedEnvironment = this.environments[0]

            this.nodes = [
                {
                    id: id1,
                    workflowId: '1',
                    type: 'Start',
                    data: {},
                    position: { x: 30, y: 30 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: id2,
                    workflowId: '1',
                    type: 'HTTPRequest',
                    data: {
                        method: 'POST',
                        url: '{{ apiUrl }}/user/login',
                        queryParams: [],
                        headers: [
                            { name: 'Content-Type', value: 'application/json', disabled: false }
                        ],
                        body: {
                            mimeType: 'application/json',
                            params: [],
                            text: '{"key": "value"}'
                        },
                        output: '$response.body.access_token'
                    },
                    position: { x: 350, y: 114 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: id3,
                    workflowId: '1',
                    type: 'SocketIO',
                    data: {
                        version: 4,
                        url: '{{ socketUrl }}?access_token=$output',
                        path: '/socket.io',
                    },
                    position: { x: 900, y: 114 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: id4,
                    workflowId: '1',
                    type: 'SocketIOListener',
                    data: {
                        eventName: 'connect',
                    },
                    position: { x: 1200, y: 114 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: id5,
                    workflowId: '1',
                    type: 'SocketIOListener',
                    data: {
                        eventName: 'message',
                    },
                    position: { x: 1200, y: 300 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    type: 'End',
                    data: {},
                    position: { x: 1500, y: 300 },
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
            ]

            this.edges = [
                {
                    id: nanoid(),
                    workflowId: '1',
                    source: id1,
                    sourceHandle: 'output',
                    target: id2,
                    targetHandle: 'input',
                    animated: true,
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    source: id2,
                    sourceHandle: 'output',
                    target: id3,
                    targetHandle: 'input',
                    animated: true,
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    source: id3,
                    sourceHandle: 'output',
                    target: id4,
                    targetHandle: 'input',
                    animated: true,
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    source: id3,
                    sourceHandle: 'output',
                    target: id5,
                    targetHandle: 'input',
                    animated: true,
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
                {
                    id: nanoid(),
                    workflowId: '1',
                    source: id5,
                    sourceHandle: 'output',
                    target: this.nodes[this.nodes.length - 1].id,
                    targetHandle: 'input',
                    animated: true,
                    createdAt: '2021-08-01T00:00:00.000Z',
                    updatedAt: '2021-08-01T00:00:00.000Z',
                },
            ]
        },
    },
})
