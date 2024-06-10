<template>
    <Base :node="node">
        <div class="mt-1">
            <label>
                Event Body
                <div>
                    <textarea v-model="node.data.eventBody" class="input full-width nodrag" spellcheck="false"></textarea>
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { WebSocketEmitterNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: WebSocketEmitterNode }>()
</script>
