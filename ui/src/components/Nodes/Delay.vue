<template>
    <Base :node="node">
        <div>
            <label>
                Delay (ms)
                <div>
                    <input type="number" v-model.number="node.data.delayInMS" class="input full-width nodrag" @keydown="handleKeydown" @paste.prevent="handlePaste" min="0" />
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { DelayNode } from '@/global'
import Base from './Base.vue'

defineProps<{ node: DelayNode }>()

function handleKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'e' || e.key === '-' || e.key === '+' || e.key === '.') {
        e.preventDefault()
    }
}

function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain')
    if (text) {
        const num = parseInt(text)
        if (!isNaN(num) && num >= 0) {
            document.execCommand('insertText', false, num.toString())
        }
    }
}
</script>
