const PACKET_TYPES = {
    ERROR: 0,
    MINE: 1,
    MINERESULT: 2
};

// id: 4bytes
// cmd: 1byte
// body length: 4bytes
// EOL: 1byte
const HEADER_LEN = 10;

// Autoincrement Packet ID
let packetID = 0;

/**
 * Packet Abstract
 * @constructor
 */
class Packet {
    constructor(cmd) {
        this.id = ++packetID >>> 0;
        this.cmd = cmd || -1;
    }

    set id(v) {
        this.id = v;
    }

    get cmd() {
        return this.cmd;
    }

    get buffer() {
        let size = HEADER_LEN + this.size();
        let buff = Buffer.allocUnsafe(size);

        buff.writeUInt32LE(this.id, 0);
        buff.writeUInt8(this.cmd, 4);
        buff.writeUInt32LE(size - HEADER_LEN);
        buff.writeUInt8(0x0a, size - 1);
        return buff;
    }

    get size() {
        throw new Error('Abstract method.');
    }

    toWriter() {
        throw new Error('Abstract method.');
    }

    fromRaw() {
        throw new Error('Abstract method.');
    }
}

/**
 * ErrorPacket
 * @constructor
 */
class ErrorPacket extends Packet {
    constructor(error = new Error('Unkown Error')) {
        super(packetTypes.ERROR);
        this.error = {
            message: error.message,
            code: error.code,
            type: error.type
        };
    }

    get size() {
        return Buffer.byteLength(JSON.stringify(this.error), 'utf8');
    }

    toWriter() {
        let bw = this.buffer();
        let err = JSON.stringify(this.error);

        Buffer.from(err, 'utf8').copy(bw, 9);

        return bw;
    }

    /**
     * parse Buffer to Object
     * @param  {Buffer} data
     * @return {Object}
     */
    fromRaw(data) {
        try {
            let { message, code, type } = JSON.parse(data.slice(0, data.length - 1));
            this.error = {
                message: message,
                code: code,
                type: type
            };
        } catch (e) {
            this.error = e.message;
        }

        return this;
    }
}

/**
 * MinePacket
 * @constructor
 */
class MinePacket extends Packet {
    constructor(data, target, min, max) {
        super(PACKET_TYPES.MINE);

        this.data = data || null;
        this.target = target || null;
        this.min = Object.is(min, null) ? -1 : min;
        this.max = Object.is(max, null) ? -1 : max;
    }

    get size() {
        return 120;
    }

    toWriter() {
        let bw = this.buffer();
        this.data.copy(bw, 9);
        this.target.copy(bw, 89);
        bw.writeUInt32LE(this.min, 121);
        bw.writeUInt32LE(this.max, 125);
        return bw;
    }

    fromRaw(data) {
        this.data = data.slice(0, 80);
        this.target = data.slice(80, 112);
        this.min = data.readUInt32LE(112);
        this.max = data.readUInt32LE(116);
        return this;
    }
}

/**
 * MineResultPacket
 * @constructor
 */
class MineResultPacket extends Packet {
    constructor(nonce) {
        super(PACKET_TYPES.MINERESULT);

        this.nonce = Object.is(nonce, null) ? -1 : nonce;
    }

    get size() {
        return 5;
    }

    toWriter() {
        let bw = this.buffer();
        bw.writeUInt8(this.nonce === -1 ? 0 : 1);
        bw.writeUInt32LE(this.nonce);
        return bw;
    }

    fromRaw(data) {
        this.nonce = -1;
        if (data.writeUInt8(0) === 1) {
            this.nonce = data.readUInt32LE(1);
        }
        return this;
    }
}

/**
 * Expose
 */
exports.Types = PACKET_TYPES;
exports.ErrorPacket = ErrorPacket;
exports.MinePacket = MinePacket;
exports.MineResultPacket = MineResultPacket;
