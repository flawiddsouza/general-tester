<template>
    <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 1 }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
    >
        <Background :gap="15" :style="{ backgroundColor: isDragOver ? '#e7f3ff' : 'transparent' }" />

        <template #node-Start="node">
            <Start :node="(node as StartNode)" />
        </template>

        <template #node-End="node">
            <End :node="(node as EndNode)" />
        </template>

        <template #node-HTTPRequest="node">
            <HTTPRequest :node="(node as HTTPRequestNode)" />
        </template>

        <template #node-SocketIO="node">
            <SocketIO :node="(node as SocketIONode)" />
        </template>

        <template #node-SocketIOListener="node">
            <SocketIOListener :node="(node as SocketIOListenerNode)" />
        </template>

        <template #node-SocketIOEmitter="node">
            <SocketIOEmitter :node="(node as SocketIOEmitterNode)" />
        </template>

    </VueFlow>
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import useDragAndDrop from '@/helpers/useDnD'
import { Node, Edge, StartNode, EndNode, HTTPRequestNode, SocketIONode, SocketIOListenerNode, SocketIOEmitterNode } from '@/global'
import Start from './Nodes/Start.vue'
import End from './Nodes/End.vue'
import HTTPRequest from './Nodes/HTTPRequest/Index.vue'
import SocketIO from './Nodes/SocketIO.vue'
import SocketIOListener from './Nodes/SocketIOListener.vue'
import SocketIOEmitter from './Nodes/SocketIOEmitter.vue'
import { useStore } from '@/store'
import { nanoid } from 'nanoid'

defineProps<{ nodes: Node[]; edges: Edge[] }>()

const store = useStore()
const { onConnect, addEdges } = useVueFlow()
const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop(store)

onConnect((edge) => {
    const edgeConverted: Edge = edge as Edge
    edgeConverted.id = nanoid()
    edgeConverted.workflowId = store.activeWorkflow?.id as string
    edgeConverted.animated = true
    addEdges([edgeConverted])
    store.addEdge(edgeConverted)
})
</script>
