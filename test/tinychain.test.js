'use strict';

const assert = require('assert');
const tc = require('../tinychain');
const None = null;

let chain1 = [
    // Block id: 000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561
    new tc.Block({version:0, prev_block_hash:'None', merkle_hash:'7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22', timestamp:1501821412, bits:24, nonce:10126761, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes(0), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF'})], locktime:None})]}),

    // Block id: 00000095f785bc8fbd6007b36c2f1c414d66db930e2e7354076c035c8f92700b
    new tc.Block({version:0, prev_block_hash:'000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561', merkle_hash:'27661bd9b23552832becf6c18cb6035a3d77b4e66b5520505221a93922eb82f2', timestamp:1501826444, bits:24, nonce:22488415, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('1'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000f9b679482f24902297fc59c745e759436ac95e93d2c1eff4d5dbd39e33
    new tc.Block({version:0, prev_block_hash:'00000095f785bc8fbd6007b36c2f1c414d66db930e2e7354076c035c8f92700b', merkle_hash:'031f45ad7b5ddf198f7dfa88f53c0262fb14c850c5c1faf506258b9dcad32aef', timestamp:1501826556, bits:24, nonce:30715680, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('2'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]})
];

let chain2 = [
    // Block id: 000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561
    new tc.Block({version:0, prev_block_hash:'None', merkle_hash:'7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22', timestamp:1501821412, bits:24, nonce:10126761, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('0'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF'})], locktime:None})]}),

    // Block id: 000000e4785f0f384d13e24caaddcf6723ee008d6a179428ce9246e1b32e3b2c
    new tc.Block({version:0, prev_block_hash:'000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561', merkle_hash:'27661bd9b23552832becf6c18cb6035a3d77b4e66b5520505221a93922eb82f2', timestamp:1501826757, bits:24, nonce:25773772, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('1'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c
    new tc.Block({version:0, prev_block_hash:'000000e4785f0f384d13e24caaddcf6723ee008d6a179428ce9246e1b32e3b2c', merkle_hash:'031f45ad7b5ddf198f7dfa88f53c0262fb14c850c5c1faf506258b9dcad32aef', timestamp:1501826872, bits:24, nonce:16925076, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('2'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000ef44dd5a56c89a43b9cff28e51e5fd91624be3a2de722d864ae4f6a853
    new tc.Block({version:0, prev_block_hash:'000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c', merkle_hash:'dbf593cf959b3a03ea97bbeb7a44ee3f4841b338d5ceaa5705b637c853c956ef', timestamp:1501826949, bits:24, nonce:12052237, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('3'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id:
    new tc.Block({version:0, prev_block_hash:'000000ef44dd5a56c89a43b9cff28e51e5fd91624be3a2de722d864ae4f6a853', merkle_hash:'a3a55fe5e9f9e5e3282333ac4d149fd186f157a3c1d2b2e04af78c20a519f6b9', timestamp:1501827000, bits:24, nonce:752898, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('4'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]})
];

let chain3_faulty = chain2.concat([]);
chain3_faulty[3] = new tc.Block({version:0, prev_block_hash:'000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c', merkle_hash:'dbf593cf959b3a03ea97bbeb7a44ee3f4841b338d5ceaa5705b637c853c956ef', timestamp:1501826949, bits:24, nonce:1, txns:[new tc.Transaction({txins:[new tc.TxIn({to_spend:None, unlock_sig:tc.bytes('3'), unlock_pk:None, sequence:0})], txouts:[new tc.TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]});

describe('pubkey to address', () => {
    it('should ok', () => {
        assert(tc.pubkey_to_address([
            'k\xd4\xd8M3\xc8\xf7h*\xd2\x16O\xe39a\xc9]\x18i\x08\xf1\xac\xb8',
            '\x0f\x9af\xdd\xd1\'\xe2\xc2v\x8eCo\xd3\xc4\xff\x0e\xfc\x9eBzS\\=',
            '\x7f\x7f\x1a}\xeen"\x9f\x9c\x17E\xeaMH\x88\xec\xf5F'
            ].join('')) === '18kZswtcPRKCcf9GQsJLNFEMUE8V9tCJr');
    });
});

describe('serialization', () => {
    it('should ok', () => {
        let op1 = new tc.OutPoint({ txid: 'c0ffee', txout_idx: 0 });
        let op2 = new tc.OutPoint({ txid: 'c0ffee', txout_idx: 1 });

        let txin1 = new tc.TxIn({
            to_spend: op1,
            unlock_sig: tc.bytes('oursig'),
            unlock_pk: tc.bytes('foo'),
            sequence: 1
        });

        let txin2 = new tc.TxIn({
            to_spend: op2,
            unlock_sig: tc.bytes('oursig'),
            unlock_pk: tc.bytes('foo'),
            sequence: 2
        });

        let txout = new tc.TxOut({
            value: 101,
            to_address: '1zxoijw'
        });

        let txn1 = new tc.Transaction({
            txins: [ txin1 ],
            txouts: [ txout ],
            locktime: 0
        });

        let txn2 = new tc.Transaction({
            txins: [ txin2],
            txouts: [ txout ],
            locktime: 0
        });

        let block = new tc.Block({
            version: 1,
            prev_block_hash: 'deadbeef',
            merkle_hash: 'c0ffee',
            timestamp: Math.floor(Date.now() / 1000),
            bits: 100,
            nonce: 100,
            txns: [ txn1, txn2 ]
        });

        let utxo = new tc.UnspentTxOut({
            value: txout.value,
            to_address: txout.to_address,
            txid: txn1.id,
            txout_idx: 0,
            is_coinbase: false,
            height: 0
        });

        tc.utxo_set.set(utxo.outpoint, utxo);

        for (let obj of [
                op1, op2, txin1, txin2, txout, txn1, txn2, block, utxo, Array.from(tc.utxo_set.entries())]) {
            assert.deepEqual(tc.deserialize(tc.serialize(obj)), obj);
        }
    });
});

describe('dependent txns in single block', () => {
    it('should ok', () => {
        doCleanArray(tc.active_chain);
        tc.mempool.clear();
        tc.utxo_set.clear();

        assert(tc.connect_block(chain1[0]) === tc.ACTIVE_CHAIN_IDX);
        assert(tc.connect_block(chain1[1]) === tc.ACTIVE_CHAIN_IDX);

        assert(tc.active_chain.length === 2);
        assert(tc.utxo_set.size === 2);

        // TODO...
    });
});

describe('merkle trees', () => {

    it('should ok 2 txns', () => {
        let root = tc.get_merkle_root('foo', 'bar');
        let fooh = tc.sha256d('foo');
        let barh = tc.sha256d('bar');

        assert(root);
        assert(root.val === tc.sha256d(fooh + barh));
    });

    it('should ok 3 txns', () => {
        let root = tc.get_merkle_root('foo', 'bar', 'baz');
        let fooh = tc.sha256d('foo');
        let barh = tc.sha256d('bar');
        let bazh = tc.sha256d('baz');

        assert(root);
        assert(root.children.length === 2);
        assert(root.children[0].val === tc.sha256d(fooh + barh));
        assert(root.children[1].val === tc.sha256d(bazh + bazh));
    });
});

describe('build spend message', () => {
    it('should ok', () => {
        let txout = new tc.TxOut({ value: 101, to_address: '1zz8w9' });
        let txin = new tc.TxIn({
            to_spend: new tc.OutPoint({ txid: 'c0ffee', txout_idx: 0 }),
            unlock_sig: '6f7572736967',
            unlock_pk: '666f6f',
            sequence: 1
        });

        let txn = new tc.Transaction({
            txins: [ txin ],
            txouts: [ txout ],
            locktime: 0
        });

        let spend_msg = tc.build_spend_message(
            txin.to_spend, txin.unlock_pk, txin.sequence, txn.txouts);

        assert(spend_msg === '677c2d8f9843d1cc456e7bfbc507c0f6d07d19c69e6bca0cbaa7bfaea4dd840a');

        txn.txouts.push(new tc.TxOut({ value: 1, to_address: '1zz' }));

        assert(tc.build_spend_message(
            txin.to_spend, txin.unlock_pk, txin.sequence, txn.txouts) !== spend_msg);
    });
});

function doCleanArray(arr) {
    arr.splice(0, arr.length);
}

function doAddToUTXOForChain(chain) {
    for (let block of chain) {
        for (let tx of block.txns) {
            for (let [ i, txout ] of tx.txouts.entries()) {
                tc.add_to_utxo(txout, tx, i, tx.is_coinbase, chain.length);
            }
        }
    }
}

describe('get median time past', () => {

    it('should ok', () => {
        function _dummy_block(kwargs) {
            let obj = {
                version: 1,
                prev_block_hash: 'c0ffee',
                merkle_hash: 'deadbeef',
                timestamp: 1,
                bits: 1,
                nonce: 1,
                txns: []
            };

            return new tc.Block(Object.assign(obj, kwargs));
        }

        doCleanArray(tc.active_chain);

        assert(tc.get_median_time_past(10) === 0);

        for (let t of [ 1, 30, 60, 90, 400]) {
            tc.active_chain.push(_dummy_block({ timestamp: t }));
        }

        assert(tc.get_median_time_past(1) === 400);
        assert(tc.get_median_time_past(3) === 90);
        assert(tc.get_median_time_past(2) === 90);
        assert(tc.get_median_time_past(5) === 60);
    });
});

describe('reorg active chain', () => {
    it('should ok', () => {

        doCleanArray(tc.active_chain);

        for (let block of chain1) {
            assert(tc.connect_block(block) === tc.ACTIVE_CHAIN_IDX);
        }

        doCleanArray(tc.side_branches);
        tc.mempool.clear();
        tc.utxo_set.clear();

        doAddToUTXOForChain(tc.active_chain);

        function assert_no_change() {
            assert.deepEqual(tc.active_chain, chain1);
            assert.deepEqual(tc.mempool, new Map);

            let test = [ '8b7bfc', 'b8a642', '6708b9' ];
            for (let k of tc.utxo_set.values()) {
                assert(k.txid.substring(0, 6) === test.shift());
            }
        }

        assert(tc.utxo_set.size === 3);
        assert(tc.reorg_if_necessary() === false);

        for (let block of chain2.slice(1, 2)) {
            assert(tc.connect_block(block) === 1);
        }

        assert(tc.reorg_if_necessary() === false);
        assert.deepEqual(tc.side_branches, [ chain2.slice(1,2) ]);
        assert_no_change();

        assert(tc.connect_block(chain2[2]) === 1)
        assert(tc.reorg_if_necessary() === false);
        assert_no_change();

        // # No reorg necessary when side branch is a longer but invalid chain.

        // # Block doesn't connect to anything because it's invalid.
        assert (tc.connect_block(chain3_faulty[3]) === None)
        assert(tc.reorg_if_necessary() === false);

        // # No change in side branches for an invalid block.
        assert.deepEqual(tc.side_branches, [ chain2.slice(1,3) ]);
        assert_no_change();

        // # Reorg necessary when a side branch is longer than the main chain.

        assert(tc.connect_block(chain2[3]) === 1)
        assert(tc.connect_block(chain2[4]) === 1)

        // # Chain1 was reorged into side_branches.
        for (let c of tc.side_branches) {
            assert(c.length === 2);
        }

        assert.deepEqual(tc.side_branches[0].map(b => b.id), chain1.slice(1).map(b => b.id));
        assert.deepEqual(tc.side_branches, [chain1.slice(1)]);
        assert.deepEqual(tc.mempool, new Map);

        let test2 = [ '8b7bfc', 'b8a642', '6708b9', '543683', '53f3c1' ];
        for (let k of tc.utxo_set.values()) {
            assert(k.txid.substring(0, 6) === test2.shift());
        }
    });
});
