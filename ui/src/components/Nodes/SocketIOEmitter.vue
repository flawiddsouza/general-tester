<template>
    <Base :node="node">
        <div>
            <label>
                Event Name
                <div>
                    <TextInput v-model="node.data.eventName" />
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                Event Body
                <div>
                    <textarea v-model="node.data.eventBody" class="input full-width" spellcheck="false"></textarea>
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { SocketIOEmitterNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: SocketIOEmitterNode }>()
</script>
