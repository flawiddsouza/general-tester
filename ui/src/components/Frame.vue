<template>
    <div id="frame">
        <NodeEditor :nodes="nodes" :edges="edges" style="width: 100%; height: 100%;"></NodeEditor>
        <Sidebar />
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import NodeEditor from './NodeEditor.vue'
import Sidebar from './Sidebar.vue'
import { nanoid } from 'nanoid'
import { Node, Edge } from '@/global'

const environments = reactive([
    {
        name: 'Development',
        env: {
            apiUrl: 'http://localhost:3000',
            socketUrl: 'ws://localhost:3000',
        }
    },
    {
        name: 'Production',
        env: {
            baseUrl: 'https://example.com',
            socketUrl: 'wss://example.com',
        }
    }
])

const selectedEnvironmentIndex = ref(0)

const selectedEnvironment = computed(() => environments[selectedEnvironmentIndex.value])

const id1 = nanoid()
const id2 = nanoid()
const id3 = nanoid()
const id4 = nanoid()
const id5 = nanoid()

const nodes = reactive<Node[]>([
    {
        id: id1,
        type: 'Start',
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
            output: '$response.body.access_token'
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
    {
        id: id4,
        type: 'SocketIOListener',
        data: {
            eventName: 'connect',
        },
        position: { x: 1200, y: 114 },
    },
    {
        id: id5,
        type: 'SocketIOListener',
        data: {
            eventName: 'message',
        },
        position: { x: 1200, y: 300 },
    },
    {
        id: nanoid(),
        type: 'End',
        data: {},
        position: { x: 1500, y: 300 },
    },
])

const edges = reactive<Edge[]>([
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
    {
        id: nanoid(),
        source: id3,
        sourceHandle: 'output',
        target: id4,
        targetHandle: 'input',
        animated: true,
    },
    {
        id: nanoid(),
        source: id3,
        sourceHandle: 'output',
        target: id5,
        targetHandle: 'input',
        animated: true,
    },
    {
        id: nanoid(),
        source: id5,
        sourceHandle: 'output',
        target: nodes[nodes.length - 1].id,
        targetHandle: 'input',
        animated: true,
    },
])
</script>
