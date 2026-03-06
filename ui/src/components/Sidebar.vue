<template>
    <aside id="sidebar">
        <div class="tabs full-width">
            <div @click="store.sidebarSelectedTab = 'workflows'" :class="{ active: store.sidebarSelectedTab === 'workflows' }">Workflows</div>
            <div @click="store.sidebarSelectedTab = 'nodes'" :class="{ active: store.sidebarSelectedTab === 'nodes' }">Nodes</div>
            <div @click="store.sidebarSelectedTab = 'runs'" :class="{ active: store.sidebarSelectedTab === 'runs' }">Runs</div>
            <div @click="store.sidebarSelectedTab = 'log'" :class="{ active: store.sidebarSelectedTab === 'log' }">Log</div>
        </div>
        <div v-if="store.sidebarSelectedTab === 'workflows'" class="grid" style="grid-template-rows: auto 1fr;">
            <div class="sidebar-item" @click="addNewWorkflow()">+ Add new workflow</div>
            <div class="pb-4">
                <div class="sidebar-item grid" style="grid-template-columns: 1fr auto auto;" :class="{ active: store.activeWorkflow?.id === workflow.id }" v-for="workflow in store.workflows" @click="store.activeWorkflow = workflow">
                    <div>{{ workflow.name }}</div>
                    <div class="grid">
                        <EditIcon @click.stop="editWorkflow(workflow)" />
                    </div>
                    <div class="grid ml-1">
                        <DeleteIcon @click.stop="deleteWorkflow(workflow)" />
                    </div>
                </div>
            </div>
        </div>
        <div v-if="store.sidebarSelectedTab === 'nodes'" class="p-2">
            <div>You can drag these nodes to the pane</div>

            <div class="nodes">
                <div class="node mt-1 cursor-grab p-1" :draggable="store.activeWorkflow ? true : false" @dragstart="onDragStart($event, nodesType.name as any)" v-for="nodesType in nodesTypes">{{ nodesType.label }}</div>
            </div>
        </div>
        <div v-if="store.sidebarSelectedTab === 'runs'">
            <div class="pb-4">
                <div class="sidebar-item grid" style="grid-template-columns: 1fr auto auto;" :class="{ active: store.activeWorkflowRun?.id === workflowRun.id }" v-for="workflowRun in store.workflowRuns" @click="store.activeWorkflowRun = workflowRun">
                    <div>{{ formatTimestamp(workflowRun.createdAt + 'Z') }}</div>
                    <div class="grid">
                        <DeleteIcon @click.stop="deleteWorkflowRun(workflowRun.id)" />
                    </div>
                </div>
                <div class="p-2" v-if="store.workflowRuns.length === 0">No runs found</div>
            </div>
        </div>
        <div v-if="store.sidebarSelectedTab === 'log'" class="grid" style="grid-template-rows: auto 1fr; min-height: 0;">
            <div class="p-2 pb-1">
                <label class="cursor-pointer">
                    <input type="checkbox" v-model="showDebugLogs" />
                    Show debug logs
                </label>
            </div>
            <div ref="logContainer" style="user-select: text; overflow-y: auto;" @scroll="onLogScroll">
                <div
                    v-for="(log, logIndex) in filteredWorkflowLogs"
                    :key="logIndex"
                    class="log-entry"
                    :class="{ 'log-debug': log.debug, 'log-error': isErrorLog(log) }"
                    :style="log.parallelIndex > 0 ? { borderLeft: `3px solid ${getParallelColor(log.parallelIndex)}`, backgroundColor: `${getParallelColor(log.parallelIndex)}11` } : {}"
                >
                    <div class="log-timestamp">{{ formatTimestamp(log.timestamp!) }}</div>
                    <div v-if="log.nodeType" class="bold cursor-pointer log-node" @click="moveToNode(log.nodeId!)">
                        {{ log.nodeType }}
                        <span v-if="log.parallelIndex > 0" class="log-parallel" :style="{ background: getParallelColor(log.parallelIndex) + '22', color: getParallelColor(log.parallelIndex) }">Parallel {{ log.parallelIndex }}</span>
                    </div>
                    <div v-if="resolvedNodeContextMap[`${log.nodeId}-${log.parallelIndex}`]" class="log-node-context">{{ resolvedNodeContextMap[`${log.nodeId}-${log.parallelIndex}`] }}</div>
                    <div v-if="log.message" class="log-message">{{ log.message }}</div>
                    <textarea v-if="log.data" readonly class="full-width" style="min-height: 7rem; resize: vertical; outline: none;">{{ log.data }}</textarea>
                </div>
                <div v-if="filteredWorkflowLogs.length === 0" style="color: #797979; padding: 0.5rem;">No logs yet</div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import useDragAndDrop from '@/helpers/useDnD'
