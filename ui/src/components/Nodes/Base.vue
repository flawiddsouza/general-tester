<template>
    <Handle id="input" type="target" :position="Position.Left" v-if="node.type !== 'Start'" />
    <Handle id="output" type="source" :position="Position.Right" v-if="node.type !== 'End' && node.type !== 'IfCondition'"  />
    <template v-if="node.type === 'IfCondition'">
        <Handle id="true" type="source" :position="Position.Right" class="true">True</Handle>
        <Handle id="false" type="source" :position="Position.Right" class="false">False</Handle>
    </template>
    <div class="node">
        <div class="node-header" style="gap: 1rem;">
            <span>{{ getNodeTitle(node.type) }}</span>
            <div>
                <CopyIcon @click.prevent="duplicateNode()" class="nodrag cursor-pointer" />
                <DeleteIcon @click.prevent="removeNode()" class="nodrag cursor-pointer ml-1" />
            </div>
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
import { watch, nextTick } from 'vue'
import { useStore } from '@/store'
import { CopyIcon, DeleteIcon } from '@/components/Icons'
import { nanoid } from 'nanoid'

const props = defineProps<{ node: Node }>()

const store = useStore()

function getNodeTitle(type: string) {
    return constants.NODE_TYPES.find((node) => node.name === type)?.label
}

async function duplicateNode() {
    const nodeToDuplicate = store.nodes.find(node => node.id === props.node.id)

    if (!nodeToDuplicate) {
        return
    }

    const newNode = {
        ...JSON.parse(JSON.stringify(nodeToDuplicate)),
        id: nanoid(),
        position: {
            x: nodeToDuplicate.position.x + 100,
            y: nodeToDuplicate.position.y + 50,
        }
    }

    await store.addNode(newNode)

    store.nodes.push(newNode)

    nextTick(() => {
        const nodeElement = document.querySelector(`[data-id="${newNode.id}"]`) as HTMLElement
        nodeElement.click()
    })
}

async function removeNode() {
    if (!confirm('Are you sure you want to delete this node?')) {
        return
    }

    await store.deleteNode(props.node.id)

    store.nodes = store.nodes.filter(node => node.id !== props.node.id)
}

watch(props.node.data, () => {
    store.updateNode(props.node.id, {
        data: props.node.data,
    })
}, { deep: true })
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
