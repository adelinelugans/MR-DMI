/* Local extraction only: document text is never sent to a server. */
function extractIdentifiers(text) {
  const patterns = [
    ['Medtronic', /\b(?:medtronic|MiniMed|ATS(?: Medical)?)\b/i],
    ['Boston Scientific', /\b(?:Boston Scientific|Guidant)\b/i],
    ['Abbott', /\b(?:Abbott|St\.? Jude(?: Medical)?)\b/i],
    ['Biotronik', /\bBiotronik\b/i],
    ['Sorin', /\b(?:Sorin|Microport)\b/i],
    ['LivaNova', /\bLivaNova\b/i],
    ['Nevro', /\bNevro\b/i], ['Axonics', /\bAxonics\b/i],
    ['Cochlear', /\bCochlear\b/i], ['MED-EL', /\bMED[- ]?EL\b/i],
    ['Insulet', /\b(?:Insulet|Omnipod)\b/i], ['Tandem', /\b(?:Tandem|t[: ]?slim)\b/i]
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
  for(const match of text.matchAll(/\bCI(?:612|622|624|632|512|522|532)\b/gi))if(!models.includes(match[0].toUpperCase()))models.push(match[0].toUpperCase());
  const pod=text.match(/\bOmnipod[ \t]+(5|DASH)\b/i);
  if(pod&&!models.includes('OMNIPOD '+pod[1].toUpperCase()))models.push('OMNIPOD '+pod[1].toUpperCase());
  for(const match of text.matchAll(/\b(?:PM(?:1272|2272|1172|2172|1282|2282|1182|2182)|2088TC|1944|1948)\b(?![-/])/gi))if(!models.includes(match[0].toUpperCase()))models.push(match[0].toUpperCase());
  if(/\b(?:MiniMed[ \t]*)?780G\b/i.test(text)&&!models.includes('780G'))models.push('780G');
  if(/\bt[: ]?slim[ \t]+X2\b/i.test(text)&&!models.includes('T:SLIM X2'))models.push('T:SLIM X2');
  const di = text.match(/\(01\)\s*(\d{14})(?!\d)/);
  return {makers, models, families, serials, serialCandidates, udi: di ? di[1] : ''};
}


/* Documentary summaries. They are deliberately incomplete, never an exam authorization. */
const DOCUMENTED_RULES = [
  {id:'abbott-assurity-endurity-sts',maker:'Abbott',category:'cardiac',models:['PM1272','PM2272','PM1172','PM2172','PM1282','PM2282','PM1182','PM2182'],
   technical_profile:'abbott-pacing-2022',accepted_leads:{'2088TC':[46,52,58],'1944':[46,52],'1948':[52,58]},field_t:[1.5,3],spatial_gradient_t_m:30,gradient_slew_t_m_s:200,mode:'normal',
   source:'https://manuals.eifu.abbott/content/dam/av/manuals-eifu/global/AM/en/ARTEN600159320_A.PDF',region:'Document global anglais ; applicabilité France à confirmer',reviewed:'2026-10-07',document_version:'ARTEN600159320 A — 2022-08',pages:'Pages imprimées 2–6, 8 et 15–18',
   note:'Sondes : 2088TC 46/52/58 cm, 1944 46/52 cm, 1948 52/58 cm. Mode normal, corps entier dans cette version. Champ 1,5 ou 3 T ; gradient spatial ≤30 T/m ; slew rate ≤200 T/m/s par axe. Vérifier émission RF CP et antenne autorisée, tunnel cylindrique horizontal, décubitus dorsal bras le long du corps, implantation pectorale, programmation IRM et surveillance. Pas de limite de durée dans cette version. Exclusions et contrôle cardiologique restent à vérifier ; ne pas substituer ce document à la notice locale.',complete:false},
  {id:'cochlear-emea-nucleus',maker:'Cochlear',category:'cochlear',models:['CI612','CI622','CI624','CI632','CI512','CI522','CI532'],field_t:[1.5,3],technical_profile:'cochlear-emea-2024',spatial_gradient_t_m:20,gradient_slew_t_m_s:200,
   source:'https://assets.cochlear.com/api/public/content/c34504d433b448f497b66deaf12bf54c?v=b28b3c46',region:'Europe / Moyen-Orient / Afrique ; français, lien depuis Cochlear France',reviewed:'2026-10-07',document_version:'D1872143-V3 — traduction D1846037-V5, 2024-07',pages:'14, 21–24, 28–31 et 40',
   note:'CI600 : aimant en place possible à 1,5 et 3 T, kit non requis. CI500 : à 1,5 T avec aimant, kit requis ; à 3 T, retrait chirurgical requis. Retirer les éléments externes avant la salle. Vérifier artefacts, positionnement et procédure complète. SAR à 3 T selon modèle et indication tête/corps de la console ; repère corps proche de la tête à vérifier par rapport à T1.',complete:false},
  {id:'abbott-proclaim-octrode',maker:'Abbott',category:'neuro',models:['3660','3662'],lead_model:'3186',lead_length_cm:60,field_t:[1.5],spatial_gradient_t_m:30,gradient_slew_t_m_s:200,total_active_min:30,wait_min:30,mode:'normal',
   source:'https://www.neuromodulation.abbott/int/en/healthcare-professionals/mri-support/mri-proclaim-xr5-xr7-octrode.html',region:'EMEA ; guide exact à confirmer',reviewed:'2026-10-07',
   note:'Mode IRM activé, stimulation arrêtée. Vérifier antennes, implantations et l’ensemble des restrictions du manuel.',complete:false},
  {id:'minimed-780g-external',maker:'Medtronic',category:'pump',models:['780G','MINIMED 780G'],field_t:[],external:true,
   source:'https://resources.cloud.medtronic-diabetes.com/sites/prd/files/documents/2023-01/systeme_minimed_780g_manuel_dutilisation_du_systeme_0.pdf',region:'Manuel fabricant français ; version du système et applicabilité locale à confirmer',reviewed:'2026-10-07',document_version:'MAPS 521121-048 ; ressource fabricant 2023-01',pages:'38',note:'Retirer pompe, capteur, transmetteur et lecteur avant la salle IRM. La continuité de l’administration d’insuline doit être organisée par l’équipe soignante ; vérifier le système et ses guides actuels.',complete:false},
  {id:'tandem-tslim-x2-external',maker:'Tandem',category:'pump',models:['T:SLIM X2','TSLIM X2','T SLIM X2'],field_t:[],external:true,
   source:'https://www.tandemdiabetes.com/en-GB/legal/important-safety-information/control-iq',region:'Royaume-Uni, anglais ; Control-IQ, guide France et version logicielle à confirmer',reviewed:'2026-10-07',note:'Pompe, transmetteur et capteur à retirer avant l’IRM. Vérifier les guides du système exact et organiser la continuité du traitement avec l’équipe soignante.',complete:false},
  {id:'omnipod-external',maker:'Insulet',category:'pump',models:['OMNIPOD 5','OMNIPOD DASH'],field_t:[],external:true,
   source:'https://www.omnipod.com/safety',region:'États-Unis ; guide français à confirmer',reviewed:'2026-10-07',
   note:'La source demande le retrait du Pod avant l’IRM. Prévoir avec l’équipe soignante la gestion de l’insulinothérapie et du capteur associé.',complete:false}
];
function evaluateDmiWorkflow(components,exam,inventoryComplete){
  const rows=Array.isArray(components)?components:[];
  const findings=[],sources=[],missing=[],coveredLeads=new Set();
  const system=c=>String(c.system||'1').trim();
  if(!rows.length)missing.push('Aucun dispositif renseigné');
  if(inventoryComplete!==true)missing.push('Inventaire de tous les dispositifs et composants non confirmé');
  const normal=v=>String(v||'').trim().toUpperCase();
  for(const [index,c] of [...rows.entries()].sort((a,b)=>(a[1].category==='lead')-(b[1].category==='lead'))){
    const label='Composant '+(index+1);
    if(coveredLeads.has(index))continue;
    if(!c.confirmed){missing.push(label+' : référence non confirmée sur la traçabilité');continue;}
    if(!c.maker||!c.model){missing.push(label+' : fabricant ou référence manquant');continue;}
    const rule=DOCUMENTED_RULES.find(r=>normal(r.maker)===normal(c.maker)&&r.category===c.category&&r.models.includes(normal(c.model)));
    if(!rule){missing.push(label+' : aucune condition exacte intégrée pour '+c.model);continue;}
    if(rule.accepted_leads){
      const attached=rows.map((x,i)=>({x,i})).filter(({x})=>system(x)===system(c)&&x.category==='lead');
      const generators=rows.filter(x=>system(x)===system(c)&&['cardiac','neuro'].includes(x.category));
      const valid=attached.length>0&&generators.length===1&&attached.every(({x})=>x.confirmed&&normal(x.maker)===normal(rule.maker)&&(rule.accepted_leads[normal(x.model)]||[]).includes(Number(x.length_cm)));
      if(!valid){missing.push(label+' : association non établie ; un boîtier et toutes ses sondes avec références et longueurs exactes sont requis');continue;}
      if(rows.some(x=>system(x)===system(c)&&x.category==='extension')){missing.push(label+' : extension / adaptateur, association non couverte');continue;}
      for(const {i} of attached)coveredLeads.add(i);
    }
    if(rule.lead_model){
      const leads=rows.filter(x=>system(x)===system(c)&&x.category==='lead');
      if(rows.filter(x=>system(x)===system(c)&&['cardiac','neuro'].includes(x.category)).length!==1||!leads.length||leads.some(x=>!x.confirmed||normal(x.maker)!==normal(rule.maker)||normal(x.model)!==rule.lead_model||Number(x.length_cm)!==rule.lead_length_cm)){
        missing.push(label+' : chaque électrode doit être confirmée (modèle '+rule.lead_model+', longueur '+rule.lead_length_cm+' cm)');continue;
      }
      if(rows.some(x=>system(x)===system(c)&&x.category==='extension')){missing.push(label+' : extension présente, association non couverte par cette fiche');continue;}
    }
    if(rule.lead_model)rows.forEach((x,i)=>{if(system(x)===system(c)&&x.category==='lead')coveredLeads.add(i);});
    sources.push({component:index,...rule});
    missing.push(label+' : résumé documentaire incomplet, manuel applicable et restrictions restantes à vérifier');
    if(rule.external){
      findings.push({component:label,criterion:'Dispositif externe',status:'préparation requise',detail:rule.note});
      findings.push({component:label,criterion:'Retrait pompe et éléments associés',status:!c.removed?'inconnu':c.removed==='yes'?'respecté':'non respecté',detail:'Retrait suivant la source du système exact avant entrée dans la salle'});
      findings.push({component:label,criterion:'Continuité de l’insulinothérapie',status:!exam.therapy_plan?'inconnu':exam.therapy_plan==='yes'?'respecté':'non respecté',detail:'Organisation par l’équipe soignante, sans prescription de dose par MR-DMI'});
      continue;
    }
    const field=Number(exam.field_t);
    const valid=exam.field_t!==null&&exam.field_t!==''&&Number.isFinite(field)&&field>0;
    findings.push({component:label,criterion:'Champ',status:!valid?'inconnu':rule.field_t.includes(field)?'respecté':'non respecté',detail:'Champs cités : '+rule.field_t.join(', ')+' T'});
    for(const [key,name] of [['spatial_gradient_t_m','Gradient spatial B0 (T/m)'],['gradient_slew_t_m_s','Slew rate par axe (T/m/s)'],['total_active_min','Temps actif total de la séance (min)'],['wait_min','Attente entre séances (min)']]){
      if(rule[key]===undefined)continue;
      const actual=Number(exam[key]),valid=exam[key]!==undefined&&exam[key]!==null&&exam[key]!==''&&Number.isFinite(actual)&&actual>=0;
      findings.push({component:label,criterion:name,status:!valid?'inconnu':(key==='wait_min'?actual>=rule[key]:actual<=rule[key])?'respecté':'non respecté',detail:(key==='wait_min'?'Minimum : ':'Maximum : ')+rule[key]});
    }
    if(rule.technical_profile==='abbott-pacing-2022'){
      const check=(key,criterion,accepted,detail)=>findings.push({component:label,criterion,status:!exam[key]?'inconnu':accepted.includes(exam[key])?'respecté':'non respecté',detail});
      check('bore','Tunnel et orientation',['horizontal_cylindrical'],'Tunnel cylindrique, champ horizontal');
      check('nucleus','Noyau exploré',['hydrogen'],'Hydrogène uniquement');
      check('position','Position du patient',['supine_arms_sides'],'Décubitus dorsal, bras le long du corps');
      check('implant_location','Implantation du boîtier',['pectoral'],'Région pectorale droite ou gauche');
      if(valid&&rule.field_t.includes(field)){
        check('transmit_coil','Antenne RF émettrice',field===3?['body']:['body','local_head','local_upper','local_lower'],field===3?'3 T : antenne corps intégrée émettrice':'1,5 T : corps intégré ou antenne émission/réception tête ou membre');
        // CP is explicit at 3 T and for local transmit/receive coils at 1.5 T.
        if(field===3||['local_head','local_upper','local_lower'].includes(exam.transmit_coil))check('rf_polarization','Polarisation RF',['cp'],'Émission circulaire CP');
      }else missing.push(label+' : antenne RF non évaluée, champ documenté à confirmer');
    }
    if(rule.technical_profile==='cochlear-emea-2024'){
      const result=(criterion,status,detail)=>findings.push({component:label,criterion,status,detail});
      const check=(key,criterion,accepted,detail)=>result(criterion,!exam[key]?'inconnu':accepted.includes(exam[key])?'respecté':'non respecté',detail);
      check('bore','Tunnel et orientation',['horizontal_cylindrical'],'Cylindrique horizontal');
      check('nucleus','Noyau exploré',['hydrogen'],'Hydrogène');
      check('rf_polarization','Polarisation RF',['cp'],'CP / quadrature');
      check('position','Position du patient',['supine','supine_arms_sides'],'Décubitus dorsal');
      check('external_removed','Éléments auditifs externes',['yes'],'Retrait avant entrée dans la salle');
      check('artifact_reviewed','Valeur diagnostique malgré les artefacts',['yes'],'Évaluer la zone à explorer');
      const magnet=c.magnet,knownMagnet=['present','removed'].includes(magnet),ci500=/^CI5/.test(normal(c.model));
      result('Aimant',!knownMagnet?'inconnu':ci500&&field===3&&magnet==='present'?'non respecté':'respecté',ci500&&field===3?'Retrait chirurgical avant 3 T':'Statut de l’aimant à confirmer');
      if(ci500&&field===1.5&&magnet==='present')result('Kit IRM Cochlear',!c.mri_kit?'inconnu':c.mri_kit==='yes'?'respecté':'non respecté','Kit appliqué selon son mode d’emploi');
      if(!knownMagnet)missing.push(label+' : statut de l’aimant non confirmé');
      if(magnet==='present'){
        const angle=exam.head_angle_deg,n=Number(angle),known=angle!==undefined&&angle!==null&&angle!==''&&Number.isFinite(n)&&n>=0;
        result('Alignement de la tête',!known?'inconnu':n<=15?'respecté':'non respecté','Écart maximal 15° de l’axe Z');
      }
      if(valid&&rule.field_t.includes(field)){
        if(field===1.5)check('mode','Exposition RF à 1,5 T',['normal'],'Mode normal autorisé pour ces modèles dans cette version');
        else{
          const nearLimit=['CI612','CI512'].includes(normal(c.model))?1.8:2;
          let key,limit;
          if(exam.head_sar_reported==='yes'){key='head_sar_wkg';limit=nearLimit;}
          else if(exam.head_sar_reported==='no'){
            key='body_sar_wkg';
            if(exam.landmark==='far')limit=2;
            else if(exam.landmark==='near_below_t1')limit=nearLimit;
          }
          if(limit===undefined)result('SAR / TAS à 3 T','inconnu','Confirmer affichage SAR tête ou repère corps (>40 cm ; sinon inférieur à T1 et ≤40 cm)');
          else{
            const n=Number(exam[key]),known=exam[key]!==undefined&&exam[key]!==null&&exam[key]!==''&&Number.isFinite(n)&&n>=0;
            result(key==='head_sar_wkg'?'SAR moyen tête':'SAR moyen corps entier',!known?'inconnu':n<=limit?'respecté':'non respecté','Maximum '+limit+' W/kg ; prévu : '+(known?n:'inconnu')+' W/kg ; contrôler chaque séquence');
          }
        }
      }
    }
    if(rule.mode)findings.push({component:label,criterion:'Mode de fonctionnement',status:!exam.mode?'inconnu':exam.mode===rule.mode?'respecté':'non respecté',detail:'Mode normal cité par la source'});
  }
  for(const f of findings)if(f.status==='inconnu')missing.push(f.component+' : '+f.criterion+' non confirmé');
  const blocked=findings.some(x=>x.status==='non respecté');
  return {status:blocked?'Paramètre non conforme au résumé sélectionné — transmettre au service IRM':'Évaluation incomplète — conditions IRM non validées',blocked,findings,sources,missing:[...new Set(missing)]};
}
function dmiRoleTasks(role,components){
  const categories=new Set(components.map(c=>c.category));
  const tasks=role==='secretary'?['Récupérer la carte complète ou la traçabilité avec les références de chaque composant.','Transmettre le dossier au service IRM pour les modalités et la programmation du rendez-vous.']:role==='prescriber'?['Préciser l’indication clinique et la région demandée dans la prescription.','Joindre les références des dispositifs et contacter le service IRM si elles sont incomplètes.']:['Confirmer chaque référence et la notice IRM applicable au pays et à la version du système.','Contrôler toutes les conditions du système complet et les autres dispositifs présents.'];
  if(categories.has('cardiac'))tasks.push('Système cardiaque : récupérer les références du boîtier et de chaque sonde ; coordonner le contrôle et la programmation avec l’équipe référente.');
  if(categories.has('lead')&&!categories.has('cardiac')&&!categories.has('neuro'))tasks.push('Sonde ou électrode seule : identifier le système auquel elle appartient et obtenir la référence du générateur.');
  if(categories.has('cochlear'))tasks.push('Implant auditif : récupérer le modèle implanté de chaque côté ; vérifier la gestion de l’aimant et les accessoires dans le guide exact.');
  if(categories.has('neuro')||categories.has('extension'))tasks.push('Neurostimulation : inventorier générateur, électrodes, extensions et accessoires ; coordonner les contrôles et la programmation requis.');
  if(categories.has('pump'))tasks.push('Pompe : préciser si elle est externe ou implantée, identifier les composants associés et faire organiser la continuité du traitement par l’équipe soignante.');
  if(categories.has('other'))tasks.push('Autre dispositif : obtenir fabricant, référence exacte et notice, sans attribuer une compatibilité à partir de la seule famille.');
  return tasks;
}

// Persist machine characteristics only, through an explicit allowlist.
function normalizeMachineProfiles(saved){
  if(!Array.isArray(saved))return [];
  return saved.slice(0,4).filter(p=>p&&typeof p.centre==='string'&&typeof p.name==='string'&&typeof p.reference==='string').map(p=>({centre:p.centre.slice(0,80),name:p.name.slice(0,80),reference:p.reference.slice(0,160),saved_at:typeof p.saved_at==='string'?p.saved_at.slice(0,40):'',values:Object.fromEntries(['field','bore','nucleus','gradient','slew'].map(key=>[key,typeof p.values?.[key]==='string'?p.values[key].slice(0,80):'']))}));
}

if (typeof module !== 'undefined') module.exports = {extractIdentifiers,evaluateDmiWorkflow,dmiRoleTasks,DOCUMENTED_RULES,normalizeMachineProfiles};
