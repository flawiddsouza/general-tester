<template>
    <nav id="navbar">
        <div>
            General Tester <template v-if="store.activeWorkflow">> {{ store.activeWorkflow.name }}</template>
        </div>
        <div>
            <div :style="{ visibility: store.activeWorkflow === null ? 'hidden' : 'visible' }">
                <div style="display: inline-flex; align-items: center; height: 100%;">
                    <select :value="store.selectedEnvironment?.id" @change="store.changeEnvironment(($event.target as any).value)" style="border: 1px solid var(--border-color); outline: 0; background-color: var(--background-color); border-radius: var(--border-radius); padding: 0.1rem 0.2rem;" title="Change Environment">
                        <option v-for="environment in store.environments" :value="environment.id">{{ environment.name }}</option>
                    </select>
                    <button @click="environmentModalShow = true" class="button ml-1">Environments</button>
                </div>
                <button @click="triggerFileInput" class="button ml-1">Import workflow</button>
                <button @click="exportWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="button ml-1">Export workflow</button>
                <button @click="runWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow" class="button ml-1">Run workflow</button>
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

async function runWorkflow(workflow: Workflow) {
    store.workflowLogs = []
    await store.runWorkflow(workflow.id)
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
        const content = e.target?.result as string
        await store.importWorkflow(content)
    }

    reader.readAsText(file)
}
</script>
