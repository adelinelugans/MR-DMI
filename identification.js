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
    ['Cochlear', /\bCochlear\b/i], ['MED-EL', /\bMED[- ]EL\b/i]
  ];
  const makers = patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const models = [...new Set(Array.from(text.matchAll(/(?:mod[eè]le|model|\bREF\b|r[eé]f[eé]rence)\s*[:#=]?\s*([A-Za-z0-9][A-Za-z0-9./-]{1,39})/gi), match => match[1]))];
  const di = text.match(/\(01\)\s*(\d{14})(?!\d)/);
  return {makers, models, udi: di ? di[1] : ''};
}
if (typeof module !== 'undefined') module.exports = {extractIdentifiers};
