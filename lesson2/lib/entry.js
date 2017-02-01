'use strict';

// ランタイムエラーで停止しない(エラーはtry-catchで取る)
// https://forums.adobe.com/message/7454142#7454142
$.level = 0;

try {
  require('es5-shim/es5-shim.min.js');
  require('es5-shim/es5-sham.min.js');
} catch (error) {
  // ExtendScriptはすべてのグローバル変数を次回実行時も記憶している。
  // es5-shimでグローバルのDateオブジェクトをprototype拡張するが、次回実行時も保持したままになっている。
  // その関係で、2度目の読み込みで一部関数が例外を投げる。既にグローバルに読み込めてはいるので使える。
  $.writeln('Caught an error:', error);
}

// JSONを使う
$.global.JSON = require('JSON2');

// underscoreを使う
$.global._ = require('underscore');

// メイン処理の開始
require('../src/main.js')
