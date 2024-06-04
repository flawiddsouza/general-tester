import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { workflow, environment, node, edge } from './schema'
import {
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    createNode,
    updateNode,
    deleteNode,
    createEdge,
    deleteEdge
} from './db'
import { runWorkflow } from './workflow-helpers'

export const connectedClients: {
    id: string
    send: (message: any) => void
}[] = []

const app = new Elysia()
    .use(cors())
    .use(swagger({
        path: '/',
        exclude: [
            '/',
            '/json',
        ],
        documentation: {
            info: {
                title: 'General Tester API',
                version: '1.0.0'
            },
        },
    }))
    .get('/workflows', () => {
        return getWorkflows()
    })
    .get('/workflow/:id', ({ params }) => {
        return getWorkflow(params.id)
    })
    .post('/workflow', ({ body }) =>{
        return createWorkflow(body)
    }, {
        body: workflow
    })
    .put('/workflow/:id', ({ params, body }) => {
        return updateWorkflow(params.id, body)
    }, {
        body: t.Partial(workflow)
    })
    .delete('/workflow/:id', ({ params }) => {
        return deleteWorkflow(params.id)
    })
    .post('/environment', ({ body }) =>{
        return createEnvironment(body)
    }, {
        body: environment
    })
    .put('/environment/:id', ({ params, body }) => {
        return updateEnvironment(params.id, body)
    }, {
        body: t.Partial(environment)
    })
    .delete('/environment/:id', ({ params }) => {
        return deleteEnvironment(params.id)
    })
    .post('/node', ({ body }) =>{
        return createNode(body)
    }, {
        body: node
    })
    .put('/node/:id', ({ params, body }) => {
        return updateNode(params.id, body)
    }, {
        body: t.Partial(node)
    })
    .delete('/node/:id', ({ params }) => {
        return deleteNode(params.id)
    })
    .post('/edge', ({ body }) =>{
        return createEdge(body)
    }, {
        body: edge
    })
    .delete('/edge/:id', ({ params }) => {
        return deleteEdge(params.id)
    })
    .post('/workflow/:id/run', async({ params }) => {
        const data = await getWorkflow(params.id)

        runWorkflow(data)

        return { message: `Running workflow: ${data.workflow.name}` }
    })
    .ws('/ws', {
        open(ws) {
            connectedClients.push(ws)
            console.log('Connection opened', ws.id)
        },
        message(ws, message) {
            console.log('Received message from client ' + ws.id + ': ' + message)
        },
        close(ws) {
            connectedClients.splice(connectedClients.indexOf(ws), 1)
            console.log('Connection closed', ws.id)
        },
    })
    .listen(9002)

console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
)

export type App = typeof app
