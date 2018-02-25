#!/usr/bin/env node
/***
tinychain


⛼  tinychain

  putting the rough in "rough consensus"


Some terminology:

- Chain: an ordered list of Blocks, each of which refers to the last and
      cryptographically preserves a history of Transactions.

- Transaction (or tx or txn): a list of inputs (i.e. past outputs being spent)
    and outputs which declare value assigned to the hash of a public key.

- PoW (proof of work): the solution to a puzzle which allows the acceptance
    of an additional Block onto the chain.

- Reorg: chain reorganization. When a side branch overtakes the main chain.


An incomplete list of unrealistic simplifications:

- Byte encoding and endianness are very important when serializing a
  data structure to be hashed in Bitcoin and are not reproduced
  faithfully here. In fact, serialization of any kind here is slipshod and
  in many cases relies on implicit expectations about Python JSON
  serialization.

- Transaction types are limited to P2PKH.

- Initial Block Download eschews `getdata` and instead returns block payloads
  directly in `inv`.

- Peer "discovery" is done through environment variable hardcoding. In
  bitcoin core, this is done with DNS seeds.
  See https://bitcoin.stackexchange.com/a/3537/56368


Resources:

- https://en.bitcoin.it/wiki/Protocol_rules
- https://en.bitcoin.it/wiki/Protocol_documentation
- https://bitcoin.org/en/developer-guide
- https://github.com/bitcoinbook/bitcoinbook/blob/second_edition/ch06.asciidoc


TODO:

- deal with orphan blocks
- keep the mempool heap sorted by fee
- make use of Transaction.locktime
? make use of TxIn.sequence; i.e. replace-by-fee

*/

let crypto = require('crypto');
let fs = require('fs');
let RIPEMD160 = require('ripemd160');
let Promise = require('bluebird');
var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
var bs58 = require('base-x')(BASE58)

// Misc. utilities
// ----------------------------------------------------------------------------

const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
// or require('secp256k1/elliptic')
//   if you want to use pure js implementation in node

// generate privKey
let generateKey = function(){
	let privKey
	do {
	  privKey = randomBytes(32)
	} while (!secp256k1.privateKeyVerify(privKey))

	// get the public key in a compressed format
	var pubKey = secp256k1.publicKeyCreate(privKey)

	return {privateKey:privKey,publicKey:pubKey};
}

let loadKey = function(str){
	var privateKey = Buffer.from(str);
	var pubKey = secp256k1.publicKeyCreate(privKey)

	return {privateKey:privKey,publicKey:pubKey};
}




let b58encode_check = function(buff){
	var sha = crypto.createHash('sha256');
	sha.update(buff);
	var sha2 = crypto.createHash('sha256');
	sha2.update(sha.digest());
	return bs58.encode(Buffer.concat([buff,sha2.digest().slice(0,4)]));
}

let stringToUInt8Array =function(str)
{
	var uint=new Uint8Array(str.length);
	for(var i=0,j=str.length;i<j;++i){
  		uint[i]=str.charCodeAt(i);
	}
	return uint;
}


class BaseException extends Error {
    constructor(message) {
        super(message);
        this.name = 'BaseException';
    }
}

class TxUnlockError extends BaseException {
    constructor(message) {
        super(message);
        this.name = 'TxUnlockError';
    }
}

class TxnValidationError extends BaseException {
    constructor(message,to_orphan) {
        super(message);
        this.name = 'TxnValidationError';
        this.to_orphan = to_orphan;
    }
}

class BlockValidationError extends BaseException {
    constructor(message,to_orphan) {
        super(message);
        this.name = 'BlockValidationError';
        this.to_orphan = to_orphan;
    }
}

class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValueError';
    }
}

let sha256d = function(s) {
    //"""A double SHA-256 hash."""
    if (!(s instanceof Buffer))
        s = new Buffer(s);

    var sha256_1 = crypto.createHash('sha256');
    sha256_1.update(s);
    var sha256_2 = crypto.createHash('sha256');
    sha256_2.update(sha256_1.digest());
    return sha256_2.digest('hex');
}


let serialize = function(obj) {
    return JSON.stringify(obj);
}

