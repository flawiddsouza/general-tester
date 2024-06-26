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
        <div v-if="store.sidebarSelectedTab === 'log'" class="p-2 grid" style="grid-template-rows: auto 1fr;">
            <div class="mb-1">
                <label class="cursor-pointer">
                    <input type="checkbox" v-model="showDebugLogs" />
                    Show debug logs
                </label>
            </div>
            <div style="user-select: text;">
                <div v-for="(log, logIndex) in filteredWorkflowLogs" :class="{ 'mt-1': logIndex > 0 }" :style="{ 'backgroundColor': log.debug ? '#c8cfff' : '', padding: log.debug ? '0.5rem' : '' }">
                    <div style="font-size: 0.7rem; color: #797979;">{{ formatTimestamp(log.timestamp!) }}</div>
                    <div v-if="log.nodeType" class="bold cursor-pointer" @click="moveToNode(log.nodeId!)">
                        {{ log.nodeType }}
                        <template v-if="log.parallelIndex > 0">
                            - {{ log.parallelIndex }}
                        </template>
                    </div>
                    <div>{{ log.message }}</div>
                    <template v-if="log.data">
                        <textarea readonly class="full-width" style="min-height: 7rem; resize: vertical; outline: none;">{{ log.data }}</textarea>
                    </template>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import useDragAndDrop from '@/helpers/useDnD'
import { ref, computed } from 'vue'
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

const filteredWorkflowLogs = computed(() => {
    return store.workflowLogs.filter(log => {
        if (showDebugLogs.value) {
            return true
        }

        return !log.debug
    })
})

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
