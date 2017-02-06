// パネルを作成
const thisPanel = (thisObj instanceof Panel) ? thisObj : new Window('palette', 'Color Integrator', [100, 100, 500, 600], {resizeable:true});

// 関数として取得
const ColorIntegrator = require('./colorIntegrator.js');
const ci = new ColorIntegrator(thisPanel);

// とりあえずUIを作成
ci.start();

// パネルを表示
if (thisPanel instanceof Window) {
  thisPanel.center();
  thisPanel.show();
}
