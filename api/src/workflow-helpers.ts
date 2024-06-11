import { WorkflowData } from './global'
import { edge, node } from './schema'
import type {
    HTTPRequestNode,
    SocketIONode,
    SocketIOListenerNode,
    SocketIOEmitterNode,
    IfConditionNode,
    WorkflowLog,
    WebSocketNode,
    WebSocketListenerNode,
    WebSocketEmitterNode,
} from '../../ui/src/global'
import { connectedClients } from './index'
// @ts-ignore
import ioV2 from 'socket.io-client-v2'
// @ts-ignore
import { io as ioV3 } from 'socket.io-client-v3'
import { io as ioV4 } from 'socket.io-client-v4'
import * as vm from 'vm'

type NodeMap = { [id: string]: node }
type EdgeMap = { [source: string]: edge[] }
type SocketIoMap = { [id: string]: any }
type WebSocketMap = { [id: string]: WebSocket }
type NodeOutput = { [nodeId: string]: any }

const socketIoConnections: SocketIoMap = {}
const webSocketConnections: WebSocketMap = {}

function logWorkflowMessage({ workflowId, nodeId = null, nodeType = null, message, data = null, debug }: WorkflowLog) {
    const timestamp = new Date().toISOString()

    connectedClients.forEach((client) => {
        client.send({
            timestamp,
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
    const nodes: NodeMap = {}
    const edges: EdgeMap = {}
    const outputs: NodeOutput = {}

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
            debug: false,
        })
        return
    }

    await processNode(startNode, nodes, edges, outputs)
}

async function processNode(node: node, nodes: NodeMap, edges: EdgeMap, outputs: NodeOutput, previousNode: node | null = null) {
    let message = 'Processing node'

    if (node.type === 'Start') {
        message = 'Starting workflow run'
    }

    if (node.type === 'End') {
        message = 'Ending workflow run'
    }

    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message,
        data: Object.keys(node.data as []).length === 0 ? null : node.data,
        debug: false,
    })

    let input: any

    switch (node.type) {
        case 'Start':
            break

        case 'HTTPRequest':
            outputs[node.id] = await handleHTTPRequestNode(node as HTTPRequestNode)
            break

        case 'SocketIO':
            input = previousNode ? outputs[previousNode.id] : {}
            handleSocketIONode(node as SocketIONode, input)
            break

        case 'SocketIOListener':
            outputs[node.id] = await handleSocketIOListenerNode(node as SocketIOListenerNode, nodes, edges)
            break

        case 'SocketIOEmitter':
            handleSocketIOEmitterNode(node as SocketIOEmitterNode, nodes, edges)
            break

        case 'WebSocket':
            input = previousNode ? outputs[previousNode.id] : {}
            handleWebSocketNode(node as WebSocketNode, input)
            break

        case 'WebSocketListener':
            outputs[node.id] = await handleWebSocketListenerNode(node as WebSocketListenerNode, nodes, edges)
            break

        case 'WebSocketEmitter':
            handleWebSocketEmitterNode(node as WebSocketEmitterNode, nodes, edges)
            break

        case 'IfCondition':
            input = previousNode ? outputs[previousNode.id] : {}
            const conditionResult = handleIfConditionNode(node as IfConditionNode, input)
            outputs[node.id] = conditionResult

            const ifEdges = edges[node.id] || []
            const nextEdge = ifEdges.find(e => conditionResult ? e.sourceHandle === 'true' : e.sourceHandle === 'false')

            if (nextEdge) {
                const nextNode = nodes[nextEdge.target]
                await processNode(nextNode, nodes, edges, outputs, node)
            } else {
                logWorkflowMessage({
                    workflowId: node.workflowId,
                    nodeId: node.id,
                    nodeType: node.type,
                    message: `No matching connection found for condition ${conditionResult}`,
                    debug: true
                })
            }
            return

        case 'End':
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
            message: 'No connections found',
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

    // Execute tasks in parallel
    await Promise.all(
        nextEdges.map((edge) => {
            const nextNode = nodes[edge.target]
            return processNode(nextNode, nodes, edges, outputs, node)
        })
    )
}

async function handleHTTPRequestNode(node: HTTPRequestNode) {
    const response = await fetch(node.data.url, {
        method: node.data.method,
        headers: node.data.headers.reduce((acc: { [key: string]: string }, header) => {
            acc[header.name] = header.value
            return acc
        }, {}),
        body: node.data.method !== 'GET' ? JSON.stringify(node.data.body) : null
    })

    const responseData = await response.json()

    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: 'Response',
        data: responseData,
        debug: false,
    })

    return responseData
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

function handleSocketIONode(node: SocketIONode, _input: any) {
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

    socketIoConnections[node.id] = socketConnection

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
                message: 'Received event',
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
                message: 'Received event',
                data: receivedMessage,
                debug: true
            })
        })
    }
}

