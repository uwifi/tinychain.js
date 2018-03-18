const net = require('net');
const path = require('path');
const yargs = require('yargs');
const rsasign = require('jsrsasign');
const tc = require('./tinychain');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const logger = createLogger({
    'level': process.env['TC_LOG_LEVEL'] || 'debug',
    'format': combine(
        label({
            label: 'client'
        }),
        format.splat(),
        format.simple(),
        timestamp(),
        printf(info => {
          return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
        })
    ),
    'transports': [
        new transports.Console()
    ]
});

const argv = yargs.options({
    'w': {
        'alias': 'wallet',
        'default': 'wallet.dat',
        'describe': 'Choose your wallet',
        'type': 'string'
    },
    'b': {
        'alias': 'balance',
        'describe': 'Get balance',
        'boolean': true
    },
    's': {
        'alias': 'send',
        'describe': 'Send to an address',
        'type': 'string',
    },
    'v': {
        'alias': 'value',
        'describe': 'Send value to an adress',
        'type': 'number'
    },
    'f': {
        'alias': 'fee',
        'describe': 'Send fee',
        'default': 5000,
        'type': 'number'
    },
    't': {
        'alias': 'txid',
        'describe': 'Get the `Transaction` status',
        'type': 'string'
    },
    'p': {
        'alias': 'port',
        'default': 9999,
        'describe': 'Set peer port',
        'type': 'number'
    },
    'n': {
        'alias': 'node',
        'default': 'localhost',
        'describe': 'Set peer node',
        'type': 'string'
    }
}).help().argv;

// Wallet
const [ signing_key, verifying_key, my_address ] = tc.init_wallet(argv.wallet);

function send_message(data) {
    return new Promise((resolve, reject) => {
        let sock = net.createConnection(argv.port, argv.node, () => {
            sock.write(tc.encode_socket_data(data));
        });

        const message = new tc.SocketMessageHandle(data => {
            resolve(data);
        });

        sock.on('data', (chunk) => {
            message.read_all_from_socket(chunk);
        });

        sock.on('end', () => {
            resolve();
        });

        sock.on('error', (err) => {
            reject(err);
        });
    });
}

function get_balance(address) {
    address = address || my_address;
    return send_message(new tc.GetUTXOsMsg).then(utxos => {
        return utxos.map(utxo => {
            return utxo[1];
        }).filter(utxo => {
            return utxo.to_address === address;
        });
    });
}

function make_txin(outpoint, txouts) {
    let sequence = 0;
    let spend_msg = tc.build_spend_message(outpoint, verifying_key, sequence, txouts);

    let sign = new rsasign.Signature({ "alg": 'SHA256withECDSA' });
    sign.init({ d: signing_key, curve: 'secp256k1' });
    sign.updateString(spend_msg);

    return new tc.TxIn({
        to_spend: outpoint,
        unlock_pk: verifying_key,
        unlock_sig: sign.sign(),
        sequence: 0
    });
}

/**
 * Get the balance of a given address.
 */
if (argv.balance) {
    (async function () {
        try {
            let coins = await get_balance(argv._[0]);
            let value = coins.reduce((sum, utxo) => {
                return sum + utxo.value;
            }, 0);

            logger.info('[Balance: %s] %d ⛼', my_address, value / tc.Params.BELUSHIS_PER_COIN);

        } catch (err) {
            logger.error('[Get balance]: %o', err);
        }
    })();
}

/**
 * Send value to some address.
 */
if (argv.send) {
    (async function () {
        try {
            let utxos = await get_balance();
            let to_address = argv.send;
            let value = argv.value;
            let fee = argv.fee;
            let sum = 0;
            let selected = [];

            for (let utxo of utxos) {
                selected.push(utxo);
                sum = selected.reduce((s, u) => s + u.value, 0);

                if ( sum >= (value + fee)) {
                    break;
                }
            }

            let txins = [];
            let txouts = [
                new tc.TxOut({
                    value: value,
                    to_address: to_address
                })
            ];

            let change = sum - value - fee;
            if (change > 0) {
                txouts.push(
                    new tc.TxOut({
                        value: change,
                        to_address: my_address
                    })
                );
            }

            for (let utxo of selected) {
                txins.push(make_txin(utxo.outpoint, txouts));
            }

            await send_message(new tc.Transaction({
                txins: txins,
                txouts: txouts
            }));

            logger.info('[Send value] %d from %s to %s', value, my_address, to_address);

        } catch (err) {
            logger.error('[Send value]: %o', err);
        }
    })();
}

/**
 * Get the status of a transaction.
 */
if (argv.txid) {
    (async function () {
        try {
            let txid = argv.txid;
            let mempool = await send_message(new tc.GetMempoolMsg);
            if (mempool.find(t => t === txid)) {
                logger.info('[Get transaction]: `%s` in mempool', txid);
                return;
            }

            let chain =  await send_message(new tc.GetActiveChainMsg);
            for (let [ tx, block, height ] of tc.txn_iterator(chain)) {
                if (tx.id === txid) {
                    logger.info('[Get transaction]: mined, block.id: %s, height: %d', block.id, height);
                    return;
                }
            }

            logger.info('[Get transaction]: `%s` Not found', txid);

        } catch (err) {
            logger.error('[Get transaction]: %o', err);
        }
    })();
}














