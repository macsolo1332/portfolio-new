/* Space background, typing role line, clock, mobile menu, copy + CV buttons */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- starfield ---------- */
  var canvas = document.getElementById('space');
  if (canvas && typeof THREE !== 'undefined') {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); } catch (e) { renderer = null; }
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
      camera.position.z = 1;

      /* soft round sprite so stars are dots, not squares */
      var dotTex = (function(){
        var c = document.createElement('canvas'); c.width = c.height = 64;
        var x = c.getContext('2d'), g = x.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.8)'); g.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0,0,64,64);
        return new THREE.CanvasTexture(c);
      })();
      function starLayer(count, spread, size, color, opacity){
        var pos = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
          pos[i*3]   = (Math.random() - 0.5) * spread;
          pos[i*3+1] = (Math.random() - 0.5) * spread;
          pos[i*3+2] = -60 - Math.random() * spread;
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var m = new THREE.PointsMaterial({ map: dotTex, color: color, size: size, transparent: true, opacity: opacity, sizeAttenuation: true, depthWrite: false });
        var p = new THREE.Points(g, m); scene.add(p); return p;
      }
      var far  = starLayer(2600, 1600, 2.2, 0xffffff, 0.75);
      var mid  = starLayer(700, 1200, 3.6, 0xcfe8ff, 0.85);
      var glow = starLayer(140, 1000, 6, 0x5cffb0, 0.5);

      /* a faint constellation of connected nodes */
      var nodes = [], group = new THREE.Group();
      for (var i = 0; i < 46; i++) {
        var r = 150 + Math.random() * 60, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
        nodes.push(new THREE.Vector3(r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph)));
      }
      group.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodes),
        new THREE.PointsMaterial({ map: dotTex, color: 0x5cffb0, size: 5, transparent: true, opacity: 0.8, depthWrite: false })));
      var lines = [];
      for (var a = 0; a < nodes.length; a++) for (var b = a + 1; b < nodes.length; b++)
        if (nodes[a].distanceTo(nodes[b]) < 95) lines.push(nodes[a].x,nodes[a].y,nodes[a].z,nodes[b].x,nodes[b].y,nodes[b].z);
      var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
      group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2f9a70, transparent: true, opacity: 0.22 })));
      group.position.set(260, 40, -520);
      scene.add(group);

      function resize(){ camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); }
      resize(); addEventListener('resize', resize);

      var mx = 0, my = 0;
      addEventListener('mousemove', function(e){ mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

      function frame(){
        var sy = scrollY || 0;
        far.rotation.z += 0.00008; mid.rotation.z += 0.00014;
        glow.rotation.y += 0.0002;
        group.rotation.y += 0.0012; group.rotation.x += 0.0004;
        camera.position.x += (mx * 30 - camera.position.x) * 0.03;
        camera.position.y += (-my * 20 - sy * 0.04 - camera.position.y) * 0.05;
        renderer.render(scene, camera);
        if (!reduce) requestAnimationFrame(frame);
      }
      frame();
      if (reduce) addEventListener('scroll', function(){ renderer.render(scene, camera); }, { passive: true });
    }
  }

  /* ---------- rotating role ---------- */
  var roleEl = document.getElementById('role');
  var roles = ['IT Operations Professional', 'Application Support Specialist', 'Shift Supervisor', 'QA & Testing', 'Software Developer'];
  if (roleEl && !reduce) {
    var ri = 0, ci = roles[0].length, del = false;
    (function step(){
      var word = roles[ri];
      roleEl.textContent = word.slice(0, ci);
      if (!del && ci < word.length) { ci++; return setTimeout(step, 45); }
      if (!del) { del = true; return setTimeout(step, 2000); }
      if (ci > 0) { ci--; return setTimeout(step, 22); }
      del = false; ri = (ri + 1) % roles.length; setTimeout(step, 300);
    })();
  }

  /* ---------- clock ---------- */
  var ticks = document.getElementById('ticks');
  if (ticks) {
    for (var k = 0; k < 12; k++) {
      var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('class', 'tick'); l.setAttribute('x1', 50); l.setAttribute('y1', 6);
      l.setAttribute('x2', 50); l.setAttribute('y2', k % 3 === 0 ? 12 : 9);
      l.setAttribute('transform', 'rotate(' + k * 30 + ' 50 50)'); ticks.appendChild(l);
    }
    var hh = document.getElementById('hh'), mh = document.getElementById('mh'), sh = document.getElementById('sh');
    var ct = document.getElementById('clockTime'), cz = document.getElementById('clockZone');
    try { cz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time'; } catch (e) {}
    var pad = function(n){ return String(n).padStart(2, '0'); };
    var tick = function(){
      var d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
      hh.setAttribute('transform', 'rotate(' + ((h % 12) * 30 + m * 0.5) + ' 50 50)');
      mh.setAttribute('transform', 'rotate(' + (m * 6 + s * 0.1) + ' 50 50)');
      sh.setAttribute('transform', 'rotate(' + (s * 6) + ' 50 50)');
      ct.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn'), menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('.copy').forEach(function(b){
    b.addEventListener('click', function(){
      var el = document.getElementById(b.dataset.copy), txt = el.textContent.trim();
      var done = function(){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1600); };
      var sel = function(){ var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; };
      try { navigator.clipboard.writeText(txt).then(done, sel); } catch (e) { sel(); }
    });
  });

  /* ---------- CV download (published page uses the viewer's save dialog) ---------- */
  var cv = document.getElementById('cvBtn');
  if (cv && window.claude && window.claude.use) {
    window.claude.use('downloads').then(function(dl){
      if (!dl) return;
      cv.addEventListener('click', function(e){
        e.preventDefault();
        var label = cv.textContent;
        fetch(cv.getAttribute('href')).then(function(r){ if (!r.ok) throw 0; return r.blob(); })
          .then(function(blob){ return dl.save({ filename: 'Akash-Suresh-CV.pdf', data: blob }); })
          .then(function(){ cv.textContent = 'CV saved ✓'; setTimeout(function(){ cv.textContent = label; }, 2000); })
          .catch(function(err){ if (err && err.code === 'declined') return; window.open(cv.href, '_blank'); });
      });
    }).catch(function(){});
  }
})();
