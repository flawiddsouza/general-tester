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
import { constants } from '@/constants'
import { watch } from 'vue'
import { useStore } from '@/store'

const props = defineProps<{ node: Node }>()

const store = useStore()

function getNodeTitle(type: string) {
    return constants.NODE_TYPES.find((node) => node.name === type)?.label
}

function removeNode() {
    console.log('remove node' + props.node.id)
}

watch(props.node.data, () => {
    store.updateNode(props.node.id, {
        data: props.node.data,
    })
})
</script>
