import {
    WorkflowData,
    SocketIO,
    NodeMap,
    EdgeMap,
    SocketIoMap,
    WebSocketMap,
    NodeOutput,
    AbortControllersMap,
} from './global'
import { edge, node, workflowRun } from './schema'
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
    StartNode,
    Param,
    DelayNode,
    SetVariableNode,
} from '../../ui/src/global'
import { connectedClients } from './index'
// @ts-ignore
import ioV2 from 'socket.io-client-v2'
// @ts-ignore
import { io as ioV3 } from 'socket.io-client-v3'
import { io as ioV4 } from 'socket.io-client-v4'
import * as vm from 'vm'
import { createWorkflowLog, createWorkflowRun, updateWorkflowRun } from './db'
import { nanoid } from 'nanoid'
import { constants } from '../../ui/src/constants'

const { STATUS } = constants

const workflowRunStatus: { [key: string]: boolean } = {}

const activePaths: { [workflowRunId: string]: number } = {}
const abortControllers: AbortControllersMap = {}
const socketIoConnections: SocketIoMap = {}
const webSocketConnections: WebSocketMap = {}

async function logWorkflowMessage({ workflowRunId, parallelIndex, nodeId = null, nodeType = null, message, data = null, debug }: WorkflowLog) {
    const timestamp = new Date().toISOString()

    const workflowLog = {
        timestamp,
        workflowRunId,
        parallelIndex,
        nodeId,
        nodeType,
        debug,
        message,
        data: data ?? null,
    }

    await createWorkflowLog(workflowLog)

    connectedClients.forEach((client) => {
        client.send(workflowLog)
    })
}

export async function runWorkflow(workflowData: WorkflowData) {
    const workflowRunId = nanoid()

    const newWorkflowRun = {
        id: workflowRunId,
        workflowId: workflowData.workflow.id,
        status: STATUS.RUNNING,
    }

    await createWorkflowRun(newWorkflowRun)

    const nodes: NodeMap = {}
    const edges: EdgeMap = {}
    const outputs: NodeOutput = {}

    workflowData.nodes.map((node) => {
        node.originalData = node.data
    })

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

    const parallelIndex = 0

    // Find the start node
    const startNode = workflowData.nodes.find(node => node.type === 'Start')
    if (!startNode) {
        logWorkflowMessage({
            workflowRunId: workflowRunId,
            parallelIndex,
            message: 'No start node found, ending workflow run',
            debug: false,
        })
        return
    }

    const workflowEnvironment = workflowData.environments.find(environment => environment.id === workflowData.workflow.currentEnvironmentId)

    workflowRunStatus[workflowRunId] = true

    // Initialize active paths counter
    activePaths[workflowRunId] = 0

    // Start processing the workflow
    processNode(workflowRunId, parallelIndex, startNode, nodes, edges, outputs, null, [], workflowEnvironment ? workflowEnvironment.env : {})

    return newWorkflowRun
}

export async function stopWorkflowRun(workflowRunId: string) {
    if (workflowRunId in workflowRunStatus) {
        workflowRunStatus[workflowRunId] = false

        await markWorkflowAsCancelled(workflowRunId)

        // Abort all HTTP requests
        if (abortControllers[workflowRunId]) {
            for (const parallelIndex in abortControllers[workflowRunId]) {
                for (const nodeId in abortControllers[workflowRunId][parallelIndex]) {
                    abortControllers[workflowRunId][parallelIndex][nodeId].abort()
                }
                delete abortControllers[workflowRunId][parallelIndex]
            }
            delete abortControllers[workflowRunId]
        }

        // Disconnect all Socket.IO connections
        if (socketIoConnections[workflowRunId]) {
            for (const parallelIndex in socketIoConnections[workflowRunId]) {
                for (const nodeId in socketIoConnections[workflowRunId][parallelIndex]) {
                    socketIoConnections[workflowRunId][parallelIndex][nodeId].disconnect()
                }
            }
            delete socketIoConnections[workflowRunId]
        }

        // Disconnect all WebSocket connections
        if (webSocketConnections[workflowRunId]) {
            for (const parallelIndex in webSocketConnections[workflowRunId]) {
                for (const nodeId in webSocketConnections[workflowRunId][parallelIndex]) {
                    webSocketConnections[workflowRunId][parallelIndex][nodeId].close()
                }
            }
            delete webSocketConnections[workflowRunId]
        }
    }
}