let deserialize = function(str) {
	/*
	    """NamedTuple-flavored serialization from JSON."""
    gs = globals()

    def contents_to_objs(o):
        if isinstance(o, list):
            return [contents_to_objs(i) for i in o]
        elif not isinstance(o, Mapping):
            return o

        _type = gs[o.pop('_type', None)]
        bytes_keys = {
            k for k, v in get_type_hints(_type).items() if v == bytes}

        for k, v in o.items():
            o[k] = contents_to_objs(v)

            if k in bytes_keys:
                o[k] = binascii.unhexlify(o[k]) if o[k] else o[k]

        return _type(**o)

    return contents_to_objs(json.loads(serialized))
	*/
	return JSON.parse(str);
}

let _chunks = function(l, n){
	//implemented migration
	//return (l[i:i + n] for i in range(0, len(l), n))
	var result =[];
	for(var i =0;i<l.length;l+=n)
	{
		result.push(l.slice(i,i+n));
	}
}


let logger = {
    info: function(str) {
        console.log('-INFO:' + str);
    },
    debug: function(str) {
        console.log('-DEBUG:' + str);
    },
    exception:function(str) {
    	console.log('-ERROR:' + str);
    },
    warn: function(str){
    	console.log('-WARN:'+str);
    }
}

// Base
// --------------------------------------------------------------------

let Params = {
    MAX_BLOCK_SERIAL_SIZE: 1000000,
    COINBASE_MATURITY: 2,
    MAX_FUTURE_BLOCK_TIME: (60 * 60 * 2),
    BELUSHIS_PER_COIN: Number(100e6),
    TOTAL_COINS: 21000000,
    MAX_MEMORY: this.BELUSHIS_PER_COIN * this.TOTAL_COINS,
    TIME_BETWEEN_BLOCKS_IN_SECS_TARGET: 1 * 60,
    DIFFICULTY_PERIOD_IN_SECS_TARGET: (60 * 60 * 10),
    DIFFICULTY_PERIOD_IN_BLOCKS: (this.DIFFICULTY_PERIOD_IN_SECS_TARGET / this.TIME_BETWEEN_BLOCKS_IN_SECS_TARGET),
    INITIAL_DIFFICULTY_BITS: 24,
    HALVE_SUBIDY_AFTER_BLOCKS_NUM: 210000
}


let NamedList = function(fields) {
    return function(arr) {
        var obj = {};

        for (var i = 0; i < arr.length; i++) {
            obj[fields[i]] = arr[i];
        }

        return obj;
    };
};

let OutPoint = NamedList(['txid', 'txout_idx']);
let TxIn = function(to_spend, unlock_sig, unlock_pk, sequence) {
    this.to_spend = to_spend;
    this.unlock_sig = unlock_sig;
    this.unlock_pkg = unlock_pk;
    this.sequence = sequence;
    return this;
};
let TxOut = function(value, to_address) {
    this.value = value;
    this.to_address = to_address;
    return this;
};

let UnspentTxOut = function(value, to_address, tx_id, txout_idx, is_coinbase, height) {
    this.value = value;
    this.to_address = to_address;
    this.txid = txid;
    this.txout_idx = txout_idx;
    this.is_coinbase = is_coinbase;
    this.height = height;
    return this;
}

let Transaction = function(txins, txouts, locktime) {
    this.txins = txins;
    this.txouts = txouts;
    this.locktime = locktime;
    return this;
}

Transaction.prototype.is_coinbase = function() {
    return this.txins.legnth = 1 && this.txins[0].to_spend == null;
}
Transaction.prototype.create_coinbase = function(cls, pay_to_addr, value, height) {
    return cls(
        [{
            to_spend: null,
            unlock_sig: str(height).encode(),
            unlock_pk: null,
            sequence: 0
        }], [{
            value: value,
            to_address: pay_to_addr
        }]
    )
}

Transaction.prototype.id = function(self) {
    return sha256d(serialize(self));
}

