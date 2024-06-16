import { workflow, environment, node, edge } from './schema'
import { Socket as SocketV2 } from 'socket.io-client-v2'
import { Socket as SocketV3 } from 'socket.io-client-v3'
import { Socket as SocketV4 } from 'socket.io-client-v4'

declare module 'socket.io-client-v2' {
    import { EventEmitter } from 'events';

    namespace SocketIOClient {
        interface Socket extends EventEmitter {
            id: string;
            connected: boolean;
            disconnected: boolean;
            connect(): this;
            open(): this;
            disconnect(): this;
            close(): this;
            emit(event: string, ...args: any[]): this;
            on(event: 'connect' | 'disconnect' | string, callback: (...args: any[]) => void): this;
            once(event: string, callback: (...args: any[]) => void): this;
            onevent(packet: { type: string; data: any[] }): void;
        }

        interface ManagerOptions {
            reconnection?: boolean;
        }

        interface SocketOptions {
            path?: string;
        }
    }

    function io(uri: string, opts?: SocketIOClient.ManagerOptions & SocketIOClient.SocketOptions): SocketIOClient.Socket;
    export = io;
}

export interface WorkflowData {
    workflow: workflow
    environments: environment[]
    nodes: node[]
    edges: edge[]
}

export type SocketIO = SocketV2 | SocketV3 | SocketV4

export type NodeMap = { [id: string]: node }

export type EdgeMap = { [source: string]: edge[] }

export type SocketIoMap = { [workflowRunId: string]: { [branchId: string]: { [id: string]: SocketIO } } }

export type WebSocketMap = { [workflowRunId: string]: { [branchId: string]: { [id: string]: WebSocket } } }

export type NodeOutput = { [nodeId: string]: any }
