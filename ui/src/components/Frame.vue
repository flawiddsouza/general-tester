<template>
    <div id="frame">
        <NavBar />
        <div id="frame-content">
            <NodeEditor :nodes="store.nodes" :edges="store.edges" style="width: 100%; height: 100%;"></NodeEditor>
            <Sidebar />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useStore } from '@/store'
import NavBar from './NavBar.vue'
import NodeEditor from './NodeEditor.vue'
import Sidebar from './Sidebar.vue'

const store = useStore()

onBeforeMount(() => {
    store.fetchFlow()
})
</script>
