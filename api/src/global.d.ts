import { workflow, environment, node, edge } from './schema'

export interface WorkflowData {
    workflow: workflow
    environments: environment[]
    nodes: node[]
    edges: edge[]
}
