const assert = require('node:assert/strict');
const {extractIdentifiers} = require('./identification.js');
assert.deepEqual(extractIdentifiers('Medtronic\nModel: A2DR01\nSerial: 998877'), {makers:['Medtronic'],models:['A2DR01'],udi:''});
assert.deepEqual(extractIdentifiers('Abbott Model: PM2272\nREF: 2088TC-52').models,['PM2272','2088TC-52']);
assert.equal(extractIdentifiers('Séjour 01234567890123').udi,'');
assert.equal(extractIdentifiers('(01)01234567890123(21)1234').udi,'01234567890123');
assert.equal(extractIdentifiers('taille 23 numéro série 12345').models.length,0);
assert.equal(extractIdentifiers('Medtronic Abbott Model: A2').makers.length,2);
console.log('6 local extraction checks passed');
