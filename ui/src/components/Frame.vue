<template>
    <div id="frame">
        <NodeEditor style="width: 100%; height: 100%;"></NodeEditor>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import NodeEditor from './NodeEditor.vue'

const environments = reactive([
    {
        name: 'Development',
        env: {
            apiUrl: 'http://localhost:3000',
            socketUrl: 'ws://localhost:3000',
        }
    },
    {
        name: 'Production',
        env: {
            baseUrl: 'https://example.com',
            socketUrl: 'wss://example.com',
        }
    }
])

const selectedEnvironmentIndex = ref(0)

const selectedEnvironment = computed(() => environments[selectedEnvironmentIndex.value])
</script>