let Block = function (version, prev_block_hash, merkle_hash, timestamp, bits, nonce, txns) {
    this.version = version;
    this.prev_block_hash = prev_block_hash;
    this.merkle_hash = merkle_hash;
    this.timestamp = timestamp;
    this.bits = bits;
    this.nonce = nonce;
    this.txns = txns;
    return this;
}

Block.prototype.header = function() {
    return this.version + this.prev_block_hash + this.merkle_hash + this.timestamp + this.bits + (nonce || this.nonce);
}



// Chain
// ----------------------------------------------------------------------------


let genesis_block = new Block(
    0, null, '7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22',
    1501821412, 24, 10126761, [new Transaction([new TxIn(null, '0', null, 0)], [new TxOut(5000000000, '143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF')], null)]
);

var active_chain = [genesis_block];

var side_branches = [];

var chain_lock = {};

/* 没用
let with_lock = function(lock)
{
	var dec = function(func){
		var wrapper(args,kwargs){
			return func(args,kwargs)
		}
		return wrapper;
	}
	return dec;
};
*/

let orphan_blocks = [];

let ACTIVE_CHAIN_INDEX = 0;

let get_current_height = function() {
    return active_chain.length;
}

let txn_iterator = function(chain) {
    return
}
//didn't try to use the same paradigm, into a array then iterate
let locate_block = function(block_hash, chain) {
    //chains = chain?[chain]:[active_chain,side_branches];
    var result = [null, null, null];
    if (chain) {
        chain.each(function(block, idx) {
            if (block.id == block_hash) result = [block, idx, 0]
        });
        return result;
    } else {
        result = null;
        active_chain.each(function(block, idx) {
            if (block.id == block_hash) result = [block, idx, 0];
        });
        if (result) return result;
        side_branches.each(function(block, idx) {
            if (block.id == block_hash) result = [block, idx, 0];
        });
        return result || [null, null, null];
    }

}

let connect_block = function(block, doing_reorg) {
    search_chain = doing_reorg ? active_chain : null;
    if (locate_block(block.id, search_chain)[0]) {
        logger.debug(`ignore block already seen:${block.id}`);
        return null;
    }

    try
    {
    	var r = validate_block(block);
    	var block = r[0], chain_idx=r[0];
    }
    catch(e)
    {
    	if(e instanceof BlockValidationError)
    	{
    		logger.exception('block '+block.id+' failed validation!');
    		if(e.to_orphan)
    		{
    			logger.info('saw orphan block' + block.id);
    			orphan_blocks.append(e.to_orphan);
    		}
    	}

    }

    if(chain_idx != ACTIVE_CHAIN_IDX && side_branches.length<chain_idx)
    {
    	logger.info('creating a new side branch (idx '+chain_idx+')');
    	side_branches.append([]);
    }

    logger.info('connecting block '+block.id+' to chain '+ chain_idx);
    chain =  chain_idx == ACTIVE_CHAIN_IDX? (active_chain ):side_branches[chain_idx -1];

    chain.append(block);
    if(chain_idx == ACTIVE_CHAIN_IDX)
    {
    	block.txns.forEach(function(tx){
    		mempool.pop(tx.id, null);
    		if(! tx.is_coinbase)
    			tx.txins.forEach(function(){
    				//implemented: to extend the star
    				//implemented: to migrate;
    				rm_from_utxo(txin.to_spend.txid,txin.to_spend.txout_idx);
    			})
    		tx.txouts.forEach(function(tx,idx){
    			add_to_utxo(txout,tx,i,tx_is_coinbase,chain.length);
    		})
    	})
    }

    if((! doing_reorg && reorg_if_necessary()) ||
    	chain_idx == ACTIVE_CHAIN_IDX )
    {
    	mine_interrupt.set();
    	logger.info('block accepted ');
    	lotter.info('height = '+(active_chain.length-1)+' txns = '+block.txns.length);
    }

    peer_hostnames.forEach(function(peer){
    	send_to_peer(block,peer);
    })

    return chain_idx;
}

