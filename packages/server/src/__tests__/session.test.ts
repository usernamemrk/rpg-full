import { createApp } from '../app'
import { io as Client } from 'socket.io-client'
import { stopPersistInterval } from '../socket/sessionHandlers'

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

describe('socket session:join', () => {
  let httpServer: any, port: number

  beforeAll(done => {
    const { httpServer: srv } = createApp()
    httpServer = srv.listen(0, () => {
      port = (httpServer.address() as any).port
      done()
    })
  })

  afterAll(done => {
    stopPersistInterval()
    httpServer.close(done)
  })

  it('emits session:error for invalid session code', done => {
    const client = Client(`http://localhost:${port}`)
    client.on('connect', () => {
      client.emit('session:join', { sessionCode: 'INVALID', characterId: 'char1' })
    })
    client.on('session:error', (data: any) => {
      expect(data.code).toBe('SESSION_NOT_FOUND')
      client.disconnect()
      done()
    })
  })
})
