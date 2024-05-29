<template>
    <div>
        <template v-for="node in nodes">
            <NodeContainer :node="node"></NodeContainer>
        </template>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import NodeContainer from './NodeContainer.vue'
import { Node } from '@/global'
import { nanoid } from 'nanoid'

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

const nodes = reactive<Node[]>([
    {
        id: nanoid(),
        type: 'HTTPRequest',
        data: {
            method: 'POST',
            url: '{{ apiUrl }}/user/login',
            headers: [
                { key: 'Content-Type', value: 'application/json' }
            ],
            body: '{"key": "value"}',
            output: "$response.body.access_token"
        },
    },
    {
        id: nanoid(),
        type: 'SocketIO',
        data: {
            url: '{{ socketUrl }}',
            path: '/socket.io',
        }
    },
])

const selectedEnvironment = computed(() => environments[selectedEnvironmentIndex.value])

function addNode() {
    nodes.push({
        id: nanoid(),
        type: 'HTTPRequest',
        data: {
            method: 'GET',
            url: '/',
            headers: [],
            body: '',
            output: '',
        },
    })
}
</script>
