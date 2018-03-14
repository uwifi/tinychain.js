var tinychain = require('../tinychain');
var chai = require('chai');
var expect = chai.expect;

let stringToUInt8Array =function(str)
{
	var uint=new Uint8Array(str.length);
	for(var i=0,j=str.length;i<j;++i){
  		uint[i]=str.charCodeAt(i);
	}
	return uint;
}

function test_merkle_trees() {
    let root = get_merkle_root('foo', 'bar')
    let fooh = sha256d('foo')
    let barh = sha256d('bar')

    assert(root)
    assert(root.val == sha256d(fooh + barh))
    assert(root.children[0].val == fooh)
    assert(root.children[1].val == barh)

    root = get_merkle_root('foo', 'bar', 'baz')
    let bazh = sha256d('baz')

    assert(root)
    assert(len(root.children) == 2)
    assert(root.children[0].val == sha256d(fooh + barh))
    assert(root.children[1].val == sha256d(bazh + bazh))
}

function test_build_spend_message() {
    let txout = new TxOut({ value: 101, to_address: '1zz8w9' });
    let txin = new TxIn({
        to_spend: new OutPoint({ txid: 'c0ffee', txout_idx: 0 }),
        unlock_sig: '6f7572736967',
        unlock_pk: '666f6f',
        sequence: 1
    });

    let txn = new Transaction({
        txins: [ txin ],
        txouts: [ txout ],
        locktime: 0
    });

    let spend_msg = build_spend_message(
        txin.to_spend, txin.unlock_pk, txin.sequence, txn.txouts);

    assert(spend_msg === '677c2d8f9843d1cc456e7bfbc507c0f6d07d19c69e6bca0cbaa7bfaea4dd840a')

    txn.txouts.push(new TxOut({ value: 1, to_address: '1zz' }));
    assert(build_spend_message(
        txin.to_spend, txin.unlock_pk, txin.sequence, txn.txouts) !== spend_msg);
}

function test_get_median_time_past() {
    active_chain = [];
    assert(get_median_time_past(10) == 0);

    let timestamps = [1, 30, 60, 90, 400];
    active_chain = timestamps.map(t => {
        return _dummy_block({ timestamp: t });
    });

    assert(get_median_time_past(1) == 400);
    assert(get_median_time_past(3) == 90);
    assert(get_median_time_past(2) == 90);
    assert(get_median_time_past(5) == 60);
}

function test_reorg() {
    active_chain = []

    for (let block of chain1) {
        assert(connect_block(block) === ACTIVE_CHAIN_IDX)
    }

    side_branches = [];
    mempool = new Map;
    utxo_set = new UTXOs;

    _add_to_utxo_for_chain(active_chain);

    function assert_no_change() {
        assert(JSON.stringify(active_chain) === JSON.stringify(chain1));
        assert(JSON.stringify(mempool) === JSON.stringify(new Map));

        let test = [ '8b7bfc', 'b8a642', '6708b9' ];
        for (let k of utxo_set.values()) {
            assert(k.txid.substring(0, 6) === test.shift());
        }
    }

    assert(len(utxo_set) === 3);
    assert(reorg_if_necessary() === false);

    for (let block of chain2.slice(1, 2)) {
        assert(connect_block(block) === 1);
    }

    assert(reorg_if_necessary() === false);
    assert(JSON.stringify(side_branches) === JSON.stringify([ chain2.slice(1,2) ]));
    assert_no_change();

    assert(connect_block(chain2[2]) === 1)
    assert(reorg_if_necessary() === false);
    assert_no_change();

    // # No reorg necessary when side branch is a longer but invalid chain.

    // # Block doesn't connect to anything because it's invalid.
    assert (connect_block(chain3_faulty[3]) === None)
    assert(reorg_if_necessary() === false);

    // # No change in side branches for an invalid block.
    assert(JSON.stringify(side_branches) === JSON.stringify([ chain2.slice(1,3) ]));
    assert_no_change()

    // # Reorg necessary when a side branch is longer than the main chain.

    assert(connect_block(chain2[3]) === 1)
    assert(connect_block(chain2[4]) === 1)

    // # Chain1 was reorged into side_branches.
    for (let c of side_branches) {
        assert(len(c) === 2);
    }

    assert(JSON.stringify(side_branches[0].map(b => b.id)) === JSON.stringify(chain1.slice(1).map(b => b.id)));
    assert(JSON.stringify(side_branches) === JSON.stringify([chain1.slice(1)]));
    assert(JSON.stringify(mempool) === JSON.stringify(new Map));

    let test2 = [ '8b7bfc', 'b8a642', '6708b9', '543683', '53f3c1' ];
    for (let k of utxo_set.values()) {
        assert(k.txid.substring(0, 6) === test2.shift());
    }
}

