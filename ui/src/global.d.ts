export interface StartNode {
    id: string
    type: 'Start'
    data: any
    position: { x: number, y: number }
}

export interface EndNode {
    id: string
    type: 'End'
    data: any
    position: { x: number, y: number }
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

export interface HTTPRequestNode {
    id: string
    type: 'HTTPRequest'
    data: HTTPRequestNodeData
    position: { x: number, y: number }
}

export interface SocketIONodeData {
    url: string
    path: string
}

export interface SocketIONode {
    id: string
    type: 'SocketIO'
    data: SocketIONodeData
    position: { x: number, y: number }
}

export interface SocketIOListenerNodeData {
    eventName: string
}

export interface SocketIOListenerNode {
    id: string
    type: 'SocketIOListener'
    data: any
    position: { x: number, y: number }
}

export type Node = RootNode | HTTPRequestNode | SocketIONode | SocketIOListenerNode

export interface Edge {
    id: string
    source: string
    sourceHandle: string
    target: string
    targetHandle: string
    animated: boolean
}