async function markWorkflowAsFailed(workflowRunId: workflowRun['id'], parallelIndex: number) {
    await updateWorkflowRun(workflowRunId, {
        status: STATUS.FAILED
    })

    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        message: 'Workflow run failed',
        debug: false,
    })
}

async function markWorkflowAsCompleted(workflowRunId: workflowRun['id']) {
    await updateWorkflowRun(workflowRunId, {
        status: STATUS.COMPLETED
    })

    logWorkflowMessage({
        workflowRunId,
        parallelIndex: 0,
        message: 'Workflow run completed',
        debug: false,
    })
}

async function markWorkflowAsCancelled(workflowRunId: string) {
    await updateWorkflowRun(workflowRunId, {
        status: constants.STATUS.CANCELLED
    })

    await logWorkflowMessage({
        workflowRunId,
        parallelIndex: 0,
        message: 'Workflow run cancelled',
        debug: false
    })
}

const variableMatchingRegex = /{{(.*?)}}/g

function parseNodeData(workflowRunId: workflowRun['id'], parallelIndex: number, nodeId: node['id'], nodeType: node['type'], input: any, data: any, variables: any, environment: any) {
    const nodeDataProperties = Object.keys(data)

    const parsedData: any = {}

    const context = {
        $previousInput: input ? input.input : undefined,
        $input: input ? input.output : undefined,
        $vars: variables,
        $env: environment,
    }

    const sandbox = vm.createContext(context)

    for (const key of nodeDataProperties) {

        const isObject = typeof data[key] !== 'string'
        let jsonData: string = isObject ? JSON.stringify(data[key]) : data[key]

        let match
        while ((match = variableMatchingRegex.exec(jsonData))) {
            const outerMatch = match[0]
            const expressionOrVariable = match[1].trim()

            const script = new vm.Script(expressionOrVariable)

            try {
                const result = script.runInContext(sandbox)
                jsonData = jsonData.replaceAll(outerMatch, result)
                variableMatchingRegex.lastIndex = 0
            } catch(e: any) {
                logWorkflowMessage({
                    workflowRunId,
                    parallelIndex,
                    nodeId,
                    nodeType,
                    message: 'Error',
                    data: e.message,
                    debug: true
                })
                parsedData[key] = data[key]
            }
        }

        parsedData[key] = isObject ? JSON.parse(jsonData) : jsonData
    }

    return parsedData
}

