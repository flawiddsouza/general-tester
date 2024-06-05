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

function logWorkflowMessage(message: string, data?: any) {
    console.log(message)
    connectedClients.forEach((client) => {
        client.send({
            message,
            data: data ?? null,
        })
    })
}

export async function runWorkflow(workflowData: WorkflowData) {
    logWorkflowMessage(`Running workflow: ${workflowData.workflow.name}`)

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
        logWorkflowMessage('No start node found, ending workflow run')
        return
    }

    // logWorkflowMessage(`Starting at node ${startNode.id}`)
    await processNode(startNode, nodes, edges)
}

async function processNode(node: node, nodes: NodeMap, edges: EdgeMap) {
    // logWorkflowMessage(`Processing node ${node.id} of type ${node.type}`)

    switch (node.type) {
        case 'Start':
            logWorkflowMessage('Starting workflow run')
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
            logWorkflowMessage('Ending workflow run')
            return

        default:
            throw new Error(`Unknown node type: ${node.type}`)
    }

    // Process next nodes
    const nextEdges = edges[node.id]

    if (!nextEdges) {
        logWorkflowMessage(`${node.type}: No connections found, ending workflow run`)
        return
    }

    logWorkflowMessage(`${node.type}: Found ${nextEdges.length} connection${nextEdges.length === 1 ? '' : 's'}`)

    for (const edge of nextEdges) {
        const nextNode = nodes[edge.target]
        await processNode(nextNode, nodes, edges)
    }
}

async function handleHTTPRequestNode(node: HTTPRequestNode) {
    logWorkflowMessage('Handling HTTPRequest node')
    // Perform the HTTP request, for example using fetch
    const response = await fetch(node.data.url, {
        method: node.data.method,
        headers: node.data.headers.reduce((acc: { [key: string]: string }, header) => {
            acc[header.name] = header.value
            return acc
        }, {}),
        body: JSON.stringify(node.data.body)
    })
    const responseData = await response.json()
    logWorkflowMessage("Response data:", responseData)
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
                        return  // Return early if we find the relevant node
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
    logWorkflowMessage('Handling SocketIO node', node.data)

    let socketConnection

    try {
        new URL(node.data.url)
    } catch (error) {
        logWorkflowMessage('Socket.IO Invalid URL:', node.data.url)
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
        logWorkflowMessage(`Socket.IO connected: ${node.data.url}`)
    })

    socketConnection.on('disconnect', () => {
        logWorkflowMessage(`Socket.IO disconnected: ${node.data.url}`)
    })

    if (node.data.version === 2) {
        const originalOnevent = socketConnection.onevent

        socketConnection.onevent = function(packet: any) {
            const event = packet.data[0]
            const args = packet.data.slice(1)
            const receivedMessage = `[${event}] ${typeof args[0] === 'object' ? JSON.stringify(args[0], null, 4) : args[0]}`
            logWorkflowMessage('Socket.IO Received message:', receivedMessage)
            originalOnevent.call(this, packet)
        }
    }

    if (node.data.version === 3 || node.data.version === 4) {
        socketConnection.onAny(async(event: any, ...args: any) => {
            const receivedMessage = `[${event}] ${typeof args[0] === 'object' ? JSON.stringify(args[0], null, 4) : args[0]}`
            logWorkflowMessage('Socket.IO Received message:', receivedMessage)
        })
    }
}

function handleSocketIOListenerNode(node: SocketIOListenerNode, nodes: NodeMap, edges: EdgeMap) {
    logWorkflowMessage(`Handling SocketIOListener node for event ${node.data.eventName}`)
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage(`SocketIOListener: No SocketIONode found for node ${node.id}`)
        return
    }

    const socket = socketConnections[socketIONodeId]
    if (!socket) {
        logWorkflowMessage(`SocketIOListener: No connection found for node ${socketIONodeId}`)
        return
    }

    socket.on(node.data.eventName, (data: any) => {
        logWorkflowMessage(`Received data for event ${node.data.eventName}:`, data)
    })
}

function handleSocketIOEmitterNode(node: SocketIOEmitterNode, nodes: NodeMap, edges: EdgeMap) {
    logWorkflowMessage(`Handling SocketIOEmitter node for event ${node.data.eventName}`)
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage(`SocketIOEmitter: No SocketIONode found for node ${node.id}`)
        return
    }

    const socket = socketConnections[socketIONodeId]
    if (!socket) {
        logWorkflowMessage(`SocketIOEmitter: No connection found for node ${socketIONodeId}`)
        return
    }

    socket.emit(node.data.eventName, node.data.eventBody)
}

function handleIfConditionNode(node: IfConditionNode) {
    logWorkflowMessage('Handling IfCondition node', node.data)
}
