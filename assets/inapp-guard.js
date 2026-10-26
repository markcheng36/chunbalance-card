/* 遊戲頁共用：在官方 LINE 等 App 內建瀏覽器裡
   1. 長按不會選取文字、跳出選單（圖片仍可長按儲存）
   2. 在頁面頂端往下滑時不會把網頁拉下來關掉 */
(function () {
  var css =
    'html,body{overscroll-behavior:none;-webkit-tap-highlight-color:transparent}' +
    'body,body *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text}' +
    'img{-webkit-touch-callout:default}';
  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // 長按時不跳出選單（圖片除外，讓分享圖可以長按儲存）
  document.addEventListener('contextmenu', function (e) {
    if (e.target && e.target.tagName !== 'IMG') e.preventDefault();
  });

  // 擋住在頁面頂端「往下拉」的手勢，避免 LINE 把網頁收起來
  var startY = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 1) return;
    var dy = e.touches[0].clientY - startY;
    if (dy <= 0) return; // 往上滑：正常捲動
    // 手指下的區塊如果自己還能往上捲，就讓它捲
    for (var el = e.target; el && el !== document.body && el.nodeType === 1; el = el.parentNode) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return;
    }
    var top = (document.scrollingElement || document.documentElement).scrollTop;
    if (top <= 0 && e.cancelable) e.preventDefault();
  }, { passive: false });
})();
