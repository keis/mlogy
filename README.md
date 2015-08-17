# mlogy

[![NPM Version][npm-image]](https://npmjs.org/package/mlogy)
[![Build Status][travis-image]](https://travis-ci.org/keis/mlogy)
[![Coverage Status][coveralls-image]](https://coveralls.io/r/keis/mlogy?branch=master)

Interface for creating log records

## Installation

```bash
npm install --save mlogy
```

## Usage

The modules assumes loggers are organized in a tree tracked by the `parent`
attribute however this is managed outside the implementation of the logger.

### Logger(context, name, [level])

* context

    The context contains the shared settings shared between all loggers in a
system. The context is stored as `context` on the logger and is allowed to change
during the life time of the logger to allow loggers created by libraries to be
assimilated into a bigger application logger hierarchy

  * defaultProcessors

    A List of processors; functions that accepts a record and somehow modifies
it by e.g attaching extra data

  * proxy

    A proxy through which all records should be sent.

* name

    The name of the logger. By convention a dot.separated.string

* level

    The minimum level the logger will process records for as either a numeric
value or a named level from `standard-levels`. If undefined the level of the
parent logger is used.

```javascript
var Logger = require('mlogy')
  , ctx = {defaultProcessors: []}
  , root = new Logger(ctx, '', 'ERROR')
  , other = new Logger(ctx, 'other', 'DEBUG')

other.parent = root
```

### setLevel

Update the minimum level the logger will process records for

### trace(frmt, ...)
### debug(frmt, ...)
### info(frmt, ...)
### warn(frmt, ...)
### error(frmt, ...)
### critical(frmt, ...)

Send a message at the indicated level


[npm-image]: https://img.shields.io/npm/v/mlogy.svg?style=flat
[travis-image]: https://img.shields.io/travis/keis/mlogy.svg?style=flat
[coveralls-image]: https://img.shields.io/coveralls/keis/mlogy.svg?style=flat
