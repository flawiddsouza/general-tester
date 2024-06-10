import { useVueFlow } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { Node, HTTPRequestNodeData, SocketIOListenerNodeData, SocketIONodeData, SocketIOEmitterNodeData, IfConditionNodeData, WebSocketNodeData, WebSocketListenerNodeData, WebSocketEmitterNodeData } from '@/global'
import { StoreType } from '@/store'

const state = {
    /**
     * The type of the node being dragged.
     */
    draggedType: ref<Node['type']|null>(null),
    isDragOver: ref<boolean>(false),
    isDragging: ref<boolean>(false),
}

function createEmptyNodeData(type: Node['type']) {
    if (type === 'Start') {
        return {}
    }

    if (type === 'End') {
        return {}
    }

    if (type === 'HTTPRequest') {
        const data: HTTPRequestNodeData = {
            method: 'GET',
            url: '',
            queryParams: [],
            headers: [],
            body: {
                mimeType: null,
                params: [],
                text: ''
            },
        }

        return data
    }

    if (type === 'SocketIO') {
        const data: SocketIONodeData = {
            version: 4,
            url: '',
            path: '/socket.io',
        }

        return data
    }

    if (type === 'SocketIOListener') {
        const data: SocketIOListenerNodeData = {
            eventName: '',
        }

        return data
    }

    if (type === 'SocketIOEmitter') {
        const data: SocketIOEmitterNodeData = {
            eventName: '',
            eventBody: '',
        }

        return data
    }

    if (type === 'WebSocket') {
        const data: WebSocketNodeData = {
            url: '',
        }

        return data
    }

    if (type === 'WebSocketListener') {
        const data: WebSocketListenerNodeData = {
            eventName: 'open',
        }

        return data
    }

    if (type === 'WebSocketEmitter') {
        const data: WebSocketEmitterNodeData = {
            eventBody: '',
        }

        return data
    }

    if (type === 'IfCondition') {
        const data: IfConditionNodeData = {
            leftOperand: '',
            operator: '==',
            rightOperand: '',
        }

        return data
    }
}

export default function useDragAndDrop(store?: StoreType) {
    const { draggedType, isDragOver, isDragging } = state

    const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow()

    watch(isDragging, (dragging) => {
        document.body.style.userSelect = dragging ? 'none' : ''
    })

    function onDragStart(event: DragEvent, type: Node['type']) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/vueflow', type)
            event.dataTransfer.effectAllowed = 'move'
        }

        draggedType.value = type
        isDragging.value = true

        document.addEventListener('drop', onDragEnd)
    }

    /**
     * Handles the drag over event.
     *
     * @param {DragEvent} event
     */
    function onDragOver(event: DragEvent) {
        event.preventDefault()

        if (draggedType.value) {
            isDragOver.value = true

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move'
            }
        }
    }

    function onDragLeave() {
        isDragOver.value = false
    }

    function onDragEnd() {
        isDragging.value = false
        isDragOver.value = false
        draggedType.value = null
        document.removeEventListener('drop', onDragEnd)
    }

    /**
     * Handles the drop event.
     *
     * @param {DragEvent} event
     */
    function onDrop(event: DragEvent) {
        const position = screenToFlowCoordinate({
            x: event.clientX,
            y: event.clientY,
        })

        if (!draggedType.value) {
            throw new Error('No dragged type')
        }

        if (!store) {
            throw new Error('No store provided')
        }

        const nodeId = nanoid()

        const newNode: Node = {
            id: nodeId,
            workflowId: store.activeWorkflow?.id,
            type: draggedType.value,
            position,
            data: createEmptyNodeData(draggedType.value),
        } as Node

        /**
         * Align node position after drop, so it's centered to the mouse
         *
         * We can hook into events even in a callback, and we can remove the event listener after it's been called.
         */
        const { off } = onNodesInitialized(() => {
            updateNode(nodeId, (node) => {
                newNode.position = { x: node.position.x - node.dimensions.width / 2, y: node.position.y - node.dimensions.height / 2 }
                store.addNode(newNode)
                return {
                    position: newNode.position,
                }
            })

            off()
        })

        addNodes(newNode as any)
    }

    return {
        draggedType,
        isDragOver,
        isDragging,
        onDragStart,
        onDragLeave,
        onDragOver,
        onDrop,
    }
}