async function processNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: node, nodes: NodeMap, edges: EdgeMap, outputs: NodeOutput, previousNode: node | null, variables: Param[], environment: any) {
    if (!workflowRunStatus[workflowRunId]) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Workflow run has already been stopped, skipping node processing',
            debug: true,
        })
        return
    }

    let message = 'Processing node'

    if (node.type === 'Start') {
        message = 'Starting workflow run'
    }

    if (node.type === 'End') {
        message = 'Ending workflow run'
    }

    const input = previousNode ? outputs[previousNode.id] : {}
    const variablesConverted = variables.filter(variable => !variable.disabled).reduce((acc, variable) => {
        acc[variable.name] = variable.value
        return acc
    }, {} as any)

    const parsedNodeData = parseNodeData(workflowRunId, parallelIndex, node.id, node.type, input, node.originalData, variablesConverted, environment)

    let logData: any

    if (Object.keys(parsedNodeData as []).length === 0) {
        logData = null
    } else {
        if (Object.keys(variablesConverted).length === 0) {
            logData = parsedNodeData
        } else {
            logData = {
                $vars: variablesConverted,
                parsedNodeData
            }
        }
    }

    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        nodeId: node.id,
        nodeType: node.type,
        message,
        data: logData,
        debug: false,
    })

    node.data = parsedNodeData

    switch (node.type) {
        case 'Start':
            break

        case 'HTTPRequest':
            {
                const output = await handleHTTPRequestNode(workflowRunId, parallelIndex, node as HTTPRequestNode)
                if (output instanceof Error) {
                    await markWorkflowAsFailed(workflowRunId, parallelIndex)
                    return
                }
                outputs[node.id] = { input: input?.output, output }
            }
            break

        case 'SocketIO':
            {
                const output = await handleSocketIONode(workflowRunId, parallelIndex, node as SocketIONode)
                outputs[node.id] = { input: input?.output, output }

                if (output === false) {
                    await markWorkflowAsFailed(workflowRunId, parallelIndex)
                    return
                }
            }
            break

        case 'SocketIOListener':
            {
                const output = await handleSocketIOListenerNode(workflowRunId, parallelIndex, node as SocketIOListenerNode, nodes, edges)
                outputs[node.id] = { input: input?.output, output }
            }
            break

        case 'SocketIOEmitter':
            handleSocketIOEmitterNode(workflowRunId, parallelIndex, node as SocketIOEmitterNode, nodes, edges)
            break

        case 'WebSocket':
            {
                const output = await handleWebSocketNode(workflowRunId, parallelIndex, node as WebSocketNode)
                outputs[node.id] = { input: input?.output, output }

                if (output === false) {
                    await markWorkflowAsFailed(workflowRunId, parallelIndex)
                    return
                }
            }
            break

        case 'WebSocketListener':
            {
                const output = await handleWebSocketListenerNode(workflowRunId, parallelIndex, node as WebSocketListenerNode, nodes, edges)
                outputs[node.id] = { input: input?.output, output }
            }
            break

        case 'WebSocketEmitter':
            handleWebSocketEmitterNode(workflowRunId, parallelIndex, node as WebSocketEmitterNode, nodes, edges)
            break

        case 'IfCondition':
            const conditionResult = handleIfConditionNode(workflowRunId, parallelIndex, node as IfConditionNode)
            outputs[node.id] = { input: input?.output, output: conditionResult }

            const ifEdges = edges[node.id] || []
            const nextEdge = ifEdges.find(e => conditionResult ? e.sourceHandle === 'true' : e.sourceHandle === 'false')

            if (nextEdge) {
                const nextNode = nodes[nextEdge.target]
                await processNode(workflowRunId, parallelIndex, nextNode, nodes, edges, outputs, node, variables, environment)
            } else {
                logWorkflowMessage({
                    workflowRunId,
                    parallelIndex,
                    nodeId: node.id,
                    nodeType: node.type,
                    message: `No matching connection found for condition ${conditionResult}`,
                    debug: true
                })
            }
            return

        case 'Delay':
            await handleDelayNode(workflowRunId, parallelIndex, node as DelayNode)
            break

        case 'SetVariable':
            handleSetVariableNode(workflowRunId, parallelIndex, node as SetVariableNode, variables)
            outputs[node.id] = structuredClone(input)
            break

        case 'End':
            const parallelIndexSocketConnections = socketIoConnections[workflowRunId]?.[parallelIndex]
            if (parallelIndexSocketConnections) {
                for (const nodeId in parallelIndexSocketConnections) {
                    parallelIndexSocketConnections[nodeId].disconnect()
                }
                delete socketIoConnections[workflowRunId][parallelIndex]
            }

            const parallelIndexWebSocketConnections = webSocketConnections[workflowRunId]?.[parallelIndex]
            if (parallelIndexWebSocketConnections) {
                for (const nodeId in parallelIndexWebSocketConnections) {
                    parallelIndexWebSocketConnections[nodeId].close()
                }
                delete webSocketConnections[workflowRunId][parallelIndex]
            }

            return

        default:
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
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
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No connections found',
            debug: true
        })
        return
    }

    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        nodeId: node.id,
        nodeType: node.type,
        message: `Found ${nextEdges.length} connection${nextEdges.length === 1 ? '' : 's'}`,
        debug: true
    })

    if(node.type === 'Start') {
        const startNode = node as StartNode
        if(startNode.data.parallelEntries && startNode.data.parallelEntries.length > 0) {
            await Promise.all(
                startNode.data.parallelEntries.map((parallelEntry, parallelEntryIndex) => {
                    // we do this so each parallel entry has its own copy of the outputs and doesn't get overwritten by other parallel entries and cause race conditions
                    const newOutputs = { ...outputs }
                    const parallelIndex = parallelEntryIndex + 1
                    return executeTasksInParallel(nextEdges, workflowRunId, parallelIndex, nodes, edges, newOutputs, node, parallelEntry.variables, environment)
                })
            )
            return
        }
    }

    await executeTasksInParallel(nextEdges, workflowRunId, parallelIndex, nodes, edges, outputs, node, variables, environment)
}

