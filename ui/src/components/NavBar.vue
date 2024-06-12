<template>
    <nav id="navbar">
        <div>
            General Tester <template v-if="store.activeWorkflow">> {{ store.activeWorkflow.name }}</template>
        </div>
        <div>
            <button @click="exportWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow">Export workflow</button>
            <button @click="runWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="ml-1">Run workflow</button>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { Workflow } from '@/global'

const store = useStore()

async function exportWorkflow(workflow: Workflow) {
    const blob = new Blob([JSON.stringify({
        workflow,
        environments: store.environments,
        nodes: store.nodes,
        edges: store.edges,
    }, null, 4)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflow.name}.json`
    a.click()
    URL.revokeObjectURL(url)
}

async function runWorkflow(workflow: Workflow) {
    store.workflowLogs = []
    await store.runWorkflow(workflow.id)
}
</script>
