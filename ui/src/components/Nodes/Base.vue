<template>
    <div class="node">
        <div class="node-header">
            <span>{{ node.type }}</span>
            <a href="#" @click.prevent="removeNode">Remove</a>
        </div>
        <div class="node-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Node } from '@/global'

const props = defineProps<{ node: Node }>()

function removeNode() {
    console.log('remove node' + props.node.id)
}
</script>
