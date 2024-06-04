<template>
    <Base :node="node">
        <div>
            <label>
                Version
                <div>
                    <select v-model="node.data.version" class="input full-width nodrag">
                        <option :value="2">2</option>
                        <option :value="3">3</option>
                        <option :value="4">4</option>
                    </select>
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                URL
                <div>
                    <TextInput v-model="node.data.url" class="nodrag" />
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                Path
                <div>
                    <TextInput v-model="node.data.path" class="nodrag" />
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