let disconnect_block = function(block, chain = null){
	chain = chain || active_chain;
	if(block != chain[-1])throw Error('Block being disconnected must be tip.');

	block.txns.forEach(function(tx){
		mempool[tx.id] = tx;

		tx.txins.forEach(function(txin){
			//implemented: to migrate
			var r =find_txout_for_txin(txin,chain);
			if(txin.to_spend)add_to_utxo(r[0],r[1],r[2],r[3],r[4]);
		});

		range(tx.txouts.length).forEach(function(i){
			rm_from_utxo(tx.id,i);
		})
	})

	logger.info('block '+block.id+' disconnected');
	return chain.pop();
}

let find_txout_for_txin=function(txin, chain){
	txid = txin.to_spend[0];
	txout_idx = tx.to_spend[1];

	var txout = chain.find(function(t){
		return t.id==txid;
	});

	txout = txout.txouts[txout_idx];
	return [txout,tx,txout_idx,tx.is_coinbase,height];
}

let reorg_if_necessary = function(){
	var reorged = false;
	var frozen_side_branches = list(side_branches);
	for(i =1;i<frozen_side_branches.length;i++){
		var ele = frozen_side_branches[i];
		var r = locate_block(chain[0].prev_block_hash,active_chain);
		var fork_block = r[0];
		var fork_idx = r[1];
		var _ = r[2];
		active_height = active_chain.length;
		branch_height = chain.length + fork_idx;

		if(branch_height>active_height)
		{
			logger.info(`attempting reorg of idx ${branch_idx} to active_chain: `);
			logger.info(`new height of ${branch_height} (vs. ${active_height})`);
			reorged |= try_reorg(chain,branch_idx,fork_idx);
		}
	}
	return reorged;
}



let try_reorg=function(branch, branch_idx,fork_idx){
	fork_block = active_chain[fork_idx];
	let disconnect_to_fork=function*(){
		while(active_chain[-1].id!=fork_block.id)
		{
			var a =disconnect_block(active_chain[-1]);
			yield;
		}
	}
	//todo change to python syntax
	//old_active = list(disconnect_to_fork())[::-1];
	old_active = disconnect_to_fork().reverse();

	if(branch[0].prev_block_hash!=active_chain[-1].id)throw Error('Asset Error');

	let rollback_reorg=function()
	{
		logger.info(`reorg of idx ${branch_idx} to active_chain failed`);
		list(disconnect_to_fork());
		old_active.forEach(function(block){
			if(connect_block(block, true)!=ACTIVE_CHAIN_IDX)throw Error('Assert Error');
		});

	};

	branch.forEach(function(block){
		connected_idx = connect_block(block, true);
		if(connected_idx!=ACTIVE_CHAIN_IDX)
		{
			rollback_reorg();
			return false;
		}
	});

	side_branches.pop(branch_idx-1);
	side_branches.append(old_active);

	logger.info(`chain reorg! New height: ${active_chain.length}, tipe:${active_chain[-1].id}`);

	return true;

}


let get_median_time_past=function(num_last_blocks){
	last_n_blocks = actife_chain.reverse().slice(0,num_last_blocks);
	if(! last_n_blocks)return 0;
	return last_n_blocks[Math.floor(last_n_blocks.length/2)].timestamp;
}

CHAIN_PATH = process.env['TC_CHAIN_PATH']||'chain.data';

let save_to_disk=function(){
	fs.open(CHAIN_PATH,'wb').then(function(file){
		logger.info(`saving chain with ${active_chain.length} blocks`);
		file.write(encode_socket_data(active_chain));
	});
}

let load_from_disk=function(){
	if(!fs.exist(CHAIN_PATH))
	{
		logger.warn('no file: '+CHAIN_PATH);
		return;
	}

	try
	{
		fs.open(CHAIN_PATH,'rb').then(function(file){
			//todo: to migrate this.
			file.read(4).then(function(buff){
				buff = buff|| 0x00;

			})
		})
	}
	catch(e)
	{
		logger.exception('load chain failed, starting from genesis');
	}
}

// UTXO set
// ----------------------------------------------------------------------------


utxo_set = {};

let add_to_utxo = function(txout,tx,idx,is_coinbase, height){
	utxo = new UnspentTxOut(txout.value,txout.address,tx.id,idx,is_coinbase,height);
	logger.info(`adding tx outpoint ${utxo.outpoint} to utxo_set`);
	utxo_set[utxo.outpoint] = utxo;
};

