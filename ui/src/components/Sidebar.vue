<template>
    <aside id="sidebar">
        <div class="tabs full-width">
            <div @click="selectedTab = 'workflows'" :class="{ active: selectedTab === 'workflows' }">Workflows</div>
            <div @click="selectedTab = 'nodes'" :class="{ active: selectedTab === 'nodes' }">Nodes</div>
            <div @click="selectedTab = 'runs'" :class="{ active: selectedTab === 'runs' }">Runs</div>
        </div>
        <div v-if="selectedTab === 'workflows'">
            <div class="sidebar-item" @click="addNewWorkflow()">+ Add new workflow</div>
            <div class="sidebar-item flex flex-jc-sb flex-ai-c" :class="{ active: store.activeWorkflow?.id === workflow.id }" v-for="workflow in store.workflows" @click="store.activeWorkflow = workflow">
                <div>{{ workflow.name }}</div>
                <div class="grid">
                    <svg xmlns="http://www.w3.org/2000/svg" class="cursor-pointer" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" @click.stop="deleteWorkflow(workflow)">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                </div>
            </div>
        </div>
        <div v-if="selectedTab === 'nodes'" class="p-2">
            <div>You can drag these nodes to the pane</div>

            <div class="nodes">
                <div class="node mt-1 cursor-grab p-1" :draggable="store.activeWorkflow ? true : false" @dragstart="onDragStart($event, nodesType.name)" v-for="nodesType in nodesTypes">{{ nodesType.label }}</div>
            </div>
        </div>
        <div v-if="selectedTab === 'runs'" class="p-2">
            <div>
                <button @click="runWorkflow(store.activeWorkflow as Workflow)" :disabled="!store.activeWorkflow">Run workflow</button>
            </div>
            <div v-for="log in store.workflowLogs" class="mt-1">{{ log }}</div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import useDragAndDrop from '@/helpers/useDnD'
import { ref } from 'vue'
import { constants } from '@/constants'
import { useStore } from '@/store'
import { Workflow } from '@/global';

const { onDragStart } = useDragAndDrop()
const store = useStore()

const nodesTypes = ref(constants.NODE_TYPES)
const selectedTab = ref('workflows')

async function addNewWorkflow() {
    const prompt = window.prompt('Enter the name of the new workflow')

    if (prompt) {
        await store.createWorkflow({
            name: prompt,
        })
    }
}

async function deleteWorkflow(workflow: Workflow) {
    if (!window.confirm('Are you sure you want to delete this workflow?')) {
        return
    }

    await store.deleteWorkflow(workflow.id)
}

async function runWorkflow(workflow: Workflow) {
    await store.runWorkflow(workflow.id)
}
</script>
