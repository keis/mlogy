var terminus = require('terminus')
  , assign = require('object-assign')
  , lvl = require('standard-levels')
  , Sink = require('record-sink')
  , Record = require('log-record')
  , logLevels = lvl.levels

module.exports = Logger

// Constructor for logger instance with global settings pulled from `context`.
// Each logger may have a parent logger that defines it to be part of a
// hierarchy. This hierarchy is walked by the logger when processing records
// but structure needs to be managed outside.
function Logger(context, name, level) {
  this.context = context
  this.parent = null
  this.name = name
  this.sinks = []
  this.processors = []
  this.propagate = true
  this.setLevel(level)
}

// It's possible to change the level of a logger by either numeric level or its
// symbolic name.
Logger.prototype.setLevel = lvl.setLevel

// The effective level of a logger is found by walking up the hierarchy until a
// instance with a level defined is found.
Logger.prototype.getEffectiveLevel = function () {
  var logger = this

  do {
    if (logger.level) {
      return logger.level
    }
  } while ((logger = logger.parent))

  return 0
}

// Check if records of the given level should be processed by this logger
Logger.prototype.isEnabledFor = function (level) {
  return level >= this.getEffectiveLevel()
}

// Used internally to create new log records and could be patched from the
// outside to provide extra data on the record instance.
Logger.prototype.createRecord = function (level, msg, args) {
  var timestamp = new Date()
    , record = new Record(this.name, level, timestamp, msg, args)

  if (this.context.defaultProcessors) {
    this.context.defaultProcessors.forEach(function (processor) {
      processor.call(this, record)
    })
  }

  if (this.processors) {
    this.processors.forEach(function (processor) {
      processor.call(this, record)
    })
  }

  return record
}

// A special case of log record creating for records being imported from
// another system that need to have all the details intact.
Logger.prototype.importRecord = function (record) {
  var data = assign({}, record)
  data.timestamp = new Date(record.timestamp)

  return new Record(data)
}

// Dispatch a record through all the sinks attached to a logger. This will be
// called for all parent loggers in the hierarchy when a record is accepted
// downstream.
Logger.prototype.callSinks = function (record) {
  var sink
    , length
    , i

  for (i = 0, length = this.sinks.length; i < length; i++) {
    sink = this.sinks[i]
    if (record.level >= (sink.level || 0)) {
      sink.write(record)
    }
  }
}

// Dispatch a record to this logger and all of its parents
Logger.prototype.dispatch = function (record) {
  var logger = this
  do {
    logger.callSinks(record)
  } while (logger.propagate && (logger = logger.parent))
}

// Create a log record from all arguments and process it
Logger.prototype.log = function () {
  var args = Array.prototype.slice.call(arguments)
    , level = args.shift()
    , msg = args.shift()
    , record

  if (isNaN(level)) {
    level = logLevels[level]
  }

  // Log level is only checked at the called logger and whatever is
  // configured in the parent is ignored
  if (!this.isEnabledFor(level)) {
    return
  }

  record = this.createRecord(level, msg, args)

  // Send record over proxy if one is configured. Any local sinks will still
  // be processed.
  if (this.context.proxy) {
    this.context.proxy.sendRecord(record)
  }

  this.dispatch(record)

}

// Add a log record sink to the logger. It's possible to call this with a plain
// function and it will be wrapped instance with the default formatter and the
// given function as the write function.
Logger.prototype.addSink = function (sink) {
  if (!(sink instanceof Sink)) {
    sink = new Sink(terminus(sink))
  }
  this.sinks.push(sink)
}

// Add a record processor to the logger that will be called with each new
// record before being dispatched to the sinks.
Logger.prototype.addProcessor = function (proc) {
  this.processors.push(proc)
}

// Create wrapper functions for all defined log levels
Object.keys(logLevels).forEach(function (name) {
  var level = logLevels[name]

  Logger.prototype[name.toLowerCase()] = function () {
    var args = Array.prototype.slice.call(arguments)

    args.unshift(level)

    this.log.apply(this, args)
  }
})
