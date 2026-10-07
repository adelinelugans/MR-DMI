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
  const di = text.match(/\(01\)\s*(\d{14})(?!\d)/);
  return {makers, models, families, serials, serialCandidates, udi: di ? di[1] : ''};
}
if (typeof module !== 'undefined') module.exports = {extractIdentifiers};

