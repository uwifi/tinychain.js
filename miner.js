'use strict';

const assert = require('assert');
const EventEmitter = require('events');
const Parser = require('./parser');

function Miner() {
  if (!(this instanceof Miner))
    return new Miner();

  EventEmitter.call(this);

  this.parser = new Parser();
  this.init();
}

Object.setPrototypeOf(Miner.prototype, EventEmitter.prototype);

Miner.prototype.init = function init() {
    process.stdin.on('data', (data) => {
        this.parser.feed(data);
    });

    process.stdin.on('error', () => {});
    process.stdout.on('error', () => {});
    process.stderr.on('error', () => {});

    process.on('uncaughtException', (err) => {
        this.write(err);
    });
};

Miner.prototype.write = function write(data) {
  return process.stdout.write(JSON.stringify(data) + '\n');
};

Miner.prototype.listen = function listen() {
    this.parser.on('packet', (packet) => {
        this.write('data: packet');
        this.mine(packet);
    });

    this.parser.on('error', err => {
        this.write(err);
    })
};

Miner.prototype.mine = async function mine(packet) {
    for (;;) {
        await new Promise((resolve, reject) => {
            setImmediate(() => {
                let start = Date.now();
                while ((Date.now() - start) < 15000) {
                    // console.log(Date.now() - start)
                }
                resolve();
            });
        });
    }
};

/**
 * Destroy the parent process.
 */

Miner.prototype.destroy = function destroy() {
  return process.exit(0);
};

const miner = new Miner();
miner.listen();