let rm_from_utxo=function(txid,txout_idx){
	utxo_set[OutPoint(txid,txout_idx)]=undefined;
};

let find_utxo_in_list=function(txin,txns){
	txid = txin.to_spend[0],txout_idx = txin.to_spend[1];
	try
	{
		txout = txns.find(function(tx){return tx.id=txid;}).txouts[txout_idx];
	}
	catch(e)
	{
		return null;
	}
	return new UnspentTxOut(txout.value,txout.address,tx.id,idx,is_coinbase,height);
};

// Proof of work
// ------------------------------------------------------------------

let get_next_work_required = function(prev_block_hash){
	if(! prev_block_hash)
		return Params.INITIAL_DIFFICULTY_BITS;

	var r = locate_block(prev_block_hash)


}

let assemble_and_solve_block = function (pay_coinbase_to_addr, txns = null) {
    // Construct a Block by pulling transactions from the mempool, then mine it.

    // TODO: Reentrant lock
    //
    // with chain_lock:
    //     prev_block_hash = active_chain[-1].id if active_chain else None

    let len = active_chain.length;
    let prev_block_hash = len > 0 ? active_chain[len - 1].id : null;

    let block = new Block(
        /* version= */          0,
        /* prev_block_hash= */  prev_block_hash,
        /* merkle_hash= */      '',
        /* timestamp= */        Math.floor((Date.now ? Date.now : +(new Date())) / 1000),
        /* bits= */             get_next_work_required(prev_block_hash),
        /* nonce= */            0,
        /* txns= */             txns || []
    );

    if (!block.txns.length) {
        block = select_from_mempool(block);
    }

    let fees = calculate_fees(block);
    let my_address = init_wallet()[2];
    let coinbase_txn = Transaction.create_coinbase(
        my_address, (get_block_subsidy() + fees), active_chain.length);

    block.txns = [ coinbase_txn ].concat(block.txns);
    block.merkle_hash = get_merkle_root_of_txns(block.txns).val;

    if (serialize(block).length > Params.MAX_BLOCK_SERIALIZED_SIZE) {
        throw new ValueError('txns specified create a block too large');
    }

    return mine(block);
}

let calculate_fees = function (block) {
    // Given the txns in a Block, subtract the amount of coin output from the
    // inputs. This is kept as a reward by the miner.
    let fee = 0;

    function utxo_from_block(txin) {
        let tx = block.txns.find(t => {
            return t.id === txin.to_spend.txid;
        });

        return tx ? tx.txouts[txin.to_spend.txout_idx] : null;
    }

    function find_utxo(txin) {
        return utxo_set.get(txin.to_spend) || utxo_from_block(txin);
    }

    function reducer(sum, v) {
        return sum + v;
    }

    block.txns.forEach((_, txn) => {
        let spent = txn.txins.map(i => {
            return find_utxo(i).value;
        }).reduce(reducer);

        let sent = txn.txouts.map(o => {
            return o.value;
        }).redue(reducer);

        fee += spent - sent;
    });

    return fee;
}

let get_block_subsidy = function () {
    halvings = Math.floor(active_chain / Params.HALVE_SUBSIDY_AFTER_BLOCKS_NUM);

    if (halvings >= 64) {
        return 0;
    }

    return Math.floor(50 * Params.BELUSHIS_PER_COIN / Math.pow(2, halvings));
}

// Signal to communicate to the mining thread that it should stop mining because
// we've updated the chain with a new block.
// todo: to migrate
mine_interrupt = null; // threading.Event()

let mine = function () {
	//todo: to migrate
}

let mine_forever = function () {
	//todo: to migrate
}


// Validation
// ------------------------------------------------------------------
let validate_txn =function(txn,as_coinbase,siblings_in_block,allow_utxo_from_mempool){
	//todo: to migrate;
}

let validate_signature_for_spend = function(txin,utxo,txn)
{
	//todo: to migrate;
}

