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

type NodeMap = { [id: string]: node }
type EdgeMap = { [source: string]: edge[] }

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
            handleSocketIOListenerNode(node as SocketIOListenerNode)
            break

        case 'SocketIOEmitter':
            handleSocketIOEmitterNode(node as SocketIOEmitterNode)
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

function handleSocketIONode(node: SocketIONode) {
    logWorkflowMessage('Handling SocketIO node', node.data)
}

function handleSocketIOListenerNode(node: SocketIOListenerNode) {
    logWorkflowMessage(`Handling SocketIOListener node for event ${node.data.eventName}`)
}

function handleSocketIOEmitterNode(node: SocketIOEmitterNode) {
    logWorkflowMessage(`Handling SocketIOEmitter node for event ${node.data.eventName}`)
}

function handleIfConditionNode(node: IfConditionNode) {
    logWorkflowMessage('Handling IfCondition node', node.data)
}
