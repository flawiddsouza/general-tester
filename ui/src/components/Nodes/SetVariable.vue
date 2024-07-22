<template>
    <Base :node="node">
        <div>
            <label>
                Key
                <div>
                    <TextInput v-model="node.data.key" class="nodrag" />
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                Value
                <div>
                    <TextInput v-model="node.data.value" class="nodrag" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { SetVariableNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: SetVariableNode }>()
</script>
