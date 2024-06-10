<template>
    <Base :node="node">
        <div>
            <label>
                URL
                <div>
                    <TextInput v-model="node.data.url" class="nodrag" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { WebSocketNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: WebSocketNode }>()
</script>
