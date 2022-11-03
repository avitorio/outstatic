interface Options {
  type: 'server' | 'browser'
}

type startFn = () => void
type stopFn = () => void

export const mockRequests = (options?: Options): [startFn, stopFn] => {
  if (options?.type === 'server') {
    const { server } = require('./msw/server')
    return [
      function start() {
        server.listen()
      },
      function stop() {
        server.close()
      }
    ]
  }

  const { worker } = require('./msw/browser')
  return [
    function start() {
      worker.start()
    },
    function stop() {
      worker.stop()
    }
  ]
}
