var tinychain = require('../tinychain');
var chai = require('chai');
var expect = chai.expect;


describe('tinychain.js',function(){
	describe('utils',function(){
		it('should do right sha256d',function(){
			//hash256d('123') should equals 5a77d1e9612d350b3734f6282259b7ff0a3f87d62cfef5f35e91a5604c0490a3;
			expect(tinychain.sha256d('123')).to.equal('5a77d1e9612d350b3734f6282259b7ff0a3f87d62cfef5f35e91a5604c0490a3');
		});
	});
});
