export interface BaseNode {
    id: string
    workflowId: string
    position: { x: number, y: number }
    createdAt: string
    updatedAt: string
}

export interface StartNode extends BaseNode {
    type: 'Start'
    data: any
}

export interface EndNode extends BaseNode {
    type: 'End'
    data: any
}

export interface Param {
    name: string
    value: string
    disabled: boolean
}

export interface HTTPRequestNodeDataBody {
    mimeType: null | 'application/x-www-form-urlencoded' | 'application/json'
    params: Param[]
    text: string
}

export interface HTTPRequestNodeData {
    method: string
    url: string
    queryParams: Param[]
    headers: Param[]
    body: HTTPRequestNodeDataBody
    output: string
}

export interface HTTPRequestNode extends BaseNode {
    type: 'HTTPRequest'
    data: HTTPRequestNodeData
}

export interface SocketIONodeData {
    version: 2 | 3 | 4
    url: string
    path: string
}

export interface SocketIONode extends BaseNode {
    type: 'SocketIO'
    data: SocketIONodeData
}

export interface SocketIOListenerNodeData {
    eventName: string
}

export interface SocketIOListenerNode extends BaseNode {
    type: 'SocketIOListener'
    data: SocketIOListenerNodeData
}

export interface SocketIOEmitterNodeData {
    eventName: string
    eventBody: string
}

export interface SocketIOEmitterNode extends BaseNode {
    type: 'SocketIOEmitter'
    data: SocketIOEmitterNodeData
}

export type Node = StartNode | EndNode | HTTPRequestNode | SocketIONode | SocketIOListenerNode | SocketIOEmitterNode

export interface Edge {
    id: string
    workflowId: string
    source: string
    sourceHandle: string
    target: string
    targetHandle: string
    animated: boolean
    createdAt: string
    updatedAt: string
}

export interface Environment {
    id: string
    workflowId: string
    name: string
    env: { [key: string]: string }
    createdAt: string
    updatedAt: string
}

export interface Workflow {
    id: string
    name: string
    currentEnvironmentId: string | null
    createdAt: string
    updatedAt: string
}

export interface WorkflowData {
    environments: Environment[]
    nodes: Node[]
    edges: Edge[]
}
