<template>
    <div>
        <input
            type="text"
            :value="modelValue"
            class="input full-width"
            spellcheck="false"
            @input="onInput"
        >
    </div>
  </template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

function onInput(event: Event) {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
}
</script>
