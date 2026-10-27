/* 遊戲頁左上角「遊戲間」按鈕：隨時回到遊戲首頁 */
(function () {
  var a = document.createElement('a');
  a.id = 'homeBtn';
  a.href = 'games.html';
  a.textContent = '‹ 遊戲間';
  var css = document.createElement('style');
  css.textContent =
    // 讓出最上面一條給「遊戲間」和 ♪，遊戲內容往下排，不會被蓋到
    'html body{padding-top:calc(46px + env(safe-area-inset-top,0px))!important;box-sizing:border-box}' +
    // 內容太長時一定滑得到底；手機底下留一段空間，按鈕不會被 LINE／瀏覽器的工具列擋住
    'html body{overflow-y:auto!important}' +
    '@media (pointer:coarse){html body{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important}' +
    '#shareBox{padding-bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}}' +
    '#app,#shareBox,.ov,.overlay,.screen{overflow-y:auto!important}' +
    // 置中的彈出卡片太高時，從上面開始排，避免頂端被切掉
    '.ov,#shareBox{justify-content:flex-start!important}' +
    '.ov>:first-child,#shareBox>:first-child{margin-top:auto!important}.ov>:last-child,#shareBox>:last-child{margin-bottom:auto!important}' +
    '.overlay{place-items:start center!important}.overlay>*{margin-block:auto}' +
    '#homeBtn{position:fixed;left:max(12px,env(safe-area-inset-left,0px));top:calc(6px + env(safe-area-inset-top,0px));' +
    'z-index:9999;height:34px;padding:0 13px;border-radius:17px;border:1px solid rgba(255,255,255,.35);' +
    'background:rgba(30,30,30,.45);color:#fff;font:600 14px/32px -apple-system,"PingFang TC","Noto Sans TC",sans-serif;' +
    'text-decoration:none;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);touch-action:manipulation}';
  function mount() { document.head.appendChild(css); document.body.appendChild(a); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
