'use strict';

const path = require('path');
const cp = require('child_process');
const EventEmitter = require('events');
const packet = require('./packet');
const Parser = require('./parser');

class Child extends EventEmitter {
    constructor(file = "miner.js") {
        super();

        const bin = process.argv[0];
        const filename = path.resolve(__dirname, file);
        const options = { stdio: 'pipe', env: process.env };

        this.child = cp.spawn(bin, [ filename ], options);

        this.child.unref();
        this.child.stdin.unref();
        this.child.stdout.unref();
        this.child.stderr.unref();

        this.child.on('error', (err) => {
            this.emit('error', err);
        });

        this.child.once('exit', (code, signal) => {
            this.emit('exit', code == null ? -1 : code, signal);
        });

        this.child.stdin.on('error', (err) => {
            this.emit('error', err);
        });

        this.child.stdout.on('error', (err) => {
            this.emit('error', err);
        });

        this.child.stderr.on('error', (err) => {
            this.emit('error', err);
        });

        this.child.stdout.on('data', (data) => {
            this.emit('data', data);
        });

        this.parser = new Parser();

        this.listen();
    }

    listen() {
        listenExit(() => {
            this.destroy();
        });

        this.on('data', (data) => {
            this.parser.feed(data);
        });

        this.on('packet', packet => {
            this.resolve && this.resolve(packet);
        });

        this.on('exit', (code, signal) => {
            this.emit('exit', code, signal);
        });

        this.on('error', (err) => {
            this.reject && this.reject(err);
        });

        this.parser.on('error', (err) => {
            this.emit('error', err);
        });

        this.parser.on('packet', (packet) => {
            this.emit('packet', packet);
        });
    }

    mine(data) {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.child.write(data);
        });
    }

    write(data) {
        this.child.stdout.write(data);
    }

    destroy() {
        this.child.kill('SIGTERM');
    }
}

/**
 * Listen for exit.
 * @param {Function} handler
 * @private
 */
function listenExit(handler) {
    const onSighup = () => {
        process.exit(1 | 0x80);
    };

    const onSigint = () => {
        process.exit(2 | 0x80);
    };

    const onSigterm = () => {
        process.exit(15 | 0x80);
    };

    const onError = (err) => {
        if (err && err.stack)
            console.error(String(err.stack));
        else
            console.error(String(err));

        process.exit(1);
    };

    process.once('exit', handler);

    if (process.listenerCount('SIGHUP') === 0)
        process.once('SIGHUP', onSighup);

    if (process.listenerCount('SIGINT') === 0)
        process.once('SIGINT', onSigint);

    if (process.listenerCount('SIGTERM') === 0)
        process.once('SIGTERM', onSigterm);

    if (process.listenerCount('uncaughtException') === 0)
        process.once('uncaughtException', onError);

    process.on('newListener', (name) => {
        switch (name) {
            case 'SIGHUP':
                process.removeListener(name, onSighup);
                break;
            case 'SIGINT':
                process.removeListener(name, onSigint);
                break;
            case 'SIGTERM':
                process.removeListener(name, onSigterm);
                break;
            case 'uncaughtException':
                process.removeListener(name, onError);
                break;
        }
    });
}

/**
 * Expose
 */
module.exports = Child;
