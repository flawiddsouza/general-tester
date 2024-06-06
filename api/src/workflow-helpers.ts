import { WorkflowData } from './global'
import { edge, node } from './schema'
import type {
    HTTPRequestNode,
    SocketIONode,
    SocketIOListenerNode,
    SocketIOEmitterNode,
    IfConditionNode,
} from '../../ui/src/global'
import { connectedClients } from './index'
// @ts-ignore
import ioV2 from 'socket.io-client-v2'
// @ts-ignore
import { io as ioV3 } from 'socket.io-client-v3'
import { io as ioV4 } from 'socket.io-client-v4'

type NodeMap = { [id: string]: node }
type EdgeMap = { [source: string]: edge[] }
type SocketMap = { [id: string]: any }

const socketConnections: SocketMap = {}

function logWorkflowMessage({ workflowId, nodeId = null, nodeType = null, message, data = null, debug }: {
    workflowId: string,
    nodeId?: string | null,
    nodeType?: string | null,
    message: string,
    data?: any | null,
    debug: boolean
}) {
    console.log(message)
    connectedClients.forEach((client) => {
        client.send({
            workflowId,
            nodeId,
            nodeType,
            debug,
            message,
            data: data ?? null,
        })
    })
}

export async function runWorkflow(workflowData: WorkflowData) {
    logWorkflowMessage({
        workflowId: workflowData.workflow.id,
        message: `Running workflow: ${workflowData.workflow.name}`,
        debug: true
    })

    const nodes: NodeMap = {}
    const edges: EdgeMap = {}

    // Create a map of nodes and edges for easy lookup
    workflowData.nodes.forEach((node) => {
        nodes[node.id] = node
    })

    workflowData.edges.forEach(edge => {
        if (!edges[edge.source]) {
            edges[edge.source] = []
        }
        edges[edge.source].push(edge)
    })

    // Find the start node
    const startNode = workflowData.nodes.find(node => node.type === 'Start')
    if (!startNode) {
        logWorkflowMessage({
            workflowId: workflowData.workflow.id,
            message: 'No start node found, ending workflow run',
            debug: true
        })
        return
    }

    await processNode(startNode, nodes, edges)
}

async function processNode(node: node, nodes: NodeMap, edges: EdgeMap) {
    switch (node.type) {
        case 'Start':
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Starting workflow run',
                debug: true
            })
            break

        case 'HTTPRequest':
            await handleHTTPRequestNode(node as HTTPRequestNode)
            break

        case 'SocketIO':
            handleSocketIONode(node as SocketIONode)
            break

        case 'SocketIOListener':
            handleSocketIOListenerNode(node as SocketIOListenerNode, nodes, edges)
            break

        case 'SocketIOEmitter':
            handleSocketIOEmitterNode(node as SocketIOEmitterNode, nodes, edges)
            break

        case 'IfCondition':
            handleIfConditionNode(node as IfConditionNode)
            break

        case 'End':
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Ending workflow run',
                debug: true
            })
            return

        default:
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Unknown node type',
                debug: true
            })
    }

    // Process next nodes
    const nextEdges = edges[node.id]

    if (!nextEdges) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No connections found, ending workflow run',
            debug: true
        })
        return
    }

    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: `Found ${nextEdges.length} connection${nextEdges.length === 1 ? '' : 's'}`,
        debug: true
    })

    for (const edge of nextEdges) {
        const nextNode = nodes[edge.target]
        await processNode(nextNode, nodes, edges)
    }
}

async function handleHTTPRequestNode(node: HTTPRequestNode) {
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: 'Processing node',
        data: node.data,
        debug: true
    })
    const response = await fetch(node.data.url, {
        method: node.data.method,
        headers: node.data.headers.reduce((acc: { [key: string]: string }, header) => {
            acc[header.name] = header.value
            return acc
        }, {}),
        body: JSON.stringify(node.data.body)
    })
    const responseData = await response.json()
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: 'Response',
        data: responseData,
        debug: true
    })
}

function findSocketIONodeId(nodeId: string, nodes: NodeMap, edges: EdgeMap): string | null {
    let socketIONodeId: string | null = null

    function traverseIncomingEdges(currentNodeId: string) {
        for (const sourceNodeId in edges) {
            const edgeList = edges[sourceNodeId]
            for (const edge of edgeList) {
                if (edge.target === currentNodeId) {
                    const sourceNode = nodes[edge.source]
                    if (sourceNode.type === 'SocketIO') {
                        socketIONodeId = sourceNode.id
                        return
                    } else {
                        traverseIncomingEdges(edge.source)
                    }
                }
            }
        }
    }

    traverseIncomingEdges(nodeId)
    return socketIONodeId
}

function handleSocketIONode(node: SocketIONode) {
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: 'Processing node',
        data: node.data,
        debug: true
    })

    let socketConnection

    try {
        new URL(node.data.url)
    } catch (error) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Invalid URL',
            data: node.data.url,
            debug: true
        })
        return
    }

    if (node.data.version === 2) {
        socketConnection = ioV2(node.data.url, {
            path: node.data.path,
        })
    }

    if (node.data.version === 3) {
        socketConnection = ioV3(node.data.url, {
            path: node.data.path,
            reconnection: false,
        })
    }

    if (node.data.version === 4) {
        socketConnection = ioV4(node.data.url, {
            path: node.data.path,
            reconnection: false,
        })
    }

    socketConnections[node.id] = socketConnection

    socketConnection.on('connect', () => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `Connected: ${node.data.url}`,
            debug: true
        })
    })

    socketConnection.on('disconnect', () => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `Disconnected: ${node.data.url}`,
            debug: true
        })
    })

    if (node.data.version === 2) {
        const originalOnevent = socketConnection.onevent

        socketConnection.onevent = function(packet: any) {
            const event = packet.data[0]
            const args = packet.data.slice(1)
            const receivedMessage = `[${event}] ${typeof args[0] === 'object' ? JSON.stringify(args[0], null, 4) : args[0]}`
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Received message',
                data: receivedMessage,
                debug: true
            })
            originalOnevent.call(this, packet)
        }
    }

    if (node.data.version === 3 || node.data.version === 4) {
        socketConnection.onAny(async(event: any, ...args: any) => {
            const receivedMessage = `[${event}] ${typeof args[0] === 'object' ? JSON.stringify(args[0], null, 4) : args[0]}`
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Received message',
                data: receivedMessage,
                debug: true
            })
        })
    }
}

function handleSocketIOListenerNode(node: SocketIOListenerNode, nodes: NodeMap, edges: EdgeMap) {
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: `Processing node`,
        debug: true
    })
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No Socket.IO node found',
            debug: true
        })
        return
    }

    const socket = socketConnections[socketIONodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `No connection found for node ${socketIONodeId}`,
            debug: true
        })
        return
    }

    socket.on(node.data.eventName, (data: any) => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `Received data for event ${node.data.eventName}:`,
            data,
            debug: true
        })
    })
}

function handleSocketIOEmitterNode(node: SocketIOEmitterNode, nodes: NodeMap, edges: EdgeMap) {
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: `Processing node`,
        data: node.data,
        debug: true
    })
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No Socket.IO node found',
            debug: true
        })
        return
    }

    const socket = socketConnections[socketIONodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `No connection found for node ${socketIONodeId}`,
            debug: true
        })
        return
    }

    socket.emit(node.data.eventName, node.data.eventBody)
}

function handleIfConditionNode(node: IfConditionNode) {
    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: 'Processing node',
        data: node.data,
        debug: true
    })
}
