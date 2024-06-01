<template>
    <Base :node="node">
        Ending Node
    </Base>
</template>

<script setup lang="ts">
import { Node } from '@/global'
import Base from './Base.vue'

defineProps<{ node: Node }>()
</script>
