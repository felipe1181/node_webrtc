/*
import plugins related to middleware, routes and auth
*/
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')

const corsOptions = require('./middlewares/cors')
const routesAuth = require('./routes/auth')
const routesSystem = require('./routes')
const Core = require('./config/core')

// import settings env
class AppController {
  constructor () {
    // load express
    this.express = express()
    this.app = require('http').createServer(express)

    this.socketIo()
    this.middlewares()
    this.routes()
    this.errorManagement()
  }

  // configure middlewares
  middlewares () {
    this.express.use(cors(corsOptions))
    this.express.use(morgan('combined', { stream: Core.stream }))
    this.express.use(helmet())
    this.express.use(express.json())
    this.express.use('/api', routesAuth)
  }

  // import routes to router main
  routes () {
    this.express.use('/api', routesSystem)
  }

  // configure socketio
  socketIo () {
    const io = require('socket.io')(this.app)

    io.on('connection', (socket) => {
      console.log('Novo cliente conectou:', socket.client.id)
      socket.emit('connection', 'online')

      socket.on('clienteResponse', (data) => {
        io.sockets.emit('broadcast', data)
      })
    })
  }

  // configure errors
  errorManagement () {
    this.express.use(Core.notFoundHandler)
    this.express.use(Core.errorMiddleware)

    process.on('unhandledRejection', reason => {
      Core.logger.info('Unhandled rejection, throwing')
      throw reason
    })

    process.on('uncaughtException', error => {
      Core.logger.info('Unhandled exception, handling')

      Core.errorHandler.handleError(error)
      if (!Core.errorHandler.isTrustedError(error)) {
        process.exit(1)
      }
    })
  }
}

module.exports = new AppController().app