async function executeTasksInParallel(nextEdges: edge[], workflowRunId: workflowRun['id'], parallelIndex: number, nodes: NodeMap, edges: EdgeMap, outputs: NodeOutput, node: node, variables: Param[], environment: any) {
    // Increment the active paths counter for each new path
    activePaths[workflowRunId] += nextEdges.length

    const promises = nextEdges.map((edge) => {
        const nextNode = structuredClone(nodes[edge.target])
        return processNode(workflowRunId, parallelIndex, nextNode, nodes, edges, outputs, node, variables, environment)
    })

    // Wait for all paths to be processed
    await Promise.all(promises)

    // Decrement the active paths counter for each completed path
    activePaths[workflowRunId] -= nextEdges.length

    if (activePaths[workflowRunId] === 0 && workflowRunStatus[workflowRunId]) {
        await markWorkflowAsCompleted(workflowRunId)
    }
}

async function handleDelayNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: DelayNode) {
    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        nodeId: node.id,
        nodeType: node.type,
        message: `Starting delay of ${node.data.delayInMS} ms`,
        debug: false,
    })

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Delay completed',
                debug: false,
            })
            resolve()
        }, node.data.delayInMS)
    })
}

async function handleHTTPRequestNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: HTTPRequestNode) {
    let parsedUrl: URL

    try {
        parsedUrl = new URL(node.data.url)
    } catch (error) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Invalid URL',
            data: node.data.url,
            debug: false
        })
        return
    }

    node.data.queryParams.forEach(queryParam => {
        if (!queryParam.disabled) {
            parsedUrl.searchParams.append(queryParam.name, queryParam.value)
        }
    })

    const abortController = new AbortController()
    abortControllers[workflowRunId] = abortControllers[workflowRunId] || {}
    abortControllers[workflowRunId][parallelIndex] = abortControllers[workflowRunId][parallelIndex] || {}
    abortControllers[workflowRunId][parallelIndex][node.id] = abortController

    let body: any = null

    if (node.data.body.mimeType === 'application/json') {
        body = node.data.body.text
    } else if (node.data.body.mimeType === 'application/x-www-form-urlencoded') {
        const urlSearchParams = new URLSearchParams()

        node.data.body.params.forEach(param => {
            if (!param.disabled) {
                urlSearchParams.append(param.name, param.value)
            }
        })

        body = urlSearchParams
    }

    try {
        const response = await fetch(parsedUrl, {
            signal: abortController.signal,
            method: node.data.method,
            headers: node.data.headers.filter(header => !header.disabled).reduce((acc: { [key: string]: string }, header) => {
                acc[header.name] = header.value
                return acc
            }, {}),
            body: node.data.method !== 'GET' ? body : null
        })

        let responseData = await response.text()

        try {
            responseData = JSON.parse(responseData)
        } catch (e) {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Failed to parse response to JSON',
                data: responseData,
                debug: true
            })
        }

        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Response',
            data: responseData,
            debug: false,
        })

        delete abortControllers[workflowRunId][parallelIndex][node.id]

        return responseData
    } catch (error: any) {
        if (error.name === 'AbortError') {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'AbortError: The operation was aborted.',
                debug: true
            })
        } else {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Error',
                data: error.message,
                debug: false,
            })
        }
        if(abortControllers[workflowRunId] && abortControllers[workflowRunId][parallelIndex]  && abortControllers[workflowRunId][parallelIndex][node.id]) {
            delete abortControllers[workflowRunId][parallelIndex][node.id]
        }
        return new Error(error.message)
    }
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

