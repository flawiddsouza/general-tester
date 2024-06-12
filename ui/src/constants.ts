export const constants = {
    MIME_TYPE: {
        FORM_URL_ENCODED: 'application/x-www-form-urlencoded',
        JSON: 'application/json'
    },
    NODE_TYPES: [
        {
            name: 'Start',
            label: 'Start'
        },
        {
            name: 'End',
            label: 'End'
        },
        {
            name: 'HTTPRequest',
            label: 'HTTP Request'
        },
        {
            name: 'SocketIO',
            label: 'Socket.IO'
        },
        {
            name: 'SocketIOListener',
            label: 'Socket.IO Listener'
        },
        {
            name: 'SocketIOEmitter',
            label: 'Socket.IO Emitter'
        },
        {
            name: 'WebSocket',
            label: 'WebSocket'
        },
        {
            name: 'WebSocketListener',
            label: 'WebSocket Listener'
        },
        {
            name: 'WebSocketEmitter',
            label: 'WebSocket Emitter'
        },
        {
            name: 'IfCondition',
            label: 'If Condition'
        },
    ],
    STATUS: {
        RUNNING: 1,
        COMPLETED: 2,
        FAILED: 3,
        CANCELLED: 4,
    },
}
