import { WorkflowData } from './global'
import { edge, node } from './schema'
import type {
    HTTPRequestNode,
    SocketIONode,
    SocketIOListenerNode,
    SocketIOEmitterNode,
    IfConditionNode,
} from '../../ui/src/global'

type NodeMap = { [id: string]: node }
type EdgeMap = { [source: string]: edge[] }

export async function runWorkflow(workflowData: WorkflowData) {
    console.log(`Running workflow ${workflowData.workflow.name}`)

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
        throw new Error('No start node found')
    }

    console.log(`Starting at node ${startNode.id}`)
    await processNode(startNode, nodes, edges)
}

async function processNode(node: node, nodes: NodeMap, edges: EdgeMap) {
    console.log(`Processing node ${node.id} of type ${node.type}`)

    switch (node.type) {
        case 'Start':
            console.log('Starting workflow')
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
            console.log('Ending workflow')
            return

        default:
            throw new Error(`Unknown node type: ${node.type}`)
    }

    // Process next nodes
    const nextEdges = edges[node.id]

    if (!nextEdges) {
        console.log('No next edges found, ending workflow')
        return
    }

    console.log(`Found ${nextEdges.length} next edges`)
    for (const edge of nextEdges) {
        const nextNode = nodes[edge.target]
        await processNode(nextNode, nodes, edges)
    }
}

async function handleHTTPRequestNode(node: HTTPRequestNode) {
    console.log('Handling HTTPRequest node')
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
    console.log("Response data:", responseData)
}

function handleSocketIONode(node: SocketIONode) {
    console.log('Handling SocketIO node', node.data)
}

function handleSocketIOListenerNode(node: SocketIOListenerNode) {
    console.log(`Handling SocketIOListener node for event ${node.data.eventName}`)
}

function handleSocketIOEmitterNode(node: SocketIOEmitterNode) {
    console.log(`Handling SocketIOEmitter node for event ${node.data.eventName}`)
}

function handleIfConditionNode(node: IfConditionNode) {
    console.log('Handling IfCondition node', node.data)
}
