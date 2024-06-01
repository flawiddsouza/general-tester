<template>
    <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 1 }"
    >
        <Background :gap="15" />

        <template #node-Start="node">
            <Start :node="node as StartNode" />
        </template>

        <template #node-End="node">
            <End :node="node as EndNode" />
        </template>

        <template #node-HTTPRequest="node">
            <HTTPRequest :node="node as HTTPRequestNode" />
        </template>

        <template #node-SocketIO="node">
            <SocketIO :node="node as SocketIONode" />
        </template>

        <template #node-SocketIOListener="node">
            <SocketIOListener :node="node as SocketIOListenerNode" />
        </template>

    </VueFlow>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Node, Edge, StartNode, EndNode, HTTPRequestNode, SocketIONode, SocketIOListenerNode } from '@/global'
import Start from './Nodes/Start.vue'
import End from './Nodes/End.vue'
import HTTPRequest from './Nodes/HTTPRequest/Index.vue'
import SocketIO from './Nodes/SocketIO.vue'
import SocketIOListener from './Nodes/SocketIOListener.vue'

defineProps<{ nodes: Node[]; edges: Edge[] }>()
</script>
