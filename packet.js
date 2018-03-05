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

    get id() {
        return this.id;
    }

    get cmd() {
        return this.cmd;
    }

    get buffer() {
        let size = HEADER_LEN + this.getSize();
        let buff = Buffer.allocUnsafe(size);

        buff.writeUInt32LE(this.id, 0);
        buff.writeUInt8(this.cmd, 4);
        buff.writeUInt32LE(size - HEADER_LEN);
        buff.writeUInt8(0x0a, size - 1);
        return buff;
    }

    getSize() {
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

    getSize() {
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

    getSize() {
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

exports.Types = PACKET_TYPES;
exports.MinePacket = MinePacket;
exports.MineResultPacket = MineResultPacket;
