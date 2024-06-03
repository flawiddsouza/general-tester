<template>
    <nav id="navbar">
        General Tester <template v-if="store.activeWorkflow">> {{ store.activeWorkflow.name }}</template>
    </nav>
</template>

<script setup lang="ts">
import { useStore } from '@/store'

const store = useStore()
</script>
