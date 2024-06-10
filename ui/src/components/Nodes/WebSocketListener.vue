<template>
    <Base :node="node">
        <div>
            <label>
                Event To Listen To
                <div>
                    <select v-model="node.data.eventName" class="input full-width nodrag">
                        <option value="open">open</option>
                        <option value="message">message</option>
                        <option value="close">close</option>
                        <option value="error">error</option>
                    </select>
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { WebSocketListenerNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: WebSocketListenerNode }>()
</script>
