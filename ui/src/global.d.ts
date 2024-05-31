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

export interface RootNode {
    id: string
    type: 'Root'
    data: any
    position: { x: number, y: number }
}

export interface HTTPRequestNode {
    id: string
    type: 'HTTPRequest'
    data: HTTPRequestNodeData
    position: { x: number, y: number }
}

export interface SocketIONode {
    id: string
    type: 'SocketIO'
    data: SocketIONodeData
    position: { x: number, y: number }
}

export type Node = RootNode | HTTPRequestNode | SocketIONode
