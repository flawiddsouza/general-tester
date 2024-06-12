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
import { watch, onBeforeMount } from 'vue'
import { useStore } from '@/store'
import NavBar from './NavBar.vue'
import NodeEditor from './NodeEditor.vue'
import Sidebar from './Sidebar.vue'
import { storeToRefs } from 'pinia'

const store = useStore()
const { activeWorkflow, activeWorkflowRun } = storeToRefs(store)

const localStorageKey = 'GeneralTester-ActiveWorkflowId'

watch(activeWorkflow, () => {
    if(activeWorkflow.value) {
        localStorage.setItem(localStorageKey, JSON.stringify(activeWorkflow.value?.id))
        store.fetchActiveWorkflow()
    } else {
        localStorage.removeItem(localStorageKey)
    }
})

watch(activeWorkflowRun, () => {
    if(activeWorkflowRun.value) {
        store.fetchActiveWorkflowRunData()
    }
})

onBeforeMount(() => {
    store.webSocket = new WebSocket('ws://localhost:9002/ws')

    store.webSocket.addEventListener('open', () => {
        console.log('Connected to server')
    })

    store.webSocket.addEventListener('message', event => {
        store.addWorkflowLog(event.data)
    })

    store.webSocket.addEventListener('close', () => {
        console.log('Disconnected from server')
    })

    const savedActiveWorkflowId = localStorage.getItem(localStorageKey)
    if(savedActiveWorkflowId) {
        const parsedSavedActiveWorkflowId = JSON.parse(savedActiveWorkflowId)
        store.fetchWorkflows(parsedSavedActiveWorkflowId)
    } else {
        store.fetchWorkflows()
    }
})
</script>