async function handleSocketIONode(workflowRunId: workflowRun['id'], parallelIndex: number, node: SocketIONode) {
    let socketConnection: SocketIO | null = null

    try {
        new URL(node.data.url)
    } catch (error) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Invalid URL',
            data: node.data.url,
            debug: false
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

    if (!socketConnection) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Failed to create Socket.IO connection',
            debug: false
        })

        return false
    }

    socketIoConnections[workflowRunId] = socketIoConnections[workflowRunId] || {}
    socketIoConnections[workflowRunId][parallelIndex] = socketIoConnections[workflowRunId][parallelIndex] || {}
    socketIoConnections[workflowRunId][parallelIndex][node.id] = socketConnection

    const connectionTimeoutMS = 5 * 1000
    let timeoutId: Timer

    const connectionPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Connection timeout',
                debug: false
            })
            socketConnection!.disconnect()
            resolve(false)
        }, connectionTimeoutMS)

        socketConnection!.on('connect', () => {
            clearTimeout(timeoutId!)

            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Connected',
                debug: false
            })

            resolve(true)
        })
    })

    socketConnection.on('disconnect', () => {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Disconnected',
            debug: false
        })
    })

    if (node.data.version === 2) {
        const originalOnevent = socketConnection.onevent

        socketConnection.onevent = function(packet: any) {
            const event = packet.data[0]
            const args = packet.data.slice(1)
            const receivedMessage = `[${event}] ${typeof args[0] === 'object' ? JSON.stringify(args[0], null, 4) : args[0]}`
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
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
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Received event',
                data: receivedMessage,
                debug: true
            })
        })
    }

    return connectionPromise
}

async function handleSocketIOListenerNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: SocketIOListenerNode, nodes: NodeMap, edges: EdgeMap) {
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No Socket.IO node found',
            debug: true
        })
        return
    }

    const socket = socketIoConnections[workflowRunId][parallelIndex][socketIONodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
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
                workflowRunId,
                parallelIndex,
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

function handleSocketIOEmitterNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: SocketIOEmitterNode, nodes: NodeMap, edges: EdgeMap) {
    const socketIONodeId = findSocketIONodeId(node.id, nodes, edges)

    if (!socketIONodeId) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No Socket.IO node found',
            debug: true
        })
        return
    }

    const socket = socketIoConnections[workflowRunId][parallelIndex][socketIONodeId]

    if (!socket) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
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

