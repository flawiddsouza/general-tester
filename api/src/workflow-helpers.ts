import { WorkflowData } from './global'

export async function runWorkflow(workflowData: WorkflowData) {
    console.log(`Running workflow ${workflowData.workflow.name}`)
    console.log(workflowData.nodes)
    console.log(workflowData.edges)

    setTimeout(() => {
        console.log('Workflow finished')
    }, 4000)
}
