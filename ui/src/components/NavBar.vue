<template>
    <nav id="navbar">
        <div>
            General Tester <template v-if="store.activeWorkflow">> {{ store.activeWorkflow.name }}</template>
        </div>
        <div>
            <button @click="runWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow">Run workflow</button>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useStore } from '@/store'

const store = useStore()

async function runWorkflow(workflow: Workflow) {
    store.workflowLogs = []
    await store.runWorkflow(workflow.id)
}
</script>
