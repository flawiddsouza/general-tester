<template>
    <div>
        <template v-if="node.type === 'HTTPRequest'">
            <HTTPRequest :node="node"></HTTPRequest>
        </template>
        <template v-if="node.type === 'SocketIO'">
            <SocketIO :node="node"></SocketIO>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Node } from '@/global'
import HTTPRequest from './Nodes/HTTPRequest.vue'
import SocketIO from './Nodes/SocketIO.vue'

defineProps<{ node: Node }>()
</script>
