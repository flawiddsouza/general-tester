<template>
    <Base :node="node">
        <div>
            <label>
                URL
                <div>
                    <TextInput v-model="node.data.url" />
                </div>
            </label>
        </div>
        <div>
            <label>
                Path
                <div>
                    <TextInput v-model="node.data.path" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { SocketIONode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: SocketIONode }>()
</script>
