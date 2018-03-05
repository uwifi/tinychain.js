'use strict';

const assert = require('assert');
const EventEmitter = require('events');

/*
 * Expose
 */

module.exports = Parser;

function Header(size) {
    this.size = size;
}

function Parser() {
    if (!(this instanceof Parser))
        return new Parser();

    EventEmitter.call(this);

    this.waiting = 4;
    this.header = null;
    this.pending = [];
    this.total = 0;
}

Object.setPrototypeOf(Parser.prototype, EventEmitter.prototype);

Parser.prototype.feed = function feed(data) {
    this.total += data.length;
    this.pending.push(data);

    while (this.total >= this.waiting) {
        const chunk = this.read(this.waiting);
        this.parse(chunk);
    }
};

Parser.prototype.read = function read(size) {
    assert(this.total >= size, 'Reading too much.');

    if (size === 0)
        return Buffer.alloc(0);

    const pending = this.pending[0];

    if (pending.length > size) {
        const chunk = pending.slice(0, size);
        this.pending[0] = pending.slice(size);
        this.total -= chunk.length;
        return chunk;
    }

    if (pending.length === size) {
        const chunk = this.pending.shift();
        this.total -= chunk.length;
        return chunk;
    }

    const chunk = Buffer.allocUnsafe(size);
    let off = 0;

    while (off < chunk.length) {
        const pending = this.pending[0];
        const len = pending.copy(chunk, off);

        if (len === pending.length)
            this.pending.shift();
        else
            this.pending[0] = pending.slice(len);

        off += len;
    }

    assert.strictEqual(off, chunk.length);

    this.total -= chunk.length;

    return chunk;
};

Parser.prototype.parse = function parse(data) {
    let header = this.header;

    if (!header) {
        try {
            header = this.parseHeader(data);
        } catch (e) {
            this.emit('error', e);
            return;
        }

        this.header = header;
        this.waiting = header.size + 1;

        return;
    }

    this.waiting = 4;
    this.header = null;

    let packet;
    try {
        packet = this.parsePacket(header, data);
    } catch (e) {
        this.emit('error', e);
        return;
    }

    if (data[data.length - 1] !== 0x0a) {
        this.emit('error', new Error('No trailing newline.'));
        return;
    }

    // packet.id = header.id;

    try {
        this.emit('packet', packet);
    } catch (err) {
        console.log(err);
    }
};

Parser.prototype.parseHeader = function parseHeader(data) {
    const size = data.readUInt32LE(0, true);
    return new Header(size);
};

Parser.prototype.parsePacket = function parsePacket(header, data) {
    // return JSON.parse(data);
    return data;
};
