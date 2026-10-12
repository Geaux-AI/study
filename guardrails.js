/* Screens the SigEp professor rating form for prompt injections (code) and
 * harsh language (slurs, hate, threats, profanity, insults). A blocked rating
 * is not saved, and an alert goes to Slack (#claude-agents) through the relay.
 *
 * The word lists are base64 so they don't sit in the page source in plain
 * text. To change them, decode LISTS, edit, and re-encode.
 */
(function () {
  var LISTS = JSON.parse(atob('eyJzbHVycyI6WyJuaWdnZXIiLCJuaWdnZXJzIiwibmlnZ2EiLCJuaWdnYXMiLCJuaWdnYWgiLCJjb29uIiwiY29vbnMiLCJqaWdhYm9vIiwiamlnZ2Fib28iLCJwb3JjaG1vbmtleSIsImp1bmdsZWJ1bm55Iiwic2FtYm8iLCJkYXJraWUiLCJkYXJreSIsImNoaW5rIiwiY2hpbmtzIiwiY2hpbmFtYW4iLCJnb29rIiwiZ29va3MiLCJ6aXBwZXJoZWFkIiwiamFwIiwiamFwcyIsInNwaWMiLCJzcGljcyIsInNwaWNrIiwid2V0YmFjayIsIndldGJhY2tzIiwiYmVhbmVyIiwiYmVhbmVycyIsImtpa2UiLCJraWtlcyIsImt5a2UiLCJoZWViIiwiaHltaWUiLCJyYWdoZWFkIiwicmFnaGVhZHMiLCJ0b3dlbGhlYWQiLCJ0b3dlbGhlYWRzIiwic2FuZG5pZ2dlciIsImNhbWVsam9ja2V5IiwicGFraSIsInBha2lzIiwicmVkc2tpbiIsInJlZHNraW5zIiwic3F1YXciLCJpbmp1biIsIndvcCIsIndvcHMiLCJkYWdvIiwiaG9ua3kiLCJob25rZXkiLCJmYWciLCJmYWdzIiwiZmFnZ290IiwiZmFnZ290cyIsImZhZ290IiwiZHlrZSIsImR5a2VzIiwidHJhbm55IiwidHJhbm5pZXMiLCJzaGVtYWxlIiwicmV0YXJkIiwicmV0YXJkcyIsInJldGFyZGVkIiwidGFyZCIsInNwYXoiXSwiaGF0ZSI6WyJoZWlsIGhpdGxlciIsInNpZWcgaGVpbCIsIndoaXRlIHBvd2VyIiwid2hpdGUgcHJpZGUiLCJtYXN0ZXIgcmFjZSIsInJhY2Ugd2FyIiwiaGl0bGVyIHdhcyByaWdodCIsImdhcyB0aGUgamV3cyIsImtpbGwgYWxsIiwiZ28gYmFjayB0byB5b3VyIGNvdW50cnkiLCJnbyBiYWNrIHRvIHRoZWlyIGNvdW50cnkiLCJnbyBiYWNrIHdoZXJlIHlvdSBjYW1lIGZyb20iXSwidGhyZWF0cyI6WyJraWxsICh5b3VyfHVyKXNlbGYiLCJreXMiLCIoaXxpbXxpIGFtfGlsbHxpIHdpbGx8Z29ubmF8Z29pbmcgdG8pIChraWxsfHNob290fHN0YWJ8aHVydHxtdXJkZXIpIiwic2hvb3QgKHVwfHRoaXN8dGhlKSAoc2Nob29sfGNsYXNzfGNhbXB1c3xidWlsZGluZ3xwbGFjZSkiLCJib21iICh0aGV8dGhpcykiLCJzaG91bGQgKGRpZXxiZSBzaG90fGJlIGtpbGxlZCkiLCJob3BlIChoZXxzaGV8dGhleXx5b3UpIGRpZSIsImRpZSBpbiBhIGZpcmUiXSwiaGFyc2giOlsiZnVjayIsImZ1Y2tzIiwiZnVja2VkIiwiZnVja2luZyIsImZ1Y2tlciIsImZ1Y2tlcnMiLCJtb3RoZXJmdWNrZXIiLCJzaGl0Iiwic2hpdHMiLCJzaGl0dHkiLCJidWxsc2hpdCIsImJpdGNoIiwiYml0Y2hlcyIsImFzc2hvbGUiLCJhc3Nob2xlcyIsImN1bnQiLCJjdW50cyIsImRpY2toZWFkIiwiZHVtYmFzcyIsImphY2thc3MiLCJiYXN0YXJkIiwiYmFzdGFyZHMiLCJ3aG9yZSIsIndob3JlcyIsInNsdXQiLCJzbHV0cyIsInN0ZnUiLCJpZGlvdCIsImlkaW90cyIsIm1vcm9uIiwibW9yb25zIiwiaW1iZWNpbGUiLCJyYXBlIiwicmFwZWQiLCJyYXBpc3QiLCJtb2xlc3QiLCJtb2xlc3RlZCIsInBvcm4iLCJudWRlcyIsInNleHkiXX0='));

  // Undo common disguises: accents, leetspeak, and spacing like "n.i.g".
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a')
      .replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z\s']/g, ' ').replace(/'/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function wordsRe(list) {
    return new RegExp('\\b(' + list.join('|') + ')\\b', 'i');
  }
  var SLUR_RE   = wordsRe(LISTS.slurs);
  var HARSH_RE  = wordsRe(LISTS.harsh);
  var HATE_RE   = new RegExp('\\b(' + LISTS.hate.join('|') + ')\\b', 'i');
  var THREAT_RE = new RegExp('\\b(' + LISTS.threats.join('|') + ')\\b', 'i');
  // Letters-only check only for longer slurs, so "spicy" or "raccoon" never trip it.
  var LONG_SLURS = LISTS.slurs.filter(function (w) { return w.length >= 5; });

  var GROUPS = '(black people|blacks|white people|whites|asians|asian people|mexicans|latinos|hispanics|' +
    'arabs|muslims|christians|jews|jewish people|gay people|gays|lesbians|trans people|transgender people|' +
    'immigrants|refugees|women|men|girls|disabled people|poor people|indians|africans|chinese people)';
  var TRAITS = '(stupid|inferior|lazy|dumb|evil|worthless|criminals?|animals|subhuman|disgusting|the problem|' +
    'not as smart|less than)';
  var BIAS_RE = new RegExp('\\b' + GROUPS + '\\b[^.?!]{0,20}\\b(are|is)\\b[^.?!]{0,15}\\b' + TRAITS + '\\b', 'i');
  var AIMED_RE = /\b(he|she|they|professor|prof|teacher|instructor|ta|dr|mr|mrs|ms)\b[^.?!]{0,20}\b(is|are)\b[^.?!]{0,10}\b(stupid|dumb|ugly|fat|retarded)\b/i;

  var CODE_RE = /<\s*(script|iframe|img|svg|object|embed)|\bon\w+\s*=|javascript:|document\.(cookie|write)/i;
  // Plain-text attempts to hijack an AI that might read this later.
  var PROMPT_RE = /\b(ignore|disregard|forget|override)\b[^.?!]{0,30}\b(previous|prior|above|all|your|these|those)\b[^.?!]{0,15}\b(instructions?|prompts?)\b|\bsystem prompt\b|\bjailbreak\b|\bdeveloper mode\b|\bdo anything now\b/i;

  var MESSAGES = {
    code:     "That looks like code, which isn't allowed here.",
    prompt:   "That looks like an attempt to give instructions to an AI, which isn't allowed here.",
    hate:     "This can't be posted because it includes racist or hateful language.",
    threat:   "This can't be posted because it includes a threat or violent language.",
    harsh:    "This can't be posted because it includes offensive language. Reword it and try again."
  };

  // Returns null if the text is fine, or { category, message }.
  function check(text) {
    var raw = String(text || '');
    if (!raw.trim()) return null;
    var cat = null;
    var n = normalize(raw), squashed = n.replace(/[^a-z]/g, '');
    if (CODE_RE.test(raw)) cat = 'code';
    else if (PROMPT_RE.test(raw)) cat = 'prompt';
    else if (SLUR_RE.test(n) || HATE_RE.test(n) || BIAS_RE.test(n) || /\b(1488|14 ?words|kkk)\b/i.test(raw) ||
             LONG_SLURS.some(function (w) { return squashed.indexOf(w) !== -1; })) cat = 'hate';
    else if (THREAT_RE.test(n)) cat = 'threat';
    else if (HARSH_RE.test(n) || AIMED_RE.test(n)) cat = 'harsh';
    return cat ? { category: cat, message: MESSAGES[cat] } : null;
  }

  // Checks several named fields; returns the first problem with its field name.
  window.screenFields = function (fields) {
    for (var name in fields) {
      var r = check(fields[name]);
      if (r) { r.field = name; return r; }
    }
    return null;
  };

  // Slack alert through the relay. Capped per browser so one person testing
  // the filter can't flood the channel; the rating is blocked either way.
  var RATE_KEY = 'testbank.alertTimes', MAX_ALERTS = 5, WINDOW_MS = 10 * 60 * 1000;
  window.sendAlert = function (type, detail) {
    if (!window.ALERT_RELAY_URL) return;
    try {
      var now = Date.now();
      var times = (JSON.parse(localStorage.getItem(RATE_KEY)) || []).filter(function (t) { return now - t < WINDOW_MS; });
      if (times.length >= MAX_ALERTS) return;
      times.push(now);
      localStorage.setItem(RATE_KEY, JSON.stringify(times));
    } catch (_) { /* storage blocked: still send */ }
    fetch(window.ALERT_RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'Test Bank', type: type, detail: String(detail).slice(0, 500),
                             time: new Date().toISOString() })
    }).catch(function () { /* best effort; never bother the person submitting */ });
  };
})();
