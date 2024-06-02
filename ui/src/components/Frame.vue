<template>
    <div id="frame">
        <NodeEditor :nodes="store.nodes" :edges="store.edges" style="width: 100%; height: 100%;"></NodeEditor>
        <Sidebar />
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useStore } from '@/store';
import NodeEditor from './NodeEditor.vue'
import Sidebar from './Sidebar.vue'

const store = useStore()

onBeforeMount(() => {
    store.fetchFlow()
})
</script>
