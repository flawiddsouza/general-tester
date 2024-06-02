<template>
    <aside id="sidebar">
        <div>You can drag these nodes to the pane</div>

        <div class="nodes">
            <div class="node mt-1 cursor-grab" style="padding: 0.5rem" :draggable="true" @dragstart="onDragStart($event, nodesType.name)" v-for="nodesType in nodesTypes">{{ nodesType.label }}</div>
        </div>
    </aside>
</template>

<script setup>
import useDragAndDrop from '@/helpers/useDnD'
import { ref } from 'vue';

const { onDragStart } = useDragAndDrop()

const nodesTypes = ref([
    { label: 'Start', name: 'Start' },
    { label: 'End', name: 'End' },
    { label: 'HTTP Request', name: 'HTTPRequest' },
    { label: 'Socket.IO', name: 'SocketIO' },
    { label: 'Socket.IO Listener', name: 'SocketIOListener' },
])
</script>
