<template>
    <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
    >
        <Background :gap="15" />
        <template #node-HTTPRequest="node">
            <HTTPRequest :node="node as HTTPRequestNode" />
        </template>
        <template #node-SocketIO="node">
            <SocketIO :node="node as SocketIONode" />
        </template>
        <template #node-Root="node">
            <Root :node="node as RootNode" />
        </template>
    </VueFlow>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { RootNode, HTTPRequestNode, Node, SocketIONode } from '@/global'
import Root from './Nodes/Root.vue'
import HTTPRequest from './Nodes/HTTPRequest/Index.vue'
import SocketIO from './Nodes/SocketIO.vue'
import { nanoid } from 'nanoid'

const id1 = nanoid()
const id2 = nanoid()
const id3 = nanoid()

const nodes = reactive<Node[]>([
    {
        id: id1,
        type: 'Root',
        data: {},
        position: { x: 30, y: 30 },
    },
    {
        id: id2,
        type: 'HTTPRequest',
        data: {
            method: 'POST',
            url: '{{ apiUrl }}/user/login',
            queryParams: [],
            headers: [
                { name: 'Content-Type', value: 'application/json', disabled: false }
            ],
            body: {
                mimeType: 'application/json',
                params: [],
                text: '{"key": "value"}'
            },
            output: "$response.body.access_token"
        },
        position: { x: 350, y: 114 },
    },
    {
        id: id3,
        type: 'SocketIO',
        data: {
            url: '{{ socketUrl }}',
            path: '/socket.io',
        },
        position: { x: 900, y: 114 },
    },
])

const edges = ref([
    {
        id: nanoid(),
        source: id1,
        sourceHandle: 'output',
        target: id2,
        targetHandle: 'input',
        animated: true,
    },
    {
        id: nanoid(),
        source: id2,
        sourceHandle: 'output',
        target: id3,
        targetHandle: 'input',
        animated: true,
    },
])
</script>
