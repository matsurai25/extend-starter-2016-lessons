// require先に関数を送る
module.exports = function(){
  // コンポジションを取得
  const activeComp = app.project.activeItem;
  if(!activeComp){
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
};
