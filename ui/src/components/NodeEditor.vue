<template>
    <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 1 }"
        @nodesChange="(handleNodesChange as any)"
        @edgesChange="(handleEdgesChange as any)"
        @dragover="(onDragOver as any)"
        @dragleave="onDragLeave"
        @drop="(onDrop as any)"
        :ref="ref => store.vueFlowRef = ref"
    >
        <Background :gap="15" :style="{ backgroundColor: isDragOver ? '#e7f3ff' : 'transparent' }" />

        <template #node-Start="node">
            <Start :node="(node as unknown as StartNode)" />
        </template>

        <template #node-End="node">
            <End :node="(node as unknown as EndNode)" />
        </template>

        <template #node-HTTPRequest="node">
            <HTTPRequest :node="(node as unknown as HTTPRequestNode)" />
        </template>

        <template #node-SocketIO="node">
            <SocketIO :node="(node as unknown as SocketIONode)" />
        </template>

        <template #node-SocketIOListener="node">
            <SocketIOListener :node="(node as unknown as SocketIOListenerNode)" />
        </template>

        <template #node-SocketIOEmitter="node">
            <SocketIOEmitter :node="(node as unknown as SocketIOEmitterNode)" />
        </template>

        <template #node-WebSocket="node">
            <WebSocket :node="(node as unknown as WebSocketNode)" />
        </template>

        <template #node-WebSocketListener="node">
            <WebSocketListener :node="(node as unknown as WebSocketListenerNode)" />
        </template>

        <template #node-WebSocketEmitter="node">
            <WebSocketEmitter :node="(node as unknown as WebSocketEmitterNode)" />
        </template>

        <template #node-IfCondition="node">
            <IfCondition :node="(node as unknown as IfConditionNode)" />
        </template>

        <template #node-Delay="node">
            <Delay :node="(node as unknown as DelayNode)" />
        </template>

        <template #node-SetVariable="node">
            <SetVariable :node="(node as unknown as SetVariableNode)" />
        </template>
    </VueFlow>
</template>

<script setup lang="ts">
import { EdgeChange, NodeChange, VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import useDragAndDrop from '@/helpers/useDnD'
import {
    Node,
    Edge,
    StartNode,
    EndNode,
    HTTPRequestNode,
    SocketIONode,
    SocketIOListenerNode,
    SocketIOEmitterNode,
    WebSocketNode,
    WebSocketListenerNode,
    WebSocketEmitterNode,
    IfConditionNode,
    DelayNode,
    SetVariableNode,
} from '@/global'
import Start from './Nodes/Start.vue'
import End from './Nodes/End.vue'
import HTTPRequest from './Nodes/HTTPRequest/Index.vue'
import SocketIO from './Nodes/SocketIO.vue'
import SocketIOListener from './Nodes/SocketIOListener.vue'
import SocketIOEmitter from './Nodes/SocketIOEmitter.vue'
import WebSocket from './Nodes/WebSocket.vue'
import WebSocketListener from './Nodes/WebSocketListener.vue'
import WebSocketEmitter from './Nodes/WebSocketEmitter.vue'
import IfCondition from './Nodes/IfCondition.vue'
import Delay from './Nodes/Delay.vue'
import SetVariable from './Nodes/SetVariable.vue'
import { useStore } from '@/store'
import { nanoid } from 'nanoid'
import { useToast } from 'vue-toast-notification'

defineProps<{ nodes: Node[]; edges: Edge[] }>()

const store = useStore()
const { onConnect, addEdges, onNodeDragStop } = useVueFlow()
const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop(store)
const $toast = useToast()

onConnect((edge) => {
    if (edge.source === edge.target) {
        $toast.error('Cannot connect a node to itself')
        return
    }

    const edgeConverted: Edge = edge as Edge
    edgeConverted.id = nanoid()
    edgeConverted.workflowId = store.activeWorkflow?.id as string
    edgeConverted.animated = true
    addEdges([edgeConverted])
    store.addEdge(edgeConverted)
})

onNodeDragStop((event) => {
    const node = event.node
    store.updateNode(node.id, {
        position: {
            x: node.position.x,
            y: node.position.y,
        },
    })
})

function handleNodesChange(nodes: NodeChange[]) {
    nodes.forEach((node) => {
        if (node.type === 'remove') {
            store.deleteNode(node.id)
        }
    })
}

function handleEdgesChange(edges: EdgeChange[]) {
    edges.forEach((edge) => {
        if (edge.type === 'remove') {
            store.deleteEdge(edge.id)
        }
    })
}
</script>