let build_spend_message = function(to_spend,pk,sequence,txouts)
{
	return sha256d(serialize(to_spend)+str(sequence)+binascii.hexlify(pk).decode()+serialize(txouts)).encode();
}

let validate_block = function(block) {
    if (!block.txns)
        throw new BlockValidationError('txns empty')

    if (block.timestamp - time.time() > Params.MAX_FUTURE_BLOCK_TIME)
        throw BlockValidationError('Block timestamp too far in future')

    if (int(block.id, 16) > (1 << (256 - block.bits)))
        throw BlockValidationError("Block header doesn't satisfy bits")


    var ntxns = block.txns.filter(tx=>{return tx.is_coinbase;}).map((tx,i)=>{return i});;
    if (ntxns!= [0])
    	throw BlockValidationError('First txn must be coinbase and no more')

    try{
    	//for i, txn in enumerate(block.txns):
    	block.txns.forEach(function(txn,i){
    		txn.validate_basics(as_coinbase = (i == 0))
    	})
    }
    catch(e){
    	if(e instanceof TxnValidationError)
        	logger.exception(`Transaction ${txn} in ${block} failed to validate`);
        throw BlockValidationError('Invalid txn {txn.id}')
    }


    if (get_merkle_root_of_txns(block.txns).val != block.merkle_hash)
        throw BlockValidationError('Merkle hash invalid')

    if (block.timestamp <= get_median_time_past(11))
        throw BlockValidationError('timestamp too old')

    if (! block.prev_block_hash && ! active_chain) //This is the genesis block.
    	prev_block_chain_idx = ACTIVE_CHAIN_IDX;
    else
    {

        prev_block, prev_block_height, prev_block_chain_idx = locate_block(
            block.prev_block_hash);

    	if(! prev_block)
        	throw BlockValidationError(
            	'prev block {block.prev_block_hash} not found in any chain',
            	to_orphan = block)

    	// No more validation for a block getting attached to a branch.
    	if ( prev_block_chain_idx != ACTIVE_CHAIN_IDX)
        	return [block, prev_block_chain_idx]

    	// Prev.block found in active chain, but isn 't tip => new fork.
    	else (prev_block != active_chain[-1])
        	return [block, prev_block_chain_idx + 1] // Non - existent
    }

    if (get_next_work_required(block.prev_block_hash) != block.bits)
        throw BlockValidationError('bits is incorrect')

    block.txns.slice(1).forEach(function(txn){
    	try
    	{

        	validate_txn(txn, siblings_in_block = block.txns.slice(1),
            	allow_utxo_from_mempool = False);
    	}
    	catch(e)
    	{
    		if(e instanceof TxnValidationError)
    		{
    			msg = `${txn} failed to validate`;

    			logger.exception(msg);
    			throw new BlockValidationError(msg);
    		}

    	}

    })



    return [block, prev_block_chain_idx];
}

// mempool
// ------------------------------------------------------------------

// Set of yet-unmined transactions.
mempool = {};

// Set of orphaned (i.e. has inputs referencing yet non-existent UTXOs)
// transactions.
orphan_txns = [];

let find_utxo_in_mempool = function(txin){
	var r = txin.to_spend;
	txid = r[0], idx = r[1];
	try
	{
		txout = mempool[txid].txouts[idx];
	}
	catch(e)
	{
		logger.debug("Couldn't find utxo in mempool for "+txin);
		return null;
	}
	return new UnspentTxOut(txout.value,txout.address,txid,false,-1,idx);
};

let select_from_mempool = function(block)
{
	//todo: to migrate
}

let add_txn_to_mempool=function(txn)
{
	//todo: to migrate
}

// Merkle trees
// ----------------------------------------------------------------------------

let MerkleNode = function()
{
	this.val = null;
	this.children = null;
	return this;
}

let get_merkle_root_of_txns=function(txns)
{
	//todo: to understand the original python syntax;
	return get_merkle_root()
}

let get_merkle_root = function(leaves)
{
	//todo: to migrate
}



// Peer-to-peer
// ----------------------------------------------------------------------------

peer_hostnames = (process.env['TC_PEERS']||'').split(',').filter(function(e){return e!=''});

