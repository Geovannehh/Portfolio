/* Seção "Todos os projetos": busca os repositórios públicos no GitHub.
   Se a API falhar (limite de requisições, offline), a lista estática do HTML continua visível. */
(function () {
  'use strict';

  var USER = 'Geovannehh';
  var API = 'https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed';
  var PAGE = 12;
  var COLORS = {
    'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'HTML': '#e34c26', 'CSS': '#563d7c',
    'Python': '#3572A5', 'Java': '#b07219', 'PHP': '#4F5D95', 'Dart': '#00B4AB',
    'C#': '#178600', 'Go': '#00ADD8', 'Kotlin': '#A97BFF', 'Swift': '#F05138',
    'Shell': '#89e051', 'C++': '#f34b7d', 'C': '#555555', 'Ruby': '#701516'
  };

  var grid = document.getElementById('repo-grid');
  var langBox = document.getElementById('repo-langs');
  var search = document.getElementById('repo-search');
  var moreBtn = document.getElementById('repo-more');
  if (!grid) return;

  var repos = [], lang = '', query = '', shown = PAGE;

  function paintDots(root) {
    root.querySelectorAll('i[data-lang]').forEach(function (i) {
      i.style.background = COLORS[i.getAttribute('data-lang')] || '#86868B';
    });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function link(href, label, cls) {
    var a = el('a', cls);
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    a.appendChild(document.createTextNode(label + ' '));
    a.appendChild(el('span', 'chev', '›'));
    return a;
  }

  function card(r) {
    var art = el('article', 'repo-card');
    var h3 = el('h3');
    var t = el('a', '', r.name);
    t.href = r.html_url; t.target = '_blank'; t.rel = 'noopener';
    h3.appendChild(t);
    art.appendChild(h3);
    art.appendChild(el('p', '', r.description || 'Sem descrição.'));

    var foot = el('div', 'repo-foot');
    if (r.language) {
      var l = el('span', 'repo-lang');
      var dot = document.createElement('i');
      dot.setAttribute('data-lang', r.language);
      l.appendChild(dot);
      l.appendChild(document.createTextNode(r.language));
      foot.appendChild(l);
    }
    if (r.stargazers_count) foot.appendChild(el('span', 'repo-stars', '★ ' + r.stargazers_count));
    var links = el('span', 'repo-links');
    links.appendChild(link(r.html_url, 'Código', 'link-more'));
    if (r.homepage) {
      var hp = /^https?:\/\//.test(r.homepage) ? r.homepage : 'https://' + r.homepage;
      links.appendChild(link(hp, 'Site', 'link-more'));
    }
    foot.appendChild(links);
    art.appendChild(foot);
    return art;
  }

  function filtered() {
    var q = query.toLowerCase();
    return repos.filter(function (r) {
      if (lang && r.language !== lang) return false;
      if (!q) return true;
      return (r.name + ' ' + (r.description || '') + ' ' + (r.language || '')).toLowerCase().indexOf(q) !== -1;
    });
  }

  function render() {
    var list = filtered();
    grid.textContent = '';
    if (!list.length) {
      grid.appendChild(el('p', 'repo-empty', 'Nenhum projeto encontrado.'));
    } else {
      list.slice(0, shown).forEach(function (r) { grid.appendChild(card(r)); });
    }
    paintDots(grid);
    moreBtn.hidden = list.length <= shown;
  }

  function renderLangs() {
    var count = {};
    repos.forEach(function (r) { if (r.language) count[r.language] = (count[r.language] || 0) + 1; });
    var names = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; });
    langBox.textContent = '';
    ['Todos'].concat(names).forEach(function (n) {
      var b = el('button', '', n === 'Todos' ? 'Todos (' + repos.length + ')' : n + ' (' + count[n] + ')');
      b.type = 'button';
      b.setAttribute('aria-pressed', String((n === 'Todos' && !lang) || n === lang));
      b.addEventListener('click', function () {
        lang = n === 'Todos' ? '' : n; shown = PAGE;
        renderLangs(); render();
      });
      langBox.appendChild(b);
    });
  }

  search.addEventListener('input', function () { query = search.value.trim(); shown = PAGE; render(); });
  moreBtn.addEventListener('click', function () { shown += PAGE; render(); });
  paintDots(grid);

  function load(cb) {
    try {
      var c = JSON.parse(sessionStorage.getItem('repos-cache') || 'null');
      if (c && Date.now() - c.t < 3600000) return cb(c.d);
    } catch (e) { /* sem cache */ }
    fetch(API, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (data) {
        try { sessionStorage.setItem('repos-cache', JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* ok */ }
        cb(data);
      })
      .catch(function () { /* mantém a lista estática */ });
  }

  load(function (data) {
    if (!Array.isArray(data) || !data.length) return;
    repos = data.filter(function (r) { return !r.fork && !r.archived; });
    if (!repos.length) return;
    renderLangs(); render();
  });
})();
