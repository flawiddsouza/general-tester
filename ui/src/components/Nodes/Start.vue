<template>
    <Base :node="node">
        Starting Node
        <div class="mt-1">
            <table class="table" v-if="node.data.parallelEntries && node.data.parallelEntries.length">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th v-for="(_entry, entryIndex) in node.data.parallelEntries" :key="'header-' + entryIndex">
                            {{ entryIndex + 1 }}
                            <DeleteIcon @click="removeEntry(entryIndex)" class="nodrag cursor-pointer" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(variable, variableIndex) in node.data.parallelEntries[0]?.variables || []" :key="'row-' + variableIndex">
                        <td>
                            <div class="flex">
                                <TextInput :modelValue="variable.name" @input="updateVariableName(variableIndex, $event.target.value)" class="nodrag" />
                            </div>
                        </td>
                        <td v-for="(entry, entryIndex) in node.data.parallelEntries" :key="'entry-' + entryIndex + '-var-' + variableIndex">
                            <TextInput v-model="entry.variables[variableIndex].value" class="nodrag" />
                        </td>
                        <td>
                            <DeleteIcon @click="removeVariable(variableIndex)" class="nodrag cursor-pointer" />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="mt-1">
                <button @click="addVariable" class="button nodrag">Add Variable</button>
                <button @click="addEntry" class="button ml-1 nodrag">Add Parallel Entry</button>
            </div>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { StartNode } from '@/global'
import Base from './Base.vue'
import TextInput from '@/components/TextInput.vue'
import { DeleteIcon } from '@/components/Icons'

const props = defineProps<{ node: StartNode }>()

function addEntry() {
    if (!props.node.data.parallelEntries) {
        props.node.data.parallelEntries = []
    }

    const variables = props.node.data.parallelEntries[0]?.variables.map((variable) => ({ ...variable, value: '' })) || []

    const entriesToAdd = [ { variables } ]

    if (props.node.data.parallelEntries.length === 0) {
        entriesToAdd.push({ variables: structuredClone(variables) })
    }

    props.node.data.parallelEntries.push(...entriesToAdd)
}

function removeEntry(index: number) {
    props.node.data.parallelEntries.splice(index, 1)
}

function addVariable() {
    if (!props.node.data.parallelEntries || props.node.data.parallelEntries.length === 0) {
        props.node.data.parallelEntries = [
            { variables: [] }
        ]
    }

    props.node.data.parallelEntries.forEach(entry => {
        entry.variables.push({ name: '', value: '', disabled: false })
    })
}

function updateVariableName(index: number, name: string) {
    props.node.data.parallelEntries.forEach(entry => {
        entry.variables[index].name = name
    })
}

function removeVariable(index: number) {
    props.node.data.parallelEntries.forEach(entry => {
        entry.variables.splice(index, 1)
    })
}
</script>
