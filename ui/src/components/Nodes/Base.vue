<template>
    <Handle id="input" type="source" :position="Position.Left" v-if="node.type !== 'Start'" />
    <Handle id="output" type="target" :position="Position.Right" v-if="node.type !== 'End'"  />
    <div class="node">
        <div class="node-header">
            <span>{{ getNodeTitle(node.type) }}</span>
            <a href="#" @click.prevent="removeNode">Remove</a>
        </div>
        <div class="node-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Node } from '@/global'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{ node: Node }>()

function getNodeTitle(type: string) {
    if (type === 'Start') {
        return 'Start'
    }

    if (type === 'End') {
        return 'End'
    }

    if (type === 'HTTPRequest') {
        return 'HTTP Request'
    }

    if (type === 'SocketIO') {
        return 'Socket.IO'
    }

    if (type === 'SocketIOListener') {
        return 'Socket.IO Listener'
    }
}

function removeNode() {
    console.log('remove node' + props.node.id)
}
</script>
