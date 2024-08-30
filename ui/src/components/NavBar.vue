<template>
    <nav id="navbar">
        <div>
            General Tester <template v-if="store.activeWorkflow">> {{ store.activeWorkflow.name }}</template>
        </div>
        <div>
            <div>
                <div style="display: inline-flex; align-items: center; height: 100%;" :style="{ visibility: store.activeWorkflow === null ? 'hidden' : 'visible' }">
                    <select :value="store.selectedEnvironment?.id" @change="store.changeEnvironment(($event.target as any).value)" style="border: 1px solid var(--border-color); outline: 0; background-color: var(--background-color); border-radius: var(--border-radius); padding: 0.1rem 0.2rem;" title="Change Environment">
                        <option v-for="environment in store.environments" :value="environment.id">{{ environment.name }}</option>
                    </select>
                    <button @click="environmentModalShow = true" class="button ml-1">Environments</button>
                </div>
                <button @click="triggerFileInput" class="button ml-1">Import workflow</button>
                <template v-if="store.activeWorkflow">
                    <button @click="exportWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="button ml-1">Export workflow</button>
                    <button @click="duplicateWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="button ml-1">Duplicate workflow</button>
                    <template v-if="store.activeWorkflowRun?.status === 1">
                        <button @click="stopWorkflowRun(store.activeWorkflowRun?.id)" :disabled="!store.activeWorkflow" class="button ml-1">Stop workflow Run</button>
                    </template>
                    <template v-else>
                        <button @click="runWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="button ml-1">Run workflow</button>
                    </template>
                </template>
                <input type="file" @change="importWorkflow" style="display: none;" ref="fileInput">
            </div>
        </div>
    </nav>
    <EnvironmentModal v-model:showModal="environmentModalShow" v-if="store.activeWorkflow" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@/store'
import { Workflow } from '@/global'
import EnvironmentModal from '@/components/EnvironmentModal.vue'

const store = useStore()
const environmentModalShow = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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

async function duplicateWorkflow(workflow: Workflow) {
    const workflowData = {
        workflow,
        environments: store.environments,
        nodes: store.nodes,
        edges: store.edges,
    }

    const content = JSON.parse(JSON.stringify(workflowData))

    const newWorkflowName = prompt('Enter new workflow name:', `${workflow.name} (copy)`)

    if (!newWorkflowName) {
        return
    }

    content.workflow.name = newWorkflowName

    await store.importWorkflow(JSON.stringify(content))
}

async function runWorkflow(workflow: Workflow) {
    store.workflowLogs = []
    await store.runWorkflow(workflow.id)
}

async function stopWorkflowRun(workflowRunId: string) {
    await store.stopWorkflowRun(workflowRunId)
}

function triggerFileInput() {
    fileInput.value?.click()
}

async function importWorkflow(event: Event) {
    const input = event.target as HTMLInputElement

    if (!input.files?.length) return

    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = async (e) => {
        const content = JSON.parse(e.target?.result as string)

        input.value = ''

        const newWorkflowName = prompt('Enter new workflow name:', content.workflow.name)

        if (!newWorkflowName) {
            return
        }

        content.workflow.name = newWorkflowName

        await store.importWorkflow(JSON.stringify(content))
    }

    reader.readAsText(file)
}
</script>
