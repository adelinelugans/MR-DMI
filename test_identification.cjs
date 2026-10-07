const assert = require('node:assert/strict');
const {extractIdentifiers} = require('./identification.js');
assert.deepEqual(extractIdentifiers('Medtronic\nModel: A2DR01\nSerial: 998877'), {makers:['Medtronic'],models:['A2DR01'],families:[],serials:['998877'],serialCandidates:[],udi:''});
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


assert.deepEqual(extractIdentifiers('Modèle\nli').models,[]);
assert.deepEqual(extractIdentifiers('N° de série\n|\nEEL414832').serialCandidates,['EEL414832']);

const {evaluateDmiWorkflow,dmiRoleTasks}=require('./identification.js');
const implant={maker:'Cochlear',model:'CI632',category:'cochlear',confirmed:true};
assert.equal(evaluateDmiWorkflow([implant],{field_t:3},true).blocked,false);
assert.match(evaluateDmiWorkflow([implant],{field_t:3},true).status,/incomplète/);
assert.equal(evaluateDmiWorkflow([implant],{field_t:.55},true).blocked,true);
assert.equal(evaluateDmiWorkflow([{...implant,confirmed:false}],{field_t:3},true).sources.length,0);
assert.equal(evaluateDmiWorkflow([{...implant,model:'CI999'}],{field_t:3},true).sources.length,0);
assert.ok(evaluateDmiWorkflow([implant],{},false).missing.some(x=>/Inventaire/.test(x)));
const generator={maker:'Abbott',model:'3660',category:'neuro',confirmed:true};
const lead={maker:'Abbott',model:'3186',category:'lead',length_cm:60,confirmed:true};
assert.equal(evaluateDmiWorkflow([generator],{field_t:1.5},true).sources.length,0);
assert.equal(evaluateDmiWorkflow([generator,{...lead,length_cm:90}],{field_t:1.5},true).sources.length,0);
assert.equal(evaluateDmiWorkflow([generator,lead],{field_t:3},true).blocked,true);
assert.equal(evaluateDmiWorkflow([generator,lead],{field_t:1.5,total_active_min:31},true).blocked,true);
assert.equal(evaluateDmiWorkflow([generator,lead],{field_t:1.5,total_active_min:30,wait_min:29},true).blocked,true);
assert.equal(evaluateDmiWorkflow([generator,lead,{...lead,category:'extension'}],{field_t:1.5},true).sources.length,0);
assert.equal(evaluateDmiWorkflow([{maker:'Insulet',model:'OMNIPOD 5',category:'pump',confirmed:true}],{},true).findings[0].status,'préparation requise');
assert.ok(dmiRoleTasks('secretary',[implant]).some(x=>/Transmettre/.test(x)));
assert.ok(dmiRoleTasks('prescriber',[implant]).some(x=>/indication/.test(x)));
console.log('16 contrôles de parcours, composants, sources et limites documentaires réussis');
