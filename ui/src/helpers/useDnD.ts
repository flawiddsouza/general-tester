import { useVueFlow } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { Node, HTTPRequestNodeData, SocketIOListenerNodeData, SocketIONodeData } from '@/global'

const state = {
    /**
     * The type of the node being dragged.
     */
    draggedType: ref<string|null>(null),
    isDragOver: ref<boolean>(false),
    isDragging: ref<boolean>(false),
}

function createEmptyNodeData(type: string) {
    if(type === 'Start') {
        return {}
    }

    if(type === 'End') {
        return {}
    }

    if(type === 'HTTPRequest') {
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
            output: '$response'
        }

        return data
    }

    if(type === 'SocketIO') {
        const data: SocketIONodeData = {
            url: '',
            path: '/socket.io',
        }

        return data
    }

    if(type === 'SocketIOListener') {
        const data: SocketIOListenerNodeData = {
            eventName: '',
        }

        return data
    }
}

export default function useDragAndDrop() {
    const { draggedType, isDragOver, isDragging } = state

    const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow()

    watch(isDragging, (dragging) => {
        document.body.style.userSelect = dragging ? 'none' : ''
    })

    function onDragStart(event: DragEvent, type: string) {
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

        const nodeId = nanoid()

        const newNode: Node = {
            id: nodeId,
            type: draggedType.value,
            position,
            data: createEmptyNodeData(draggedType.value as string),
        }

        /**
         * Align node position after drop, so it's centered to the mouse
         *
         * We can hook into events even in a callback, and we can remove the event listener after it's been called.
         */
        const { off } = onNodesInitialized(() => {
            updateNode(nodeId, (node) => ({
                position: { x: node.position.x - node.dimensions.width / 2, y: node.position.y - node.dimensions.height / 2 },
            }))

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