import { ref, computed, watch, nextTick } from 'vue'
import { constants } from '@/constants'
import { useStore } from '@/store'
import { Workflow } from '@/global';
import { EditIcon, DeleteIcon } from '@/components/Icons'
import dayjs from 'dayjs'
import { useVueFlow } from '@vue-flow/core'
import { workflowRun } from '../../../api/src/schema'

const { onDragStart } = useDragAndDrop()
const store = useStore()

const nodesTypes = ref(constants.NODE_TYPES)
const showDebugLogs = ref(false)
const logContainer = ref<HTMLElement | null>(null)
const userScrolledUp = ref(false)

const filteredWorkflowLogs = computed(() => {
    return store.workflowLogs.filter(log => {
        if (showDebugLogs.value) {
            return true
        }

        return !log.debug
    })
})

function onLogScroll() {
    if (!logContainer.value) return
    const { scrollTop, scrollHeight, clientHeight } = logContainer.value
    userScrolledUp.value = scrollTop + clientHeight < scrollHeight - 10
}

watch(filteredWorkflowLogs, async () => {
    await nextTick()
    if (logContainer.value && !userScrolledUp.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
})

const resolvedNodeContextMap = computed(() => {
    const map: Record<string, string> = {}
    for (const log of store.workflowLogs) {
        if (!log.nodeId || !log.nodeType) continue
        const key = `${log.nodeId}-${log.parallelIndex}`
        if (map[key]) continue
        const ctx = getNodeContext(log.nodeId, log.nodeType, log.data)
        if (ctx) map[key] = ctx
    }
    return map
})

function getNodeContext(nodeId: string | null | undefined, nodeType: string | null | undefined, logData?: any): string {
    if (!nodeId) return ''
    const d = logData?.parsedNodeData ?? logData
    if (!d || typeof d !== 'object' || Array.isArray(d)) return ''
    const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    switch (nodeType) {
        case 'HTTPRequest':
            return (HTTP_METHODS.includes(d.method) && d.url) ? `${d.method} ${d.url}` : ''
        case 'SocketIO':
        case 'WebSocket':
            return d.url && !d.method ? `${d.url}` : ''
        case 'SocketIOListener':
        case 'SocketIOEmitter':
        case 'WebSocketListener':
        case 'WebSocketEmitter':
            return d.eventName ? `${d.eventName}` : ''
        case 'Delay':
            return d.delayInMS != null ? `${d.delayInMS}ms` : ''
        case 'IfCondition':
            return (d.leftOperand != null && d.operator) ? `${d.leftOperand} ${d.operator} ${d.rightOperand}` : ''
        default: return ''
    }
}

function getParallelColor(index: number) {
    const hue = ((index - 1) * 137.5) % 360
    return `hsl(${hue}, 65%, 45%)`
}

function isErrorLog(log: { message: string }) {
    const msg = log.message.toLowerCase()
    return msg.includes('error') || msg.includes('failed') || msg.includes('invalid')
}


async function addNewWorkflow() {
    const prompt = window.prompt('Enter the name of the new workflow')

    if (prompt) {
        await store.createWorkflow({
            name: prompt,
        })
    }
}

async function editWorkflow(workflow: Workflow) {
    const prompt = window.prompt('Enter the new name of the workflow', workflow.name)

    if (prompt) {
        await store.updateWorkflow(workflow.id, {
            name: prompt,
        })

        store.fetchWorkflows()
    }
}

async function deleteWorkflow(workflow: Workflow) {
    if (!window.confirm('Are you sure you want to delete this workflow?')) {
        return
    }

    await store.deleteWorkflow(workflow.id)
}

function formatTimestamp(timestamp: string) {
    return dayjs(timestamp).format('DD-MMM-YY hh:mm:ss:SSS A')
}

function moveToNode(nodeId: string) {
    const vueFlow = useVueFlow({
        id: store.vueFlowRef.id,
    })
    vueFlow.fitView({
        nodes: [nodeId],
        duration: 1000,
        maxZoom: 1.4,
    })
}

async function deleteWorkflowRun(workflowRunId: workflowRun['id']) {
    if (!window.confirm('Are you sure you want to delete this workflow run?')) {
        return
    }

    await store.deleteWorkflowRun(workflowRunId)
}
</script>

<style scoped>
.log-entry {
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid #e0e0e0;
}

.log-debug {
    background-color: #eef0ff;
}

.log-error {
    background-color: #fff0f0;
    border-left: 3px solid #d9534f;
}

.log-timestamp {
    font-size: 0.7rem;
    color: #797979;
}

.log-node {
    font-weight: bold;
}

.log-parallel {
    font-weight: normal;
    font-size: 0.75rem;
    margin-left: 0.3rem;
    border-radius: 3px;
    padding: 0 4px;
}

.log-message {
    margin-top: 0.1rem;
    word-break: break-word;
}

.log-node-context {
    font-weight: normal;
    font-size: 0.8rem;
    color: #444;
    word-break: break-all;
}
</style>
