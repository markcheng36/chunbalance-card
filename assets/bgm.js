/* 遊戲背景音樂：全部用 Web Audio 即時產生（免費、無版權問題）
   用法：<script src="assets/bgm.js" data-mood="reiki"（靈氣）或其他（一般輕音樂）></script>
   - 預設關閉，按右上角 ♪ 才開，會記住選擇
   - 切到背景或關掉畫面時自動暫停 */
(function () {
  var me = document.currentScript;
  var mood = (me && me.getAttribute('data-mood')) || 'calm';
  var KEY = 'cb-bgm-on'; // 預設關閉，按 ♪ 才開
  var off;
  off = true;
  try { off = localStorage.getItem(KEY) !== '1'; } catch (e) {}

  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  var ctx = null, master = null, wet = null, timer = null, nextT = 0, step = 0, started = false;

  // ---- 開關按鈕 ----
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'bgmBtn';
  btn.setAttribute('aria-label', '背景音樂開關');
  var css = document.createElement('style');
  css.textContent =
    '#bgmBtn{position:fixed;right:max(12px,env(safe-area-inset-right,0px));top:calc(6px + env(safe-area-inset-top,0px));' +
    'z-index:9999;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.35);' +
    'background:rgba(30,30,30,.45);color:#fff;font:16px/32px sans-serif;text-align:center;padding:0;cursor:pointer;' +
    '-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);touch-action:manipulation}' +
    '#bgmBtn.off{opacity:.55}#bgmBtn.off::after{content:"";position:absolute;left:7px;right:7px;top:16px;height:1.5px;background:#fff;transform:rotate(-45deg)}';
  function paint() { btn.className = off ? 'off' : ''; btn.textContent = '♪'; }
  paint();
  function mount() { document.head.appendChild(css); document.body.appendChild(btn); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!off && (!unlocked || Date.now() - unlockedAt < 800)) { unlock(); return; } // 這一下是用來開聲音的，不要當成關掉
    off = !off;
    try { localStorage.setItem(KEY, off ? '0' : '1'); } catch (err) {}
    paint();
    if (off) stop(); else start();
  });

  // ---- 音色 ----
  function init() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    // 簡單殘響
    var len = ctx.sampleRate * 3, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    var rev = ctx.createConvolver(); rev.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = mood === 'play' ? 0.18 : 0.45;
    wet.connect(rev); rev.connect(master);
  }
  function out(node, dry) {
    var g = ctx.createGain(); g.gain.value = dry; node.connect(g); g.connect(master); node.connect(wet);
  }
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

  function tone(t, f, dur, vol, type, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, 0.8); o.start(t); o.stop(t + dur + 0.05);
  }





  function pad(t, notes, dur, vol, swell) { // 長音鋪底
    notes.forEach(function (m) {
      [-4, 4].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = det;
        lp.type = 'lowpass'; lp.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t);
        if (swell) { // 跟著 4 秒吸、4 秒吐起伏
          for (var k = 0; k < dur; k += 8) {
            g.gain.linearRampToValueAtTime(vol, t + k + 4);
            g.gain.linearRampToValueAtTime(vol * 0.35, t + k + 8);
          }
        } else {
          g.gain.linearRampToValueAtTime(vol, t + 1.5);
          g.gain.setValueAtTime(vol, t + dur - 1.5);
        }
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
        o.connect(lp); lp.connect(g); out(g, 0.6); o.start(t); o.stop(t + dur + 0.6);
      });
    });
  }

  function epiano(t, f, vol) { // 柔和的電鋼琴
    tone(t, f, 2.6, vol, 'sine', 0.01);
    tone(t, f * 2, 1.2, vol * 0.18, 'sine', 0.01);
  }
  var noiseBuf = null;
  function waves(t, dur, vol) { // 輕輕的海浪聲（低沉的雜訊慢慢起伏）
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0), last = 0;
      for (var i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    }
    var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    lp.type = 'lowpass'; lp.frequency.value = 600;
    g.gain.setValueAtTime(0.0001, t);
    for (var k = 0; k < dur; k += 8) { // 一波約 8 秒
      g.gain.linearRampToValueAtTime(vol, t + k + 3.5);
      g.gain.linearRampToValueAtTime(vol * 0.25, t + k + 8);
    }
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t, Math.random() * 3); src.stop(t + dur + 0.5);
  }

  // ---- 曲子：每一段的長度（秒）和內容 ----
  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  // 一般輕音樂：C、G、Am、F 四個和弦慢慢輪，電鋼琴分解和弦＋偶爾一個旋律音
  var light = { len: 8, play: function (t, n) {
    var ch = [[48, 55, 60, 64], [43, 50, 59, 62], [45, 52, 60, 64], [41, 48, 57, 60]][n % 4];
    pad(t, [ch[0], ch[2]], 8, 0.014, false);
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (b, i) { epiano(t + b, hz(ch[[0, 1, 2, 3, 2, 1, 2, 3][i]] + 12), 0.03); });
    var mel = [72, 74, 76, 79, 81];
    [0.5, 2.5, 4.5, 6.5].forEach(function (b) { if (Math.random() < 0.45) epiano(t + b, hz(rnd(mel) + 12), 0.025); });
  } };
  var SONGS = {
    // 靈氣：放鬆舒壓，柔和長音跟著 4 秒吸 4 秒吐起伏，加上輕輕的海浪聲
    reiki: { len: 16, play: function (t, n) {
      var chords = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
      pad(t, chords[n % 4], 16, 0.026, true);
      waves(t, 16, 0.05);
      if (Math.random() < 0.6) epiano(t + 2 + Math.random() * 4, hz(rnd([72, 76, 79])), 0.02);
    } },
    calm: light, zen: light, play: light
  };
  var song = SONGS[mood] || SONGS.calm;

  function tick() {
    while (nextT < ctx.currentTime + 1.5) { song.play(nextT, step++); nextT += song.len; }
  }
  function start() {
    if (off || document.hidden) return;
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
    if (!started) { started = true; nextT = ctx.currentTime + 0.1; step = 0; }
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(mood === 'reiki' ? 2.2 : 2.6, ctx.currentTime, 0.8);
    if (!timer) { tick(); timer = setInterval(tick, 400); }
  }
  function stop() {
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    clearInterval(timer); timer = null;
    setTimeout(function () { if (!timer && ctx) ctx.suspend(); }, 800);
  }

  // 手機規定要先有人碰畫面才能出聲；有些手機要等手指放開才算，所以每種觸碰都試，直到真的出聲為止
  var EV = ['pointerup', 'touchend', 'click', 'keydown'], unlockedAt = 0, unlocked = false;
  function unlock() {
    if (off || unlocked) return;
    start();
    try { // iOS：在觸碰當下播一段無聲音訊來解鎖
      var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) {}
    var done = function () {
      if (unlocked || ctx.state !== 'running') return;
      unlocked = true; unlockedAt = Date.now();
      EV.forEach(function (n) { window.removeEventListener(n, unlock, true); });
    };
    done();
    if (ctx.resume) ctx.resume().then(done, function () {});
  }
  EV.forEach(function (n) { window.addEventListener(n, unlock, true); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (started && !off) start();
  });
  window.addEventListener('pagehide', stop);
})();
