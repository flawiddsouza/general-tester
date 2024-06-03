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
                    name: 'Development',
                    env: {
                        apiUrl: 'http://localhost:3000',
                        socketUrl: 'ws://localhost:3000',
                    }
                },
                {
                    name: 'Production',
                    env: {
                        baseUrl: 'https://example.com',
                        socketUrl: 'wss://example.com',
                    }
                }
            ]

            this.selectedEnvironment = this.environments[0]

            this.nodes = [
                {
                    id: id1,
                    type: 'Start',
                    data: {},
                    position: { x: 30, y: 30 },
                },
                {
                    id: id2,
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
                },
                {
                    id: id3,
                    type: 'SocketIO',
                    data: {
                        version: 4,
                        url: '{{ socketUrl }}?access_token=$output',
                        path: '/socket.io',
                    },
                    position: { x: 900, y: 114 },
                },
                {
                    id: id4,
                    type: 'SocketIOListener',
                    data: {
                        eventName: 'connect',
                    },
                    position: { x: 1200, y: 114 },
                },
                {
                    id: id5,
                    type: 'SocketIOListener',
                    data: {
                        eventName: 'message',
                    },
                    position: { x: 1200, y: 300 },
                },
                {
                    id: nanoid(),
                    type: 'End',
                    data: {},
                    position: { x: 1500, y: 300 },
                },
            ]

            this.edges = [
                {
                    id: nanoid(),
                    source: id1,
                    sourceHandle: 'output',
                    target: id2,
                    targetHandle: 'input',
                    animated: true,
                },
                {
                    id: nanoid(),
                    source: id2,
                    sourceHandle: 'output',
                    target: id3,
                    targetHandle: 'input',
                    animated: true,
                },
                {
                    id: nanoid(),
                    source: id3,
                    sourceHandle: 'output',
                    target: id4,
                    targetHandle: 'input',
                    animated: true,
                },
                {
                    id: nanoid(),
                    source: id3,
                    sourceHandle: 'output',
                    target: id5,
                    targetHandle: 'input',
                    animated: true,
                },
                {
                    id: nanoid(),
                    source: id5,
                    sourceHandle: 'output',
                    target: this.nodes[this.nodes.length - 1].id,
                    targetHandle: 'input',
                    animated: true,
                },
            ]
        },
    },
})
