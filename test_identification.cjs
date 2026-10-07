const assert = require('node:assert/strict');
const {extractIdentifiers} = require('./identification.js');
assert.deepEqual(extractIdentifiers('Medtronic\nModel: A2DR01\nSerial: 998877'), {makers:['Medtronic'],models:['A2DR01'],families:[],serials:['998877'],udi:''});
assert.deepEqual(extractIdentifiers('Abbott Model: PM2272\nREF: 2088TC-52').models,['PM2272','2088TC-52']);
assert.equal(extractIdentifiers('Séjour 01234567890123').udi,'');
assert.equal(extractIdentifiers('(01)01234567890123(21)1234').udi,'01234567890123');
assert.equal(extractIdentifiers('taille 23 numéro série 12345').models.length,0);
assert.equal(extractIdentifiers('Medtronic Abbott Model: A2').makers.length,2);
console.log('6 local extraction checks passed');

const card=extractIdentifiers('Abbott Modèle TENDRIL STS\\nN° de série EEL414832\\nAbbott Modèle TENDRIL STS\\nN° de série EEM330008');
assert.deepEqual(card.models,['TENDRIL STS']);
assert.deepEqual(card.serials,['EEL414832','EEM330008']);
assert.deepEqual(extractIdentifiers('Omnipod Model: 5').makers,['Insulet']);
assert.deepEqual(extractIdentifiers('MEDel').makers,['MED-EL']);

