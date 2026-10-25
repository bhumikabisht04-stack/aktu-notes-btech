/* Engineering Notes — script.js (vanilla JS, no libraries).
   Reads window.SUBJECTS from data/subjects.js and draws the site.
   All text is added with textContent (never innerHTML), so it is safe. */
(function () {
  'use strict';
  var KEY = 'aktu-notes-progress-v1';
  var SUBJECTS = window.SUBJECTS || [];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    physics: 'M3 12a9 4 0 1 0 18 0a9 4 0 1 0-18 0M12 3a4 9 0 1 0 0 18a4 9 0 1 0 0-18M12 12h.01',
    maths: 'M18 5H6l6 7-6 7h12',
    prompt: 'M4 5h16v11H9l-5 4z',
    iks: 'M12 21c-5-3-8-7-8-12 4 0 7 2 8 5 1-3 4-5 8-5 0 5-3 9-8 12z',
    electrical: 'M13 3L5 14h6l-1 7 8-11h-6z',
    code: 'M9 8l-5 4 5 4M15 8l5 4-5 4',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    check: 'M5 12l5 5 9-10'
  };

  /* ---------- small helpers ---------- */
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function icon(name, extra) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'ico' + (extra ? ' ' + extra : ''));
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.book);
    s.appendChild(p);
    return s;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function $(id) { return document.getElementById(id); }

  /* ---------- saved progress (localStorage, with safe fallback) ---------- */
  var progress = { viewed: {}, completed: {} };
  try {
    var raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') {
      progress.viewed = raw.viewed || {};
      progress.completed = raw.completed || {};
    }
  } catch (e) { /* storage blocked or corrupted: start fresh */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) {} }

  /* ---------- which notes are really published ---------- */
  var fileOk = {}; // noteId -> false if the PDF was checked and is missing
  function isPublished(n) {
    return typeof n.file === 'string' && n.file.trim() !== '' && fileOk[n.id] !== false;
  }
  function pubNotes(unit) { return unit.notes.filter(isPublished); }
  function subjectNotes(s) {
    return s.units.reduce(function (a, u) { return a.concat(pubNotes(u)); }, []);
  }
  function allNotes() {
    return SUBJECTS.reduce(function (a, s) { return a.concat(subjectNotes(s)); }, []);
  }
  function stats(notes) {
    var v = 0, c = 0;
    notes.forEach(function (n) { if (progress.viewed[n.id]) v++; if (progress.completed[n.id]) c++; });
    var t = notes.length;
    return { total: t, viewed: v, done: c, left: t - c, pct: t ? Math.round(c / t * 100) : 0 };
  }

  // Warn about duplicate ids (they would share progress by mistake).
  (function () {
    var seen = {};
    SUBJECTS.forEach(function (s) { s.units.forEach(function (u) { u.notes.forEach(function (n) {
      if (seen[n.id]) console.warn('Duplicate note id:', n.id);
      seen[n.id] = true;
    }); }); });
  })();

  // Check each configured PDF exists (only works when served over http/https).
  function checkFiles() {
    if (!/^https?:$/.test(location.protocol)) return;
    var jobs = [];
    SUBJECTS.forEach(function (s) { s.units.forEach(function (u) { u.notes.forEach(function (n) {
      if (!n.file || !n.file.trim()) return;
      jobs.push(fetch(n.file, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
        if (!r.ok) { fileOk[n.id] = false; console.warn('PDF not found, note hidden:', n.file); }
      }).catch(function () { /* offline: keep note visible */ }));
    }); }); });
    if (jobs.length) Promise.all(jobs).then(render);
  }

  /* ---------- reusable pieces ---------- */
  function statusTag(has) { return el('span', { class: 'tag' + (has ? ' on' : ''), text: has ? 'NOTES AVAILABLE' : 'COMING SOON' }); }

  function subjectCard(s) {
    var has = subjectNotes(s).length > 0;
    return el('a', { class: 'card' + (has ? '' : ' soon'), href: '#/subject/' + s.id }, [
      icon(s.icon, 'big'),
      el('h3', { text: s.name }),
      el('p', { text: s.description }),
      el('div', { class: 'foot' }, [statusTag(has), el('span', { text: 'Explore ' }, [icon('arrow')])])
    ]);
  }

  function noteRow(n) {
    var done = !!progress.completed[n.id];
    var meta = [n.fileType || 'PDF', n.size].filter(Boolean).join(' · ');
    var toggle = el('button', { type: 'button', class: 'btn sm' + (done ? ' done' : ' quiet'), 'aria-pressed': String(done), 'data-focus': 'c-' + n.id });
    if (done) toggle.appendChild(icon('check'));
    toggle.appendChild(document.createTextNode(done ? ' Completed' : 'Mark as Complete'));
    toggle.addEventListener('click', function () {
      if (progress.completed[n.id]) delete progress.completed[n.id]; else progress.completed[n.id] = Date.now();
      save(); render();
    });
    var view = el('a', { class: 'btn sm', href: n.file, target: '_blank', rel: 'noopener', 'data-focus': 'v-' + n.id, text: 'View Notes' });
    view.addEventListener('click', function () {
      if (!progress.viewed[n.id]) { progress.viewed[n.id] = Date.now(); save(); setTimeout(render, 0); } // unique: only the first view is recorded
    });
    var dl = el('a', { class: 'btn sm quiet', href: n.file, download: '', text: 'Download PDF' });
    return el('div', { class: 'note' }, [
      el('div', {}, [
        el('h4', { text: n.title }),
        n.description ? el('p', { text: n.description }) : null,
        el('span', { class: 'meta', text: meta }),
        progress.viewed[n.id] ? el('span', { class: 'viewed-mark', text: ' · Viewed' }) : null
      ]),
      el('div', { class: 'actions' }, [view, dl, toggle])
    ]);
  }

  /* ---------- home: shelf, grid, progress ---------- */
  function renderShelf() {
    var shelf = $('shelf'); clear(shelf);
    var short = { 'iks': 'IKS' };
    SUBJECTS.forEach(function (s) {
      var a = el('a', { class: 'spine', href: '#/subject/' + s.id, role: 'listitem', title: s.name, text: short[s.id] || s.name.replace(' (IKS)', '') });
      shelf.appendChild(a);
    });
  }

  function renderGrid() {
    var g = $('subject-grid'); clear(g);
    SUBJECTS.forEach(function (s) { g.appendChild(subjectCard(s)); });
  }

  function renderProgress() {
    var body = $('progress-body'); clear(body);
    var all = allNotes(), st = stats(all);
    if (!st.total) {
      body.appendChild(el('p', { class: 'empty', text: 'Your study journey starts here. Your progress will appear once notes are available.' }));
      return;
    }
    var tiles = el('div', { class: 'stats' });
    [['Published notes', st.total], ['Viewed', st.viewed], ['Completed', st.done], ['Remaining', st.left]].forEach(function (t) {
      tiles.appendChild(el('div', { class: 'stat' }, [el('b', { text: String(t[1]) }), el('span', { text: t[0] })]));
    });
    body.appendChild(tiles);
    body.appendChild(bar('Overall completion', st.pct + '%', st.pct));
    var rows = el('div', { class: 'rows' }, [el('h3', { text: 'By subject' })]);
    SUBJECTS.forEach(function (s) {
      var ss = stats(subjectNotes(s));
      if (ss.total) rows.appendChild(bar(s.name, ss.done + ' of ' + ss.total + ' completed', ss.pct));
    });
    body.appendChild(rows);
    var reset = el('button', { type: 'button', class: 'btn sm quiet', text: 'Reset My Progress' });
    reset.addEventListener('click', function () {
      if (window.confirm('Clear all saved viewed and completed progress in this browser? This cannot be undone.')) {
        progress = { viewed: {}, completed: {} }; save(); render();
      }
    });
    body.appendChild(reset);
  }
  function bar(label, right, pct) {
    var track = el('div', { class: 'bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, [el('i')]);
    track.firstChild.style.width = pct + '%';
    return el('div', {}, [el('div', { class: 'pct' }, [el('span', { text: label }), el('span', { text: right })]), track]);
  }

  /* ---------- search ---------- */
  function renderSearch() {
    var q = $('search').value.trim().toLowerCase();
    var box = $('search-results'), grid = $('subject-grid');
    if (!q) { box.hidden = true; grid.hidden = false; return; }
    grid.hidden = true; box.hidden = false; clear(box);
    var hit = function () { return Array.prototype.slice.call(arguments).some(function (t) { return t && t.toLowerCase().indexOf(q) !== -1; }); };
    var list = el('div', { class: 'grid' }), count = 0;
    SUBJECTS.forEach(function (s) {
      if (hit(s.name, s.description)) { list.appendChild(subjectCard(s)); count++; }
      s.units.forEach(function (u) {
        if (hit(u.title, u.description)) {
          list.appendChild(el('a', { class: 'card', href: '#/subject/' + s.id }, [
            el('h3', { text: 'Unit ' + u.number + (u.title ? ': ' + u.title : '') }),
            el('p', { text: s.name + (u.description ? ' — ' + u.description : '') })])); count++;
        }
        pubNotes(u).forEach(function (n) {
          if (hit(n.title, n.description)) {
            list.appendChild(el('a', { class: 'card', href: '#/subject/' + s.id }, [
              el('h3', { text: n.title }), el('p', { text: s.name + ' · Unit ' + u.number + (n.description ? ' — ' + n.description : '') })])); count++;
          }
        });
      });
    });
    box.appendChild(count ? list : el('p', { class: 'empty', text: 'Nothing matches that search yet. Good notes take time.' }));
  }

  /* ---------- subject detail ---------- */
  function renderSubject(s) {
    var v = $('subject-view'); clear(v);
    v.appendChild(el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, [
      el('a', { href: '#home', text: 'Home' }), document.createTextNode(' / '), document.createTextNode(s.name)]));
    v.appendChild(el('div', { class: 's-head' }, [
      el('h1', { text: s.name }), el('p', { text: s.description }),
      el('a', { class: 'back', href: '#subjects', text: '← Back to Subjects' })]));
    var wrap = el('div', { class: 'units' });
    if (!subjectNotes(s).length) wrap.appendChild(el('p', { class: 'empty', text: 'Good notes take time. This subject is coming soon.' }));
    s.units.forEach(function (u) {
      var notes = pubNotes(u);
      var h = el('h3', {}, [el('span', { text: 'Unit ' + u.number }), document.createTextNode(u.title || '')]);
      var box = el('section', { class: 'unit', 'aria-label': 'Unit ' + u.number }, [
        el('div', { class: 'unit-head' }, [h, statusTag(notes.length > 0)]),
        u.description ? el('p', { text: u.description }) : null]);
      if (notes.length) notes.forEach(function (n) { box.appendChild(noteRow(n)); });
      else box.appendChild(el('p', { class: 'empty', text: 'Good notes take time. This section is coming soon.' }));
      wrap.appendChild(box);
    });
    v.appendChild(wrap);
  }

  /* ---------- routing ---------- */
  function currentSubject() {
    var m = location.hash.match(/^#\/subject\/([\w-]+)$/);
    if (!m) return null;
    return SUBJECTS.filter(function (s) { return s.id === m[1]; })[0] || null;
  }
  var lastKey = null;
  function render() {
    var focusId = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-focus');
    var s = currentSubject();
    $('home-view').hidden = !!s; $('subject-view').hidden = !s;
    renderShelf(); renderGrid(); renderProgress(); renderSearch();
    if (s) renderSubject(s);
    if (focusId) { var f = document.querySelector('[data-focus="' + focusId + '"]'); if (f) f.focus({ preventScroll: true }); }
  }
  function onRoute() {
    var s = currentSubject(), key = s ? s.id : 'home';
    render();
    if (s) { if (lastKey !== key) window.scrollTo(0, 0); document.title = s.name + ' — Engineering Notes'; }
    else {
      document.title = 'Engineering Notes — AKTU by Bhumika Bisht';
      var target = $(location.hash.slice(1));
      if (target) target.scrollIntoView(); else if (lastKey !== key) window.scrollTo(0, 0);
    }
    lastKey = key;
  }
  window.addEventListener('hashchange', onRoute);
  $('search').addEventListener('input', renderSearch);
  onRoute();
  checkFiles();
})();
