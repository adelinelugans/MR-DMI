/* Local extraction only: document text is never sent to a server. */
function extractIdentifiers(text) {
  const patterns = [
    ['Medtronic', /\b(?:medtronic|ATS(?: Medical)?)\b/i],
    ['Boston Scientific', /\b(?:Boston Scientific|Guidant)\b/i],
    ['Abbott', /\b(?:Abbott|St\.? Jude(?: Medical)?)\b/i],
    ['Biotronik', /\bBiotronik\b/i],
    ['Sorin', /\b(?:Sorin|Microport)\b/i],
    ['LivaNova', /\bLivaNova\b/i],
    ['Nevro', /\bNevro\b/i], ['Axonics', /\bAxonics\b/i],
    ['Cochlear', /\bCochlear\b/i], ['MED-EL', /\bMED[- ]?EL\b/i],
    ['Insulet', /\b(?:Insulet|Omnipod)\b/i]
  ];
  const makers = patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const models = [...new Set(Array.from(text.matchAll(/(?:mod[eè]le|model|\bREF\b|r[eé]f[eé]rence)\s*[:#=]?\s*([A-Za-z0-9][A-Za-z0-9./-]{1,39})/gi), match => match[1]))].filter(value => /\d/.test(value));
  // A named family is evidence, not an exact catalogue reference.
  const families = /\btendril[ \t\n]+sts\b/i.test(text) ? ['TENDRIL STS'] : [];
  if (families.length) {
    const truncated = models.indexOf('TENDRIL');
    if (truncated !== -1) models.splice(truncated, 1);
    if (!models.includes('TENDRIL STS')) models.push('TENDRIL STS');
  }
  const serials = [...new Set(Array.from(text.matchAll(/(?:n[°ºo]?\s*(?:de\s*)?s[eé]rie|serial(?:\s*(?:number|no\.?))?)\s*[:#=]?\s*([A-Z0-9][A-Z0-9-]{3,29})/gi), m => m[1]))];
  const serialCandidates = [...new Set(Array.from(text.matchAll(/^[ \t]*([A-Z]{2,5}\d{4,12})[ \t]*$/gm), m => m[1]))].filter(value => !models.includes(value) && !serials.includes(value));
  for(const match of text.matchAll(/\bCI(?:612|622|624|632)\b/gi))if(!models.includes(match[0].toUpperCase()))models.push(match[0].toUpperCase());
  const pod=text.match(/\bOmnipod[ \t]+(5|DASH)\b/i);
  if(pod&&!models.includes('OMNIPOD '+pod[1].toUpperCase()))models.push('OMNIPOD '+pod[1].toUpperCase());
  const di = text.match(/\(01\)\s*(\d{14})(?!\d)/);
  return {makers, models, families, serials, serialCandidates, udi: di ? di[1] : ''};
}


/* Documentary summaries. They are deliberately incomplete, never an exam authorization. */
const DOCUMENTED_RULES = [
  {id:'cochlear-ci600',maker:'Cochlear',category:'cochlear',models:['CI612','CI622','CI624','CI632'],field_t:[1.5,3],
   source:'https://www.cochlear.com/global/en/mri/mri-nucleus',region:'International ; notice du pays requise',reviewed:'2026-10-07',
   note:'Aimant en place pour les modèles cités ; consulter le guide national pour toutes les autres conditions.',complete:false},
  {id:'abbott-proclaim-octrode',maker:'Abbott',category:'neuro',models:['3660','3662'],lead_model:'3186',lead_length_cm:60,field_t:[1.5],spatial_gradient_t_m:30,gradient_slew_t_m_s:200,total_active_min:30,wait_min:30,mode:'normal',
   source:'https://www.neuromodulation.abbott/int/en/healthcare-professionals/mri-support/mri-proclaim-xr5-xr7-octrode.html',region:'EMEA ; guide exact à confirmer',reviewed:'2026-10-07',
   note:'Mode IRM activé, stimulation arrêtée. Vérifier antennes, implantations et l’ensemble des restrictions du manuel.',complete:false},
  {id:'omnipod-external',maker:'Insulet',category:'pump',models:['OMNIPOD 5','OMNIPOD DASH'],field_t:[],external:true,
   source:'https://www.omnipod.com/safety',region:'États-Unis ; guide français à confirmer',reviewed:'2026-10-07',
   note:'La source demande le retrait du Pod avant l’IRM. Prévoir avec l’équipe soignante la gestion de l’insulinothérapie et du capteur associé.',complete:false}
];
function evaluateDmiWorkflow(components,exam,inventoryComplete){
  const rows=Array.isArray(components)?components:[];
  const findings=[],sources=[],missing=[];
  if(!rows.length)missing.push('Aucun dispositif renseigné');
  if(inventoryComplete!==true)missing.push('Inventaire de tous les dispositifs et composants non confirmé');
  const normal=v=>String(v||'').trim().toUpperCase();
  for(const [index,c] of rows.entries()){
    const label='Composant '+(index+1);
    if(!c.confirmed){missing.push(label+' : référence non confirmée sur la traçabilité');continue;}
    if(!c.maker||!c.model){missing.push(label+' : fabricant ou référence manquant');continue;}
    const rule=DOCUMENTED_RULES.find(r=>normal(r.maker)===normal(c.maker)&&r.category===c.category&&r.models.includes(normal(c.model)));
    if(!rule){missing.push(label+' : aucune condition exacte intégrée pour '+c.model);continue;}
    if(rule.lead_model){
      const leads=rows.filter(x=>x.category==='lead');
      if(!leads.length||leads.some(x=>!x.confirmed||normal(x.maker)!==normal(rule.maker)||normal(x.model)!==rule.lead_model||Number(x.length_cm)!==rule.lead_length_cm)){
        missing.push(label+' : chaque électrode doit être confirmée (modèle '+rule.lead_model+', longueur '+rule.lead_length_cm+' cm)');continue;
      }
      if(rows.some(x=>x.category==='extension')){missing.push(label+' : extension présente, association non couverte par cette fiche');continue;}
    }
    sources.push({component:index,...rule});
    missing.push(label+' : résumé documentaire incomplet, manuel applicable et restrictions restantes à vérifier');
    if(rule.external){findings.push({component:label,criterion:'Dispositif externe',status:'préparation requise',detail:rule.note});continue;}
    const field=Number(exam.field_t);
    const valid=exam.field_t!==null&&exam.field_t!==''&&Number.isFinite(field)&&field>0;
    findings.push({component:label,criterion:'Champ',status:!valid?'inconnu':rule.field_t.includes(field)?'respecté':'non respecté',detail:'Champs cités : '+rule.field_t.join(', ')+' T'});
    for(const [key,name] of [['spatial_gradient_t_m','Gradient spatial B0 (T/m)'],['gradient_slew_t_m_s','Slew rate par axe (T/m/s)'],['total_active_min','Temps actif total de la séance (min)'],['wait_min','Attente entre séances (min)']]){
      if(rule[key]===undefined)continue;
      const actual=Number(exam[key]),valid=exam[key]!==undefined&&exam[key]!==null&&exam[key]!==''&&Number.isFinite(actual)&&actual>=0;
      findings.push({component:label,criterion:name,status:!valid?'inconnu':(key==='wait_min'?actual>=rule[key]:actual<=rule[key])?'respecté':'non respecté',detail:(key==='wait_min'?'Minimum : ':'Maximum : ')+rule[key]});
    }
    if(rule.mode)findings.push({component:label,criterion:'Mode de fonctionnement',status:!exam.mode?'inconnu':exam.mode===rule.mode?'respecté':'non respecté',detail:'Mode normal cité par la source'});
  }
  const blocked=findings.some(x=>x.status==='non respecté');
  return {status:blocked?'Paramètre non conforme au résumé sélectionné — transmettre au service IRM':'Évaluation incomplète — conditions IRM non validées',blocked,findings,sources,missing:[...new Set(missing)]};
}
function dmiRoleTasks(role,components){
  const categories=new Set(components.map(c=>c.category));
  const tasks=role==='secretary'?['Récupérer la carte complète ou la traçabilité avec les références de chaque composant.','Transmettre le dossier au service IRM pour les modalités et la programmation du rendez-vous.']:role==='prescriber'?['Préciser l’indication clinique et la région demandée dans la prescription.','Joindre les références des dispositifs et contacter le service IRM si elles sont incomplètes.']:['Confirmer chaque référence et la notice IRM applicable au pays et à la version du système.','Contrôler toutes les conditions du système complet et les autres dispositifs présents.'];
  if(categories.has('cardiac')||categories.has('lead'))tasks.push('Système cardiaque : récupérer les références du boîtier et de chaque sonde ; coordonner le contrôle et la programmation avec l’équipe référente.');
  if(categories.has('cochlear'))tasks.push('Implant auditif : récupérer le modèle implanté de chaque côté ; vérifier la gestion de l’aimant et les accessoires dans le guide exact.');
  if(categories.has('neuro')||categories.has('extension'))tasks.push('Neurostimulation : inventorier générateur, électrodes, extensions et accessoires ; coordonner les contrôles et la programmation requis.');
  if(categories.has('pump'))tasks.push('Pompe : préciser si elle est externe ou implantée, identifier les composants associés et faire organiser la continuité du traitement par l’équipe soignante.');
  if(categories.has('other'))tasks.push('Autre dispositif : obtenir fabricant, référence exacte et notice, sans attribuer une compatibilité à partir de la seule famille.');
  return tasks;
}

if (typeof module !== 'undefined') module.exports = {extractIdentifiers,evaluateDmiWorkflow,dmiRoleTasks,DOCUMENTED_RULES};
