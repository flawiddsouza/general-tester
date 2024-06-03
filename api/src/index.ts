import { Elysia, t } from 'elysia'
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
    updateEdge,
    deleteEdge
} from './db'

const app = new Elysia()
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
    .put('/edge/:id', ({ params, body }) => {
        return updateEdge(params.id, body)
    }, {
        body: t.Partial(edge)
    })
    .delete('/edge/:id', ({ params }) => {
        return deleteEdge(params.id)
    })
    .listen(3000)

console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
)
