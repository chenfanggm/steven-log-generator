const cluster = require('cluster')
const os = require('os')
const debug = require('debug')('app:bin:cluster')

const CPUS = os.cpus()
if (cluster.isMaster) {
  for (let i = 0; i < CPUS.length - 1; i++) {
    cluster.fork()
  }

  cluster.on('listening', function (worker) {
    debug('Cluster with pid: %d connected', worker.process.pid)
  })

  cluster.on('disconnect', function (worker) {
    debug('Cluster with pid: %d disconnected', worker.process.pid)
  })

  cluster.on('exit', function (worker, code, signal) {
    debug('Cluster with pid: %d is dead, with code %s, and signal ', worker.process.pid, code, signal)
    cluster.fork()
  })

} else {
  require('./start.js')
}
