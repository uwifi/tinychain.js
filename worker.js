const crypto = require('crypto');
const BN = require('bn.js');
const tc = require('./tinychain');

const noop = () => {};
const mine = new tc.SocketMessageHandle(data => {
    let { header, bits } = data;

    let nonce = 0;
    let max = 0xffffffff;
    let target = (new BN(0)).bincn(256 - bits);

    while (nonce <= max) {
        header[5] = nonce;
        if (new BN(sha256d(header.join('')), 16).lte(target)) {
            return send_to_parent({ 'nonce': nonce });
        }

        nonce++;
    }

    send_to_parent({ 'nonce': -1 });
});

process.stdin.on('error', noop);
process.stdout.on('error', noop);
process.stderr.on('error', noop);

process.stdin.on('data', (chunk) => {
    mine.read_all_from_socket(chunk);
});

process.on('uncaughtException', (err) => {
    send_to_parent({ 'message': err.message });
});

function send_to_parent(data) {
    process.stdout.write(tc.encode_socket_data(data));
}

function sha256(s, encoding = null) {
    return crypto.createHash('sha256').update(s).digest(encoding);
}

function sha256d(s) {
    if (!(s instanceof Buffer)) {
        s = Buffer.from(s);
    }
    return sha256(sha256(s), 'hex');
}
