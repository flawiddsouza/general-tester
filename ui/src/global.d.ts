export interface HTTPRequestNodeData {
    method: string
    url: string
    headers: { [key: string]: string}[]
    body: string
    output: string
}

export interface SocketIONodeData {
    url: string
    path: string
}

export interface HTTPRequestNode extends Node {
    id: string
    type: 'HTTPRequest'
    data: HTTPRequestNodeData
}

export interface SocketIONode extends Node {
    id: string
    type: 'SocketIO'
    data: SocketIONodeData
}

export type Node = HTTPRequestNode | SocketIONode
