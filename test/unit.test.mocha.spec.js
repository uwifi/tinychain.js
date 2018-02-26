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
			expect(tinychain.loadKey('5d71d8462d3974ff431264748bcf3de14e8ed05f5ad1f3342dac4dda20121eae').publicKey.toString('hex')).to.equal('c810418aa3d361541e0fecc0ceb0c2cb551b6e8d09c4b79468f330c449b111793d3d4d53359fe1e45d46262552ce802d31a5d951be33d63bb34d0b6e2ca62574');
		});

		it('should do right int to 8 bytes/buffer',function(){
			expect(tinychain.int_to_8bytes(1234)).to.deep.equal(Buffer.from('000004d2','hex'));
		})
	});
});
