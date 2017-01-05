// 選択しているアイテムすべてに自動でフェードイン・フェードアウトがかかるエクスプレッションを挿入する

// 即時関数として扱う
(function(){
  // コンポジションを取得
  const activeComp = app.project.activeItem;
  if(!activeComp){
    // 選択されているコンポジションがなければ終了
    alert('Selected CompItem was not detected. Please select Composition and execute again.');
    return;
  }

  // レイヤーを取得
  const selectedLayers = activeComp.selectedLayers;
  if(!selectedLayers){
    // 選択されているレイヤーがなければ終了
    alert('Selected Layers was not detected. Please select layer and execute again.');
    return;
  }

  // 操作のため、コンポにヌルレイヤーを追加する
  const nullLayer = activeComp.layers.addNull();
  nullLayer.name = 'fadeInOutController';

  // スライダーエフェクトを追加
  const sliderEffect = nullLayer('Effects').addProperty('ADBE Slider Control');
  sliderEffect.name = 'speed';
  sliderEffect('ADBE Slider Control-0001').setValue('1.5');

  // 操作のため、コンポにヌルレイヤーを追加する
  const exp = `
    var n = thisComp.layer("${nullLayer.name}").effect("${sliderEffect.name}")("ADBE Slider Control-0001");
    if (time >= outPoint-n) ease(time,outPoint-n,outPoint,100,0);
    else ease(time,inPoint,inPoint+n,0,100);
  `;

  // レイヤーすべてにエクスプレッションを挿入する。
  _.each(selectedLayers, layer => layer.opacity.expression = exp);

})();

// ■ 即時関数 (function(){...})()
// 無名の関数を定義してすぐに実行する書き方です。
// 即時関数化することで変数のスコープが関数内になりグローバル変数を汚さなくて済むので、他のスクリプトに影響を及ぼすのを回避できます。
// 本来browserifyする段階で一度スコープが変わるので不要になりますが、ここではreturnで処理を中断させるためにfunctionで囲んでいます。

// ■ 変数宣言 const,let
// varと同様に、変数の定義に使います。
// letは再代入ができるますが、constは再代入ができません。
// varとは異なり、let及びconstはそれ以下にスコープが制限されるほか、同じ変数名の再宣言ができなくなります。
// これらを使用することで不用意な変数変更によるバグを回避しやすくなります。

// ■ 文字列 ``
// いままでは「''」や「""」で囲むことにより文字列を作成していました。
// ES2015では「``」で囲むことで文字列を作成でき、「${}」で囲むことで中に変数を入れることができます。
// 複数行で書くこともできます。

// ■ 関数 (x) => {}
// ES2015ではアロー関数というものが使用できます。
// 今までの function(x){alert('hoge')} という記述を (x) => {alert('hoge')} と書くことができ、
// 引数が一つの時は()が不要、一行のものは{}が不要なので、最終的に x => alert('hoge') と書くだけで関数を作成できます。

// underscore.js
// _.から始まる便利関数です。
// 配列やオブジェクトを操作するのに便利な処理が色々入っています。
// 配列系以外にも色々あります。

// ■ 配列処理 _.each()
// activeComp.selectedLayers配列のすべての要素に処理をします。
// これはunderscoreのeach関数を使ったものです。 (本来for ofでも配列を回せるが、現状使用できない)
// _.each(selectedLayers, layer => layer.opacity.expression = exp);
//
// ES2015及びunderscoreを使わないなら以下のように書きます。
// for (var i = 0; i < selectedLayers.length; i++) {
//   var layer = selectedLayers[i];
//   layer.opacity.expression = exp;
// }