let chain1 = [
    // Block id: 000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561
    new Block({version:0, prev_block_hash:'None', merkle_hash:'7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22', timestamp:1501821412, bits:24, nonce:10126761, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes(0), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF'})], locktime:None})]}),

    // Block id: 00000095f785bc8fbd6007b36c2f1c414d66db930e2e7354076c035c8f92700b
    new Block({version:0, prev_block_hash:'000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561', merkle_hash:'27661bd9b23552832becf6c18cb6035a3d77b4e66b5520505221a93922eb82f2', timestamp:1501826444, bits:24, nonce:22488415, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('1'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000f9b679482f24902297fc59c745e759436ac95e93d2c1eff4d5dbd39e33
    new Block({version:0, prev_block_hash:'00000095f785bc8fbd6007b36c2f1c414d66db930e2e7354076c035c8f92700b', merkle_hash:'031f45ad7b5ddf198f7dfa88f53c0262fb14c850c5c1faf506258b9dcad32aef', timestamp:1501826556, bits:24, nonce:30715680, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('2'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]})
]

let chain2 = [
    // Block id: 000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561
    new Block({version:0, prev_block_hash:'None', merkle_hash:'7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22', timestamp:1501821412, bits:24, nonce:10126761, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('0'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF'})], locktime:None})]}),

    // Block id: 000000e4785f0f384d13e24caaddcf6723ee008d6a179428ce9246e1b32e3b2c
    new Block({version:0, prev_block_hash:'000000154275885a72c004d02aaa9524fc0c4896aef0b0f3bcde2de38f9be561', merkle_hash:'27661bd9b23552832becf6c18cb6035a3d77b4e66b5520505221a93922eb82f2', timestamp:1501826757, bits:24, nonce:25773772, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('1'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c
    new Block({version:0, prev_block_hash:'000000e4785f0f384d13e24caaddcf6723ee008d6a179428ce9246e1b32e3b2c', merkle_hash:'031f45ad7b5ddf198f7dfa88f53c0262fb14c850c5c1faf506258b9dcad32aef', timestamp:1501826872, bits:24, nonce:16925076, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('2'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id: 000000ef44dd5a56c89a43b9cff28e51e5fd91624be3a2de722d864ae4f6a853
    new Block({version:0, prev_block_hash:'000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c', merkle_hash:'dbf593cf959b3a03ea97bbeb7a44ee3f4841b338d5ceaa5705b637c853c956ef', timestamp:1501826949, bits:24, nonce:12052237, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('3'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]}),

    // Block id:
    new Block({version:0, prev_block_hash:'000000ef44dd5a56c89a43b9cff28e51e5fd91624be3a2de722d864ae4f6a853', merkle_hash:'a3a55fe5e9f9e5e3282333ac4d149fd186f157a3c1d2b2e04af78c20a519f6b9', timestamp:1501827000, bits:24, nonce:752898, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('4'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]})
]

let chain3_faulty = chain2.concat([]);
chain3_faulty[3] = new Block({version:0, prev_block_hash:'000000a1698495a3b125d9cd08837cdabffa192639588cdda8018ed8f5af3f8c', merkle_hash:'dbf593cf959b3a03ea97bbeb7a44ee3f4841b338d5ceaa5705b637c853c956ef', timestamp:1501826949, bits:24, nonce:1, txns:[new Transaction({txins:[new TxIn({to_spend:None, unlock_sig:bytes('3'), unlock_pk:None, sequence:0})], txouts:[new TxOut({value:5000000000, to_address:'1Piq91dFUqSb7tdddCWvuGX5UgdzXeoAwA'})], locktime:None})]});

function _add_to_utxo_for_chain(chain) {
    for (let block of chain) {
        for (let tx of block.txns) {
            for (let [ i, txout ] of tx.txouts.entries()) {
                add_to_utxo(txout, tx, i, tx.is_coinbase, len(chain))
            }
        }
    }
}

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

    return new Block(Object.assign(obj, kwargs));
}

describe('tinychain.js',function(){
	describe('utils',function(){
		it('should do right sha256d',function(){
			//hash256d('123') should equals 5a77d1e9612d350b3734f6282259b7ff0a3f87d62cfef5f35e91a5604c0490a3;
			expect(tinychain.sha256d('123')).to.equal('5a77d1e9612d350b3734f6282259b7ff0a3f87d62cfef5f35e91a5604c0490a3');
		});
		it('should do right public key to address', function(){
			expect(tinychain.pubkey_to_address(stringToUInt8Array('abc'))).to.equal('J4LoFeFctabK8tMJcPiAjg8sEbvJhyGzg');
		});

		it('should create right public/private key',function(){
			expect(tinychain.loadKey('')).to.equal('');
		});
	});
});