async function handleSocketIOListenerNode(node: SocketIOListenerNode, nodes: NodeMap, edges: EdgeMap) {
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

    const socket = socketIoConnections[socketIONodeId]
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

    return new Promise((resolve) => {
        socket.on(node.data.eventName, (data: any) => {
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: `Received event: ${node.data.eventName}`,
                data,
                debug: false
            })
            if(data !== undefined) {
                resolve(JSON.parse(data))
            } else {
                resolve(undefined)
            }
        })
    })
}

function handleSocketIOEmitterNode(node: SocketIOEmitterNode, nodes: NodeMap, edges: EdgeMap) {
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

    const socket = socketIoConnections[socketIONodeId]
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


function findWebSocketNodeId(nodeId: string, nodes: NodeMap, edges: EdgeMap): string | null {
    let webSocketNodeId: string | null = null

    function traverseIncomingEdges(currentNodeId: string) {
        for (const sourceNodeId in edges) {
            const edgeList = edges[sourceNodeId]
            for (const edge of edgeList) {
                if (edge.target === currentNodeId) {
                    const sourceNode = nodes[edge.source]
                    if (sourceNode.type === 'WebSocket') {
                        webSocketNodeId = sourceNode.id
                        return
                    } else {
                        traverseIncomingEdges(edge.source)
                    }
                }
            }
        }
    }

    traverseIncomingEdges(nodeId)
    return webSocketNodeId
}

function handleWebSocketNode(node: WebSocketNode, _input: any) {
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

    socketConnection = new WebSocket(node.data.url)

    webSocketConnections[node.id] = socketConnection

    socketConnection.addEventListener('open', () => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Connected',
            debug: true
        })
    })

    socketConnection.addEventListener('message', event => {
        const receivedMessage = event.data
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Received message',
            data: receivedMessage,
            debug: true
        })
    })

    socketConnection.addEventListener('close', () => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Disconnected',
            debug: true
        })
    })

    socketConnection.addEventListener('error', (event) => {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Error',
            data: event,
            debug: true
        })
    })
}

async function handleWebSocketListenerNode(node: WebSocketListenerNode, nodes: NodeMap, edges: EdgeMap) {
    const webSocketNodeId = findWebSocketNodeId(node.id, nodes, edges)

    if (!webSocketNodeId) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No WebSocket node found',
            debug: true
        })
        return
    }

    const socket = webSocketConnections[webSocketNodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `No connection found for node ${webSocketNodeId}`,
            debug: true
        })
        return
    }

    return new Promise((resolve) => {
        socket.addEventListener(node.data.eventName, (event: any) => {
            const data = event.data
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: `Received event: ${node.data.eventName}`,
                data,
                debug: false
            })
            if(data !== undefined) {
                resolve(JSON.parse(data))
            } else {
                resolve(undefined)
            }
        })
    })
}

function handleWebSocketEmitterNode(node: WebSocketEmitterNode, nodes: NodeMap, edges: EdgeMap) {
    const webSocketNodeId = findWebSocketNodeId(node.id, nodes, edges)

    if (!webSocketNodeId) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No WebSocket node found',
            debug: true
        })
        return
    }

    const socket = webSocketConnections[webSocketNodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: `No connection found for node ${webSocketNodeId}`,
            debug: true
        })
        return
    }

    socket.send(node.data.eventBody)
}

function handleIfConditionNode(node: IfConditionNode, input: any) {
    const context = {
        $input: input
    }

    const scriptLeft = new vm.Script(node.data.leftOperand)
    const scriptRight = new vm.Script(node.data.rightOperand)

    const sandbox = vm.createContext(context)

    let leftValue
    let rightValue

    try {
        leftValue = scriptLeft.runInContext(sandbox)
        rightValue = scriptRight.runInContext(sandbox)
    } catch(e: any) {
        logWorkflowMessage({
            workflowId: node.workflowId,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Error',
            data: e.message,
            debug: true
        })
        return
    }

    let conditionMet = false

    switch (node.data.operator) {
        case '==':
            conditionMet = leftValue == rightValue;
            break
        case '==':
            conditionMet = leftValue === rightValue
            break
        case '!=':
            conditionMet = leftValue != rightValue
            break
        case '!=':
            conditionMet = leftValue !== rightValue
            break
        default:
            logWorkflowMessage({
                workflowId: node.workflowId,
                nodeId: node.id,
                nodeType: node.type,
                message: `Unsupported operator: ${node.data.operator}`,
                debug: true
            })
            return
    }

    logWorkflowMessage({
        workflowId: node.workflowId,
        nodeId: node.id,
        nodeType: node.type,
        message: `Condition ${conditionMet ? 'met' : 'not met'}`,
        debug: false,
    })

    return conditionMet
}
