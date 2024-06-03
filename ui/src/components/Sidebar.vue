<template>
    <aside id="sidebar">
        <div class="tabs full-width">
            <div @click="selectedTab = 'workflows'" :class="{ active: selectedTab === 'workflows' }">Workflows</div>
            <div @click="selectedTab = 'nodes'" :class="{ active: selectedTab === 'nodes' }">Nodes</div>
            <div @click="selectedTab = 'runs'" :class="{ active: selectedTab === 'runs' }">Runs</div>
        </div>
        <div v-if="selectedTab === 'workflows'">
            <div class="sidebar-item cursor-pointer" @click="addNewWorkflow()">+ Add new workflow</div>
            <div class="sidebar-item cursor-pointer" v-for="workflow in store.workflows" @click="store.activeWorkflow = workflow">{{ workflow.name }}</div>
        </div>
        <div v-if="selectedTab === 'nodes'" class="p-2">
            <div>You can drag these nodes to the pane</div>

            <div class="nodes">
                <div class="node mt-1 cursor-grab p-1" :draggable="true" @dragstart="onDragStart($event, nodesType.name)" v-for="nodesType in nodesTypes">{{ nodesType.label }}</div>
            </div>
        </div>
        <div v-if="selectedTab === 'runs'" class="p-2">
            Runs
        </div>
    </aside>
</template>

<script setup lang="ts">
import useDragAndDrop from '@/helpers/useDnD'
import { ref } from 'vue'
import { constants } from '@/constants'
import { useStore } from '@/store'

const { onDragStart } = useDragAndDrop()
const store = useStore()

const nodesTypes = ref(constants.NODE_TYPES)
const selectedTab = ref('nodes')

async function addNewWorkflow() {
    const prompt = window.prompt('Enter the name of the new workflow')

    if (prompt) {
        await store.createWorkflow({
            name: prompt,
        })
    }
}
</script>
