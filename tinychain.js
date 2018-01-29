let crypto = require('crypto');



let sha256d = function(s){
	//"""A double SHA-256 hash."""
    if( !(s instanceof Buffer))
        s = new Buffer(s);

    var sha256_1 = crypto.createHash('sha256');
    sha256_1.update(s);
    var sha256_2 = crypto.createHash('sha256');
    sha256_2.update(sha256_1.digest());
    return sha256_2.digest('hex');
}
 

let serialize = function(obj){
	return JSON.stringify(obj);
}

let logger = {
	info:function(str){
		console.log(str);
	}
}


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
let TxIn = function(to_spend,unlock_sig,unlock_pk,sequence) {
    this.to_spend=to_spend;
    this.unlock_sig=unlock_sig;
    this.unlock_pkg=unlock_pk;
    this.sequence = sequence;
    return this;
};
let TxOut = function(value,to_address) {
    this.value = value;
    this.to_address = to_address;
    return this;
};

let UnspentTxOut = function(value,to_address,tx_id,txout_idx,is_coinbase,height) {
    this.value=value;
    this.to_address=to_address;
    this.txid=txid;
    this.txout_idx=txout_idx;
    this.is_coinbase=is_coinbase;
    this.height=height;
    return this;
}

let Transaction = function(txins,txouts,locktime) {
    this.txins = txins;
    this.txouts = txouts;
    this.locktime = locktime;
    return this;
}

Transaction.prototype.is_coinbase = function() {
    return this.txins.legnth = 1 && this.txins[0].to_spend == nil;
}
Transaction.prototype.create_coinbase = function(cls, pay_to_addr, value, height) {
    return cls(
        [{
            to_spend: nil,
            unlock_sig: str(height).encode(),
            unlock_pk: nil,
            sequence: 0
        }], [{
            value: value,
            to_address: pay_to_addr
        }]
    )
}

Transaction.prototype.id = function(self){
	return sha256d(serialize(self));
}

let Block = function(version,prev_block_hash,merkle_hash,timestamp,bits,nonce,txns){
	this.version =version;
	this.prev_block_hash=prev_block_hash;
	this.merkle_hash=kerkle_hash;
	this.timestamp=timestamp;
	this.bits = bits;
	this.nonce=nonce;
	this.txns = txns;
	return this;
}

Block.prototype.header = function(){
	return this.version+this.prev_block_hash+this.merkle_hash+this.timestamp+this.bits+(nonce||this.nonce);
}

let genesis_block = new Block(
	0,nil,'7118894203235a955a908c0abfc6d8fe6edec47b0a04ce1bf7263da3b4366d22',
	1501821412,24,10126761,
	[new Transaction([new TxIn(nil,'0',nil,0)],[new TxOut(5000000000,'143UVyz7ooiAv1pMqbwPPpnH4BV9ifJGFF')],nil)]
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

let get_current_height=function(){
	return active_chain.length;
}

let txn_iterator=function(chain){
	return 
}
//didn't try to use the same paradigm, into a array then iterate
let locate_block = function(block_hash,chain){
	//chains = chain?[chain]:[active_chain,side_branches];
	var result = [nil,nil,nil];
	if(chain){
		chain.each(function(block,idx){
			if(block.id==block_hash)result = [block,idx,0]
		});
		return result;
	}
	else
	{
		result=nil;
		active_chain.each(function(block,idx){
			if(block.id==block_hash)result=[block,idx,0];
		});
		if(result)return result;
		side_branches.each(function(block,idx){
			if(block.id==block_hash)result=[block,idx,0];
		});
		return result||[nil,nil,nil];
	}

}

let connect_block = function(block,doing_reorg){
	search_chain = doing_reorg?active_chain:nil;
	if(locate_block(block.id,search_chain)[0])
	{
		logger.debug(`ignore block already seen:${block.id}`);
	}
}

