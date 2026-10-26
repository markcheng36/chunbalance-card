/* 遊戲頁左下角「遊戲間」按鈕：隨時回到遊戲首頁 */
(function () {
  var a = document.createElement('a');
  a.id = 'homeBtn';
  a.href = 'games.html';
  a.textContent = '‹ 遊戲間';
  var css = document.createElement('style');
  css.textContent =
    '#homeBtn{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));' +
    'z-index:9999;height:34px;padding:0 13px;border-radius:17px;border:1px solid rgba(255,255,255,.35);' +
    'background:rgba(30,30,30,.45);color:#fff;font:600 14px/32px -apple-system,"PingFang TC","Noto Sans TC",sans-serif;' +
    'text-decoration:none;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);touch-action:manipulation}';
  function mount() { document.head.appendChild(css); document.body.appendChild(a); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
