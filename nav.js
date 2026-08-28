/* Cascading class navigation + global search.
   Reads window.NAV_DATA (nav-data.js). Rebuilds the <nav> bar on every page. */
(function () {
  window.whenSubmissionsReady(function () {

  var DATA = window.NAV_DATA;
  if (!DATA) return;

  var PAGES = [
    { href: 'index.html',            label: 'Home' },
    { href: 'classes-ag.html',       label: 'Classes A–G',      key: 'ag' },
    { href: 'classes-ho.html',       label: 'Classes H–O',      key: 'ho' },
    { href: 'classes-pz.html',       label: 'Classes P–Z',      key: 'pz' },
    { href: 'professor-ratings.html', label: 'Prof Ratings' },
    { href: 'sigep-ratings.html',    label: 'SigEp Ratings' },
    { href: 'contact.html',          label: 'Contact / Submit' }
  ];

  var here = location.pathname.split('/').pop() || 'index.html';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- build one Classes menu: departments > courses > professors ---- */
  function buildMenu(key) {
    var section = DATA[key];
    var menu = el('div', 'nav-menu nav-menu-depts');

    section.depts.forEach(function (d) {
      var row = el('div', 'nav-row');
      var nCourses = d.courses.length;
      row.appendChild(el('span', 'nav-row-label', d.code));
      row.appendChild(el('span', 'nav-row-meta', d.name));
      row.appendChild(el('span', 'nav-row-arrow', '›'));
      row.setAttribute('data-jump', 'resource.html?d=' + d.id + '&s=' + key);

      var sub = el('div', 'nav-menu nav-menu-courses');
      d.courses.forEach(function (c) {
        var crow = el('div', 'nav-row');
        crow.appendChild(el('span', 'nav-row-label', c.name));
        crow.appendChild(el('span', 'nav-row-arrow', '›'));
        crow.setAttribute('data-jump', 'resource.html?c=' + encodeURIComponent(c.id));

        var psub = el('div', 'nav-menu nav-menu-profs');
        c.profs.forEach(function (p) {
          var prow = el('div', 'nav-row');
          prow.appendChild(el('span', 'nav-row-label', p.name));
          prow.setAttribute('data-jump', 'resource.html?p=' + encodeURIComponent(p.id));
          psub.appendChild(prow);
        });
        if (c.profs.length) crow.appendChild(psub);
        sub.appendChild(crow);
      });
      if (nCourses) row.appendChild(sub);
      menu.appendChild(row);
    });
    return menu;
  }

  /* ---- assemble the bar ---- */
  var nav = document.querySelector('header nav');
  if (!nav) return;
  nav.innerHTML = '';
  nav.id = 'site-nav';

  PAGES.forEach(function (p) {
    var item = el('div', 'nav-item' + (p.key ? ' has-menu' : ''));
    var a = el('a', p.href === here ? 'active' : null);
    a.href = p.href;
    a.appendChild(document.createTextNode(p.label));
    if (p.key) a.appendChild(el('span', 'nav-caret', '▾'));
    item.appendChild(a);
    if (p.key) item.appendChild(buildMenu(p.key));
    nav.appendChild(item);
  });

  /* ---- mobile: collapse the bar behind a toggle ----
     Stacked full-width, seven nav rows fill the whole first screen and push
     search below the fold. On phones the bar starts closed. */
  var toggle = el('button', 'nav-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span class="nav-toggle-bars"></span><span class="nav-toggle-text">Menu</span>';
  nav.parentNode.insertBefore(toggle, nav);

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) {
      Array.prototype.forEach.call(nav.querySelectorAll('.open'), function (n) {
        n.classList.remove('open');
      });
    }
  });

  /* ---- navigate on click of any row ---- */
  nav.addEventListener('click', function (e) {
    var row = e.target.closest ? e.target.closest('.nav-row') : null;
    if (!row || !nav.contains(row)) return;
    // only act on the row itself, not a parent row wrapping a submenu
    var inner = e.target.closest('.nav-menu');
    if (inner && inner !== row.parentNode) return;
    var jump = row.getAttribute('data-jump');
    if (jump) { e.preventDefault(); location.href = jump; }
  });

  /* ---- touch: tap opens a submenu instead of navigating straight away ---- */
  var isTouch = window.matchMedia('(hover: none)').matches;
  if (isTouch) {
    nav.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.has-menu > a') : null;
      if (a) {
        e.preventDefault();
        var item = a.parentNode;
        var open = item.classList.contains('open');
        Array.prototype.forEach.call(nav.querySelectorAll('.open'), function (n) {
          n.classList.remove('open');
        });
        if (!open) item.classList.add('open');
      }
    }, true);
  }

  /* ---- position fly-outs against the viewport ----
     The department panel scrolls (overflow-y:auto), which would clip any
     absolutely-positioned child. Fly-outs are position:fixed instead, so we
     place them by hand next to the row being hovered, flipping left or
     shifting up when they would leave the screen. */
  var stack = window.matchMedia('(max-width: 820px)');

  function place(row) {
    var sub = row.querySelector('.nav-menu');
    if (!sub || sub.parentNode !== row || stack.matches) return;
    var r = row.getBoundingClientRect();
    var pad = 8;

    // measure with the panel shown but not yet painted in place
    sub.style.visibility = 'hidden';
    sub.style.display = 'block';
    sub.style.left = '0px';
    sub.style.top = '0px';
    var w = sub.offsetWidth, h = sub.offsetHeight;

    var left = r.right;
    if (left + w > window.innerWidth - pad) left = r.left - w;   // flip left
    if (left < pad) left = pad;

    var top = r.top - 6;
    if (top + h > window.innerHeight - pad) top = window.innerHeight - h - pad;
    if (top < pad) top = pad;

    sub.style.left = left + 'px';
    sub.style.top = top + 'px';
    sub.style.display = '';
    sub.style.visibility = '';
  }

  nav.addEventListener('mouseover', function (e) {
    var row = e.target.closest ? e.target.closest('.nav-row') : null;
    if (row && nav.contains(row)) place(row);
  });

  /* ---- global search: every course and professor, one box ---- */
  var idx = [];
  Object.keys(DATA).forEach(function (key) {
    var page = DATA[key].page;
    DATA[key].depts.forEach(function (d) {
      d.courses.forEach(function (c) {
        idx.push({ t: c.name, s: d.code + ' — ' + d.name,
                   u: 'resource.html?c=' + encodeURIComponent(c.id), k: 'course' });
        c.profs.forEach(function (p) {
          idx.push({ t: p.name, s: c.name,
                     u: 'resource.html?p=' + encodeURIComponent(p.id), k: 'prof' });
        });
      });
    });
  });

  // A page can opt into the large hero treatment by providing #search-hero.
  // Everywhere else search rides along under the nav bar as a compact strip.
  var host = document.getElementById('search-hero');
  var wrap = el('div', 'nav-search' + (host ? ' nav-search-hero' : ''));
  var input = el('input');
  input.type = 'search';
  input.placeholder = host ? 'Search a class or professor…' : 'Search a class or professor…';
  input.setAttribute('aria-label', 'Search a class or professor');
  var results = el('div', 'nav-search-results');
  wrap.appendChild(input);
  wrap.appendChild(results);

  if (host) {
    host.appendChild(wrap);
    if (!('ontouchstart' in window)) input.focus();   // don't pop the keyboard on phones
  } else {
    nav.parentNode.insertBefore(wrap, nav.nextSibling);
  }

  function render(q) {
    results.innerHTML = '';
    q = q.trim().toLowerCase();
    if (q.length < 2) { results.classList.remove('show'); return; }
    var hits = idx.filter(function (r) {
      return r.t.toLowerCase().indexOf(q) !== -1 || r.s.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 40);
    if (!hits.length) {
      results.appendChild(el('div', 'nav-search-empty', 'No match for “' + q + '”'));
    } else {
      hits.forEach(function (r) {
        var a = el('a', 'nav-search-hit');
        a.href = r.u;
        a.appendChild(el('span', 'hit-title', r.t));
        a.appendChild(el('span', 'hit-sub', r.s));
        a.appendChild(el('span', 'hit-kind', r.k === 'prof' ? 'professor' : 'course'));
        results.appendChild(a);
      });
    }
    results.classList.add('show');
  }

  input.addEventListener('input', function () { render(input.value); });
  input.addEventListener('focus', function () { render(input.value); });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) results.classList.remove('show');
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; results.classList.remove('show'); input.blur(); }
    if (e.key === 'Enter') {
      var first = results.querySelector('.nav-search-hit');
      if (first) location.href = first.getAttribute('href');
    }
  });

  });
})();
