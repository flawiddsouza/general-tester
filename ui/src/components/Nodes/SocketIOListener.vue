<template>
    <Base :node="node">
        <div>
            <label>
                Event Name To Listen To
                <div>
                    <TextInput v-model="node.data.eventName" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { SocketIOListenerNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: SocketIOListenerNode }>()
</script>
