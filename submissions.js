/* Merges brother-uploaded resources into the site's static data.
 *
 * resources.js and nav-data.js are generated at build time and hold the 3,127
 * original links. Uploads live in Supabase instead, so this fetches them and
 * folds them into the same structures before anything renders. New courses and
 * professors are created on the fly.
 *
 * If Supabase is unreachable the promise still resolves and the site renders
 * the static data — uploads simply won't show. It never blocks the page.
 */
(function () {
  var READY = null;

  function slug(s) {
    return String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function deptOf(course) {
    var m = /^\s*([A-Za-z]{2,5})/.exec(course || '');
    return m ? m[1].toUpperCase() : '';
  }

  // A–G, H–O, P–Z — matches how the three class pages are split.
  function sectionFor(code) {
    var c = (code || '')[0] || 'A';
    if (c <= 'G') return 'ag';
    if (c <= 'O') return 'ho';
    return 'pz';
  }

  function publicUrl(path) {
    return window.SUPABASE_URL + '/storage/v1/object/public/study-files/' +
           String(path).split('/').map(encodeURIComponent).join('/');
  }

  function merge(rows) {
    var NAV = window.NAV_DATA, RES = window.RESOURCES;
    if (!NAV || !rows || !rows.length) return { added: 0, newProfs: 0, newCourses: 0 };
    var stat = { added: 0, newProfs: 0, newCourses: 0 };

    rows.forEach(function (r) {
      var code = deptOf(r.course);
      if (!code) return;
      var sec = sectionFor(code);
      if (!NAV[sec]) return;

      var depts = NAV[sec].depts;
      var dept = depts.filter(function (d) { return d.code === code; })[0];
      if (!dept) {
        dept = { code: code, name: code, id: code, courses: [] };
        depts.push(dept);
        depts.sort(function (a, b) { return a.code < b.code ? -1 : 1; });
      }

      var cname = String(r.course).trim();
      var cid = slug(cname);
      var course = dept.courses.filter(function (c) { return c.id === cid; })[0];
      if (!course) {
        course = { name: cname, id: cid, profs: [] };
        dept.courses.push(course);
        dept.courses.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
        stat.newCourses++;
      }

      var pname = String(r.professor).trim();
      var pid = cid + '-' + slug(pname);
      var prof = course.profs.filter(function (p) { return p.id === pid; })[0];
      if (!prof) {
        prof = { name: pname, id: pid, count: 0 };
        course.profs.push(prof);
        stat.newProfs++;
      }

      var link = [String(r.title), publicUrl(r.path)];
      link.uploaded = true;

      if (RES) {
        if (!RES[pid]) {
          RES[pid] = { d: code, dn: dept.name, c: cname, ci: cid, p: pname, s: sec, l: [] };
        }
        RES[pid].l.push(link);
        prof.count = RES[pid].l.length;
      } else {
        prof.count++;
      }
      stat.added++;
    });

    return stat;
  }

  function load() {
    if (READY) return READY;

    READY = new Promise(function (resolve) {
      if (!window.SUPABASE_URL || !window.SUPABASE_KEY) return resolve(null);

      var url = window.SUPABASE_URL +
        '/rest/v1/submissions?select=course,professor,title,kind,path,created_at&order=created_at.asc';

      var done = false;
      var give = function (v) { if (!done) { done = true; resolve(v); } };

      // Never let a slow backend hold up the page.
      setTimeout(function () { give(null); }, 6000);

      fetch(url, { headers: { apikey: window.SUPABASE_KEY,
                              Authorization: 'Bearer ' + window.SUPABASE_KEY } })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) { give(merge(rows)); })
        .catch(function (e) { console.warn('uploads unavailable:', e); give(null); });
    });

    return READY;
  }

  window.whenSubmissionsReady = function (cb) { load().then(cb); };
})();