// Signal when the initial block download has completed.
ibd_done = null; //threading.Event()

let GetBlockMsg = function(){
	//todo: to migrate
}

let InvMsg = function(){
	//todo: to migrate
}

let GetUTXOsMsg = function(){
	//todo: to migrate
}

let GetMempoolMsg = function(){
	//todo: to migrate
}

let GetActiveChainMsg = function(){
	//todo: to migrate
}

let AddPeerMsg = function(){
	//todo: to migrate
}

let read_all_from_socket = function(req)
{
	//todo: to migrate
}

let send_to_peer = function(){
	//todo: to migrate
}

let int_to_8bytes = function(a){
	//todo: to migrate
	return binascii.unhexlify((a||0).toString(16));
}

let encode_socket_data = function(data)
{
	to_send = serialize(data).encode();
	return int_to_8bytes(to_send.length)+to_send;
}

//todo: to change __ to . to implement
let ThreadedTCPServer = function(socketserver__ThreadingMixIn,socketserver__TCPServer){
	//todo: to migrate;
	pass
}

let TCPHandler = function(socketserver__BaseRequestHandler){
	//todo: to migrate;
}

// Wallet
// ----------------------------------------------------------------------------

WALLET_PATH = process.env['TC_WALLET_PATH']||'wallet.dat';

let pubkey_to_address = function(pubkey)
{
	//implemented?: to migrate;
	var sha256_1 = crypto.createHash('sha256');
    sha256_1.update(pubkey);
    sha=sha256_1.digest();
    ripe = new RIPEMD160().update(sha).digest();
    //return b58encode_check(b'\x00' + ripe)
    //byte replace with unicoe??
    //return bs58.encode(String.fromCharCode(0) + ripe);
    return b58encode_check(ripe);

}

let init_wallet = function(){
	//todo: to migrate;
	path = path || WALLET_PATH
	//to beautify the file create process with promise
	let readOrWriteKey = new Promise(function(resolve, reject){
		fs.exists(path,function(exists){
	    	if(exists)
	    	{
	    		fs.readFile(path,function(err,data){
	    			if(!err)
	    			{
	    				//signing_key = ecdsa.SigningKey.from_string(data, curve=ecdsa.SECP256k1);
	    				key = loadKey(data);
	    				resolve(key);
	    			}
	    			else
	    				reject(err);

	    		});

	    	}
	    	else{
	    		logger.info(`"generating new wallet: $'{path}'`);
	        	//signing_key = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
	        	signing_key = generateKey();
	        	fs.writeFile(path, signing_key.privateKey.toString(),function(err){
	        		if(!err)resolve(signing_key);
	        		else reject(err);
	        	});
	    	}
    	})
	});

	return readOrWriteKey.then(function(key){
		verifying_key = key.publicKey;
		my_address = pubkey_to_address(verifying_key.to_string());
		logger.info(`your address is ${my_address}`);

		return ([key.privateKey, verifying_key, my_address]);
	})

};



// Main
// ----------------------------------------------------------------------------

let main = function(){
	workers = [];

	let start_worker=function(fnc){
		workers.append(threading.Thread(target=fnc, daemon=True));
	    workers[-1].start();
	}

	//todo: to migrate;
	load_from_disk().then(function(){

	    server = ThreadedTCPServer(('0.0.0.0', PORT), TCPHandler)



	    logger.info(`'[p2p] listening on ${PORT}`)
	    start_worker(server.serve_forever)

	    if(peer_hostnames)
	    {
	    	logger.info(
	            `'start initial block download from ${len(peer_hostnames)} peers`)
	        send_to_peer(GetBlocksMsg(active_chain[-1].id))
	        ibd_done.wait(60.)  // Wait a maximum of 60 seconds for IBD to complete.
	    }


	    start_worker(mine_forever)
	    //todo: to migrate
	    //[w.join() for w in workers]
	});
}

if(!module.parent)
{
	var r = init_wallet();
	signing_key = r[0], verifying_key= r[1], my_address= r[2];
	main();
}
else
{
	module.exports.sha256d = sha256d;
	module.exports.pubkey_to_address= pubkey_to_address;
}












