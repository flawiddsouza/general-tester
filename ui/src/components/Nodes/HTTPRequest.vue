<template>
    <Base :node="node">
        <div>{{ node.data.url }}</div>
        <div>{{ node.data.headers }}</div>
        <div>{{ node.data.body }}</div>
        <div>{{ node.data.output }}</div>
    </Base>
</template>

<script setup lang="ts">
import { HTTPRequestNode } from '@/global'
import Base from './Base.vue'

defineProps<{ node: HTTPRequestNode }>()
</script>
