/* Renders one professor / course / department view from window.RESOURCES.
   URL forms:  resource.html?p=ANTH-1001-Tague
               resource.html?c=ANTH-1001
               resource.html?d=ANTH&s=ag                                    */
(function () {
  window.whenSubmissionsReady(function () {

  var R = window.RESOURCES, NAV = window.NAV_DATA, root = document.getElementById('rv-root');
  if (!R || !root) return;

  var q = new URLSearchParams(location.search);
  var pid = q.get('p'), cid = q.get('c'), did = q.get('d'), sec = q.get('s');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function iconFor(url) {
    var m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(url);
    var e = m ? m[1].toLowerCase() : '';
    if (e === 'pdf') return '📕';
    if (e === 'doc' || e === 'docx') return '📘';
    if (e === 'ppt' || e === 'pptx') return '📙';
    if (e === 'xls' || e === 'xlsx') return '📗';
    return '📄';
  }

  function crumbs(parts) {
    var bar = el('div', 'rv-crumbs');
    parts.forEach(function (p, i) {
      if (i) bar.appendChild(el('span', 'rv-crumb-sep', '›'));
      if (p.href) {
        var a = el('a', 'rv-crumb'); a.href = p.href; a.textContent = p.label;
        bar.appendChild(a);
      } else {
        bar.appendChild(el('span', 'rv-crumb rv-crumb-now', p.label));
      }
    });
    return bar;
  }

  function fileList(links) {
    var ul = el('ul', 'rv-files');
    links.forEach(function (l) {
      var li = el('li');
      var a = el('a', 'rv-file');
      a.href = l[1];
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(el('span', 'rv-file-icon', iconFor(l[1])));
      a.appendChild(el('span', 'rv-file-name', l[0]));
      a.appendChild(el('span', 'rv-file-open', 'Open ↗'));
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  function notFound(what) {
    root.appendChild(el('h1', 'rv-title', 'Not found'));
    root.appendChild(el('p', 'rv-sub', 'Nothing here for “' + what + '”. Use the menu above.'));
  }

  /* ---------- professor view ---------- */
  if (pid) {
    var r = R[pid];
    if (!r) return notFound(pid);
    document.title = r.p + ' — ' + r.c + ' | ΣΦΕ Study Resources';
    root.appendChild(crumbs([
      { label: NAV[r.s].label, href: 'classes-' + r.s + '.html' },
      { label: r.d + ' — ' + r.dn, href: 'resource.html?d=' + r.d + '&s=' + r.s },
      { label: r.c, href: 'resource.html?c=' + encodeURIComponent(r.ci) },
      { label: r.p }
    ]));
    root.appendChild(el('h1', 'rv-title', r.p));
    root.appendChild(el('p', 'rv-sub', r.c + ' · ' + r.dn));
    root.appendChild(fileList(r.l));

    // other professors teaching the same course
    var siblings = Object.keys(R).filter(function (k) { return R[k].ci === r.ci && k !== pid; });
    if (siblings.length) {
      root.appendChild(el('h2', 'rv-section', 'Other professors for ' + r.c));
      var row = el('div', 'rv-chips');
      siblings.forEach(function (k) {
        var a = el('a', 'rv-chip');
        a.href = 'resource.html?p=' + encodeURIComponent(k);
        a.appendChild(el('span', null, R[k].p));
        row.appendChild(a);
      });
      root.appendChild(row);
    }
    return;
  }

  /* ---------- course view ---------- */
  if (cid) {
    var profs = Object.keys(R).filter(function (k) { return R[k].ci === cid; });
    if (!profs.length) return notFound(cid);
    var f = R[profs[0]];
    document.title = f.c + ' | ΣΦΕ Study Resources';
    root.appendChild(crumbs([
      { label: NAV[f.s].label, href: 'classes-' + f.s + '.html' },
      { label: f.d + ' — ' + f.dn, href: 'resource.html?d=' + f.d + '&s=' + f.s },
      { label: f.c }
    ]));
    root.appendChild(el('h1', 'rv-title', f.c));
    root.appendChild(el('p', 'rv-sub', f.dn + ' · ' + profs.length +
      ' professor' + (profs.length === 1 ? '' : 's')));
    profs.forEach(function (k) {
      var card = el('div', 'rv-card');
      var head = el('a', 'rv-card-head');
      head.href = 'resource.html?p=' + encodeURIComponent(k);
      head.appendChild(el('span', 'rv-card-name', R[k].p));
      card.appendChild(head);
      card.appendChild(fileList(R[k].l));
      root.appendChild(card);
    });
    return;
  }

  /* ---------- department view ---------- */
  if (did && sec && NAV[sec]) {
    var dept = NAV[sec].depts.filter(function (d) { return d.code === did; })[0];
    if (!dept) return notFound(did);
    document.title = dept.code + ' | ΣΦΕ Study Resources';
    root.appendChild(crumbs([
      { label: NAV[sec].label, href: 'classes-' + sec + '.html' },
      { label: dept.code + ' — ' + dept.name }
    ]));
    root.appendChild(el('h1', 'rv-title', dept.code));
    root.appendChild(el('p', 'rv-sub', dept.name + ' · ' + dept.courses.length +
      ' course' + (dept.courses.length === 1 ? '' : 's')));
    dept.courses.forEach(function (c) {
      var card = el('div', 'rv-card');
      var head = el('a', 'rv-card-head');
      head.href = 'resource.html?c=' + encodeURIComponent(c.id);
      head.appendChild(el('span', 'rv-card-name', c.name));
      card.appendChild(head);
      var row = el('div', 'rv-chips');
      c.profs.forEach(function (p) {
        var a = el('a', 'rv-chip');
        a.href = 'resource.html?p=' + encodeURIComponent(p.id);
        a.appendChild(el('span', null, p.name));
        row.appendChild(a);
      });
      card.appendChild(row);
      root.appendChild(card);
    });
    return;
  }

  notFound('no selection');

  });
})();
