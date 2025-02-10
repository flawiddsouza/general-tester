import ws from 'ws'

const wss = new ws.Server({ port: 8555 })

wss.on('connection', ws => {
    console.log('Client connected')

    ws.on('message', message => {
        ws.send(message.toString())
    })
})

wss.on('close', () => {
    console.log('Client disconnected')
})

console.log('Server started on port 8555')
