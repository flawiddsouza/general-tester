<template>
    <Base :node="node">
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(variable, variableIndex) in node.data.variables">
                    <td>
                        <TextInput v-model="variable.name" class="nodrag" />
                    </td>
                    <td>
                        <TextInput v-model="variable.value" class="nodrag" />
                    </td>
                    <td>
                        <DeleteIcon @click="removeVariable(variableIndex)" class="nodrag cursor-pointer" v-if="variableIndex > 0" />
                        <DeleteIcon class="v-h" v-else />
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="mt-1">
            <button @click="addVariable" class="button nodrag">Add Variable</button>
        </div>
        <div class="mt-2 text-center" style="color: var(--secondary-text-color)">This is a passthrough node. Any input added to this node, will be passed to the next node as output without modification.</div>
    </Base>
</template>

<script setup lang="ts">
import { SetVariableNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'
import { DeleteIcon } from '@/components/Icons'

const props = defineProps<{ node: SetVariableNode }>()

function addVariable() {
    props.node.data.variables.push({
        name: '',
        value: '',
        disabled: false
    })
}

function removeVariable(index: number) {
    props.node.data.variables.splice(index, 1)
}
</script>
