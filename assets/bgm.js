/* 遊戲背景音樂：全部用 Web Audio 即時產生（免費、無版權問題）
   用法：<script src="assets/bgm.js" data-mood="reiki|calm|zen|play"></script>
   - 第一次點畫面後才開始（手機瀏覽器規定）
   - 右下角 ♪ 按鈕可開關，會記住選擇
   - 切到背景或關掉畫面時自動暫停 */
(function () {
  var me = document.currentScript;
  var mood = (me && me.getAttribute('data-mood')) || 'calm';
  var KEY = 'cb-bgm-off';
  var off = false;
  try { off = localStorage.getItem(KEY) === '1'; } catch (e) {}

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
    '#bgmBtn{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));' +
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
    off = !off;
    try { localStorage.setItem(KEY, off ? '1' : '0'); } catch (err) {}
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
  function bowl(t, f, vol) { // 頌缽：不和諧泛音、長尾音、輕微拍頻
    [[1, 1], [2.76, 0.45], [5.4, 0.2]].forEach(function (p) {
      tone(t, f * p[0], 7, vol * p[1], 'sine', 0.02);
      tone(t, f * p[0] * 1.004, 7, vol * p[1] * 0.5, 'sine', 0.02);
    });
  }
  function pluck(t, f, vol) { // 古箏般的撥弦
    tone(t, f, 2.2, vol, 'triangle', 0.005);
    tone(t, f * 2, 0.9, vol * 0.3, 'sine', 0.005);
  }
  function mallet(t, f, vol) { // 木琴
    tone(t, f, 0.5, vol, 'sine', 0.003);
    tone(t, f * 4, 0.12, vol * 0.25, 'sine', 0.002);
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

  // ---- 曲子：每一段的長度（秒）和內容 ----
  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var SONGS = {
    // 靈氣：A 小調長音，跟呼吸 8 秒一循環起伏，每 16 秒一聲頌缽
    reiki: { len: 16, play: function (t, n) {
      var chords = [[45, 52, 57], [41, 48, 57], [43, 50, 55], [45, 52, 60]];
      pad(t, chords[n % 4], 16, 0.035, true);
      bowl(t + 0.2, hz(rnd([69, 72, 76])), 0.05);
      if (n % 2) bowl(t + 8.2, hz(rnd([64, 67])), 0.03);
    } },
    // 身體結構：溫暖、慢慢的五聲音階
    calm: { len: 8, play: function (t, n) {
      var chords = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
      pad(t, chords[n % 4], 8, 0.022, false);
      var sc = [72, 74, 76, 79, 81, 84];
      for (var i = 0; i < 4; i++) if (Math.random() < 0.7) mallet(t + i * 2 + Math.random() * 0.3, hz(rnd(sc)), 0.04);
    } },
    // 董氏奇穴：宮商角徵羽，古箏撥弦
    zen: { len: 8, play: function (t, n) {
      pad(t, [n % 2 ? 38 : 43, 50], 8, 0.02, false);
      var sc = [62, 64, 67, 69, 71, 74, 76];
      var beats = [0, 1, 1.5, 3, 4, 5, 5.5, 7];
      beats.forEach(function (b) { if (Math.random() < 0.6) pluck(t + b, hz(rnd(sc)), 0.05); });
      if (n % 4 === 0) bowl(t, hz(50), 0.03);
    } },
    // 輕鬆玩：輕快的木琴小循環
    play: { len: 4, play: function (t, n) {
      var bass = [48, 45, 41, 43][n % 4];
      var mel = [[72, 76, 79, 76], [72, 77, 81, 77], [69, 72, 77, 72], [71, 74, 79, 74]][n % 4];
      for (var i = 0; i < 8; i++) {
        mallet(t + i * 0.5, hz(mel[i % 4] + (i > 3 && n % 2 ? 12 : 0)), 0.035);
        if (i % 2 === 0) tone(t + i * 0.5, hz(bass), 0.4, 0.05, 'sine', 0.01);
      }
    } }
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
    master.gain.setTargetAtTime({ reiki: 2.2, calm: 2.2, zen: 2.4, play: 3 }[mood] || 2.2, ctx.currentTime, 0.8);
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
  var EV = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown'];
  function unlock() {
    if (off) return;
    start();
    try { // iOS：在觸碰當下播一段無聲音訊來解鎖
      var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) {}
    if (ctx.state === 'running') EV.forEach(function (n) { window.removeEventListener(n, unlock, true); });
  }
  EV.forEach(function (n) { window.addEventListener(n, unlock, true); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (started && !off) start();
  });
  window.addEventListener('pagehide', stop);
})();
