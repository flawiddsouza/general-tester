<template>
    <Handle id="input" type="target" :position="Position.Left" v-if="node.type !== 'Start'" />
    <Handle id="output" type="source" :position="Position.Right" v-if="node.type !== 'End' && node.type !== 'IfCondition'"  />
    <template v-if="node.type === 'IfCondition'">
        <Handle id="true" type="source" :position="Position.Right" class="true">True</Handle>
        <Handle id="false" type="source" :position="Position.Right" class="false">False</Handle>
    </template>
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

<style scoped>
.true, .false {
    color: white;
    width: fit-content;
    height: fit-content;
    border: 0;
    border-radius: 10px;
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    padding: 0.2rem;
    padding-right: 0.4rem;
    transform: translate(100%, -50%);
}

.true {
    top: 30%;
}

.false {
    top: initial;
    bottom: 20%;
}
</style>
