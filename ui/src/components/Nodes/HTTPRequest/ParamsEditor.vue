<template>
    <table class="full-width no-padding">
        <tr v-for="(param, index) in params">
            <td><input type="text" v-model="param.name" class="input full-width nodrag" :disabled="param.disabled"></td>
            <td><input type="text" v-model="param.value" class="input full-width nodrag" :disabled="param.disabled"></td>
            <td><input type="checkbox" :checked="param.disabled === undefined || param.disabled === false" @change="param.disabled = ($event.target as HTMLInputElement).checked ? false : true" class="input"></td>
            <td>
                <svg xmlns="http://www.w3.org/2000/svg" class="cursor-pointer" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" @click="params.splice(index, 1)">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </svg>
            </td>
        </tr>
        <tr>
            <td colspan="100%" @click="params.push({ name: '', value: '', disabled: false })" class="cursor-pointer text-center">
                <div class="input">+ Add Item</div>
            </td>
        </tr>
    </table>
</template>

<script setup lang="ts">
import { Param } from '@/global'

defineProps<{ params: Param[] }>()
</script>
