'use strict';

const assert = require('assert');
const crypto = require('crypto');
const EventEmitter = require('events');
const packet = require('./packet');
const Parser = require('./parser');

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest();
}

/**
 * "Reverse" comparison so we don't have
 * to waste time reversing the block hash.
 * @ignore
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {Number}
 */
function rcmp(a, b) {
  assert(a.length === b.length);

  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] < b[i])
      return -1;
    if (a[i] > b[i])
      return 1;
  }

  return 0;
}

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

    process.on('uncaughtException', err => {
        let result = new ErrorPacket(err);
        this.write(result.toWriter());
    });

    const ErrorPacket = packet.ErrorPacket;
    const MineResultPacket = packet.MineResultPacket;

    this.parser.on('packet', packet => {
        let result;

        try {
            let nonce = this.mine(packet);
            result = new MineResultPacket(nonce);
        } catch (err) {
            result = new ErrorPacket(err);
        }

        this.write(result.toWriter());
    });

    this.parser.on('error', err => {
        let result = new ErrorPacket(err);
        this.write(result.toWriter());
    });
};

Miner.prototype.write = function write(data) {
  return process.stdout.write(data);
};

Miner.prototype.mine = function mine({ data, target, min, max }) {
    let nonce = min;

    data.writeUInt32LE(nonce, 76, true);

    // The heart and soul of the miner: match the target.
    while (nonce <= max) {
        // Hash and test against the next target.
        if (rcmp(sha256(sha256(data)), target) <= 0)
            return nonce;

        // Increment the nonce to get a different hash.
        nonce++;

        // Update the raw buffer.
        data.writeUInt32LE(nonce, 76, true);
    }

    return -1;
};

Miner.prototype.destroy = function destroy() {
  return process.exit(0);
};

Miner();
