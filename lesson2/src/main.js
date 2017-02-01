// 関数として取得
const addFadeInOut = require('./addFadeInOut.js');

// パネルはグローバルに作成しないといけない？(要検証)
const thisPanel = $.global.addFadeInOutPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "addFadeInOut", [100, 100, 500, 600], {resizeable:true});

// ボタンを追加
var button = thisPanel.add("button", [10, 10, 100, 30], "add FadeInOut");
button.onClick = addFadeInOut;

// 位置を調整
fitLayout();
thisPanel.onResize = fitLayout;

// パネルを表示
if (thisPanel instanceof Window) {
  thisPanel.center();
  thisPanel.show();
}

// 位置を調整
function fitLayout(){
  $.writeln(thisPanel.bounds.width);
  button.bounds = [10, 10, thisPanel.bounds.width -10, 30];
}