async function handleWebSocketNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: WebSocketNode) {
    let socketConnection: WebSocket

    try {
        new URL(node.data.url)
    } catch (error) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Invalid URL',
            data: node.data.url,
            debug: false
        })
        return
    }

    socketConnection = new WebSocket(node.data.url)

    webSocketConnections[workflowRunId] = webSocketConnections[workflowRunId] || {}
    webSocketConnections[workflowRunId][parallelIndex] = webSocketConnections[workflowRunId][parallelIndex] || {}
    webSocketConnections[workflowRunId][parallelIndex][node.id] = socketConnection

    let openEventReceived = false

    const connectionTimeoutMS = 5 * 1000
    let timeoutId: Timer

    const connectionPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => {
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Connection timeout',
                debug: false
            })
            socketConnection!.close()
            resolve(false)
        }, connectionTimeoutMS)

        socketConnection.addEventListener('open', () => {
            clearTimeout(timeoutId)

            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Connected',
                debug: false
            })

            openEventReceived = true

            resolve(true)
        })

        socketConnection.addEventListener('close', () => {
            clearTimeout(timeoutId)

            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: 'Disconnected',
                debug: false
            })

            if (!openEventReceived) {
                resolve(false)
            }
        })
    })

    socketConnection.addEventListener('message', event => {
        const receivedMessage = event.data
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Received message',
            data: receivedMessage,
            debug: true
        })
    })

    socketConnection.addEventListener('error', (event) => {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'Error',
            data: event,
            debug: true
        })
    })

    return connectionPromise
}

async function handleWebSocketListenerNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: WebSocketListenerNode, nodes: NodeMap, edges: EdgeMap) {
    const webSocketNodeId = findWebSocketNodeId(node.id, nodes, edges)

    if (!webSocketNodeId) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No WebSocket node found',
            debug: true
        })
        return
    }

    const socket = webSocketConnections[workflowRunId][parallelIndex][webSocketNodeId]

    if (!socket) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
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
                workflowRunId,
                parallelIndex,
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

function handleWebSocketEmitterNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: WebSocketEmitterNode, nodes: NodeMap, edges: EdgeMap) {
    const webSocketNodeId = findWebSocketNodeId(node.id, nodes, edges)

    if (!webSocketNodeId) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: 'No WebSocket node found',
            debug: true
        })
        return
    }

    const socket = webSocketConnections[workflowRunId][parallelIndex][webSocketNodeId]
    if (!socket) {
        logWorkflowMessage({
            workflowRunId,
            parallelIndex,
            nodeId: node.id,
            nodeType: node.type,
            message: `No connection found for node ${webSocketNodeId}`,
            debug: true
        })
        return
    }

    socket.send(node.data.eventBody)
}

function handleIfConditionNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: IfConditionNode) {
    let conditionMet = false

    switch (node.data.operator) {
        case '==':
            conditionMet = node.data.leftOperand == node.data.rightOperand
            break
        case '==':
            conditionMet = node.data.leftOperand === node.data.rightOperand
            break
        case '!=':
            conditionMet = node.data.leftOperand != node.data.rightOperand
            break
        case '!=':
            conditionMet = node.data.leftOperand !== node.data.rightOperand
            break
        case '>':
            conditionMet = node.data.leftOperand > node.data.rightOperand
            break
        case '>=':
            conditionMet = node.data.leftOperand >= node.data.rightOperand
            break
        case '<':
            conditionMet = node.data.leftOperand < node.data.rightOperand
            break
        case '<=':
            conditionMet = node.data.leftOperand <= node.data.rightOperand
            break
        default:
            logWorkflowMessage({
                workflowRunId,
                parallelIndex,
                nodeId: node.id,
                nodeType: node.type,
                message: `Unsupported operator: ${node.data.operator}`,
                debug: true
            })
            return
    }

    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        nodeId: node.id,
        nodeType: node.type,
        message: `Condition ${conditionMet ? 'met' : 'not met'}`,
        debug: false,
    })

    return conditionMet
}

function handleSetVariableNode(workflowRunId: workflowRun['id'], parallelIndex: number, node: SetVariableNode, variables: Param[]) {
    variables.push(...node.data.variables)

    const flattenedVariables = node.data.variables.reduce((acc: any, variable) => {
        acc[variable.name] = variable.value
        return acc
    }, {})

    logWorkflowMessage({
        workflowRunId,
        parallelIndex,
        nodeId: node.id,
        nodeType: node.type,
        message: '',
        data: flattenedVariables,
        debug: false,
    })
}
