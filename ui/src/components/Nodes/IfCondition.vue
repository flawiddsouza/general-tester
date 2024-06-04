<template>
    <Base :node="node">
        <div>
            <label>
                Left Operand
                <div>
                    <TextInput v-model="node.data.leftOperand" class="nodrag" />
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                Operator
                <div>
                    <select v-model="node.data.operator" class="input full-width nodrag">
                        <option>==</option>
                        <option>!=</option>
                        <option>></option>
                        <option>>=</option>
                        <option>{{ '<' }}</option>
                        <option>{{ '<=' }}</option>
                    </select>
                </div>
            </label>
        </div>
        <div class="mt-1">
            <label>
                Right Operand
                <div>
                    <TextInput v-model="node.data.rightOperand" class="nodrag" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { IfConditionNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'

defineProps<{ node: IfConditionNode }>()
</script>
