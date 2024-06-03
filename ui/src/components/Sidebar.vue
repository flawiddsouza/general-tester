<template>
    <aside id="sidebar">
        <div class="tabs full-width mb-2">
            <div @click="selectedTab = 'workflows'" :class="{ active: selectedTab === 'workflows' }">Workflows</div>
            <div @click="selectedTab = 'nodes'" :class="{ active: selectedTab === 'nodes' }">Nodes</div>
            <div @click="selectedTab = 'runs'" :class="{ active: selectedTab === 'runs' }">Runs</div>
        </div>
        <div v-if="selectedTab === 'workflows'">
            Workflows
        </div>
        <div v-if="selectedTab === 'nodes'">
            <div>You can drag these nodes to the pane</div>

            <div class="nodes">
                <div class="node mt-1 cursor-grab" style="padding: 0.5rem" :draggable="true" @dragstart="onDragStart($event, nodesType.name)" v-for="nodesType in nodesTypes">{{ nodesType.label }}</div>
            </div>
        </div>
        <div v-if="selectedTab === 'runs'">
            Runs
        </div>
    </aside>
</template>

<script setup>
import useDragAndDrop from '@/helpers/useDnD'
import { ref } from 'vue'
import { constants } from '@/constants'

const { onDragStart } = useDragAndDrop()

const nodesTypes = ref(constants.NODE_TYPES)
const selectedTab = ref('nodes')
</script>
