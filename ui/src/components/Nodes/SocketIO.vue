<template>
    <Base :node="node">
        <div>{{ node.data.url }}</div>
        <div>{{ node.data.path }}</div>
    </Base>
</template>

<script setup lang="ts">
import { SocketIONode } from '@/global'
import Base from './Base.vue'

defineProps<{ node: SocketIONode }>()
</script>
