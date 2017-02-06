class ColorIntegrator {
  constructor(thisPanel) {
    this.panel = thisPanel;
    this.compName = '_colorIntegrator';
    this.layerName = 'colors';
    this.lists = [];
    this.icons = [];
    this.startButtom = false;
    this.footer = false;
    this.panel.onResize = () => this._fitLayout();
    // this.panel.onActivate = () => this.start();
  }

  // 起動時に実行
  start() {
    // コンポジションが存在しない
    if (this.startButtom === false) {
      this.startButtom = this.panel.add('button', this._getStartButtomBounds(), 'start');
      this.startButtom.onClick = () => {
        this.panel.remove(this.startButtom);
        this.startButtom = false;
        if (this.getColorComp() === false) {
          this.init();
        } else {
          this.updateUI();
        }
      }
    } else {
      this.updateUI();
    }
  }

  // 何もない状態から始める
  init() {
    let comp = app.project.items.addComp(this.compName, 1920, 1080, 1, 10, 30);
    let layer = comp.layers.addText(`#FFFFFF,#4ae7a0,#fc1c66`);
    layer.name = this.layerName;
    this.updateUI();
  }

  // UIを再構築
  updateUI() {
    this.clearUI();
    const colorStr = this.getColorString();
    const colors = String(this.getColorString()).split(',');
    this._makeLists(colors);
    this._makeFooter(colorStr);
  }

  // UIを削除
  clearUI() {
    _.each(this.lists, (list,i) => {
      this.panel.remove(list);
      delete this.lists[i];
    });
    _.each(this.icons, (icon,i) => {
      this.panel.remove(icon);
      delete this.icons[i];
    });
    this.lists = [];
    this.icons = [];
    if(this.footer !== false){
      this.panel.remove(this.footer);
    }
    this.footer = false;
    if(this.startButtom !== false){
      this.panel.remove(this.startButtom);
    }
    this.startButtom = false;
  }

  // 選択されたプロパティにエクスプレッションを追加
  addExp(key) {
    // コンポジションを取得
    const activeComp = app.project.activeItem;
    if(!activeComp){
      alert('Selected CompItem was not detected. Please select Composition and execute again.');
      return;
    }

    // レイヤーを取得
    const selectedProperties = activeComp.selectedProperties;
    if(!selectedProperties){
      // 選択されているレイヤーがなければ終了
      alert('Selected properties was not detected. Please select layer and execute again.');
      return;
    }
    // レイヤーすべてにエクスプレッションを挿入する。
    _.each(selectedProperties, property => property.expression = this._buildExp(key));
  }

  // ColorIntegratorのコンポジションがあれば返す
  getColorComp() {
    for (let i = 1; i <= app.project.items.length; i++) {
      if (app.project.items[i].name == this.compName) {
        return app.project.items[i];
      }
    }
    return false;
  }

  // コンポジションから色配列を読み出す
  getColorString() {
    var text = this.getColorComp().layer(this.layerName).text.sourceText.value;
    return text;
  }

  // コンポジションに色配列を書き出す
  setColorString(text) {
    this.getColorComp().layer(this.layerName).text.sourceText.setValue(text);
  }

  // リスト部分を作成して追加
  _makeLists(colors) {
    _.each(colors, (color,i) => {
      this.lists[i] = this.panel.add('button', this._getListBounds(i), color);
      this.icons[i] = this.panel.add('button', this._getIconBounds(i), '');
      this.icons[i].fillBrush = this.icons[i].graphics.newBrush(this.icons[i].graphics.BrushType.SOLID_COLOR, this._hexToRgba(color));
      this.icons[i].onDraw = function(){
        this.graphics.drawOSControl();
        this.graphics.rectPath(0,0,this.size[0],this.size[1]);
        this.graphics.fillPath(this.fillBrush);
      };
      this.icons[i].onClick = () => this.addExp(i);
      this.lists[i].onClick = () => {
        const picked_color = this._colorPicker(color);
        let new_colors = [];
        _.each(colors, (c,j) => {
          if(j === i){
            c = picked_color;
          }
          new_colors.push(c);
        });
        this.footer.text = new_colors.join(',');
        this.setColorString(new_colors.join(','));
        this.updateUI();
      };
    });
  }

  // フッター部分を作成して追加
  _makeFooter(colorStr) {
    this.footer = this.panel.add('edittext',this._getFooterBounds());
    this.footer.text = colorStr;
    this.footer.onChange = () => {
      if(!this._assertColorString(this.footer.text)){
        this.footer.text = this.getColorString();
        return;
      };
      this.setColorString(this.footer.text);
      this.updateUI();
    };
  }

  // カラーピッカーを起動してカラーコードを返す
  _colorPicker(color) {
    const picked_color = $.colorPicker(color.replace('#','0x'));
    return '#'+picked_color.toString(16);
  }

  // 要素の大きさをウィンドウにあわせる
  _fitLayout(){
    _.each(this.lists, (list,i) => {
      list.bounds = this._getListBounds(i);
    });
    _.each(this.icons, (icon,i) => {
      icon.bounds = this._getIconBounds(i);
    });
    if(this.footer !== false){
      this.footer.bounds = this._getFooterBounds();
    }
    if(this.startButtom !== false){
      this.startButtom.bounds = this._getStartButtomBounds();
    }
  }

  _getListBounds(i) {
    return {x:40, y:10+(i*32), width:this.panel.bounds.width-50, height:30};
  }

  _getIconBounds(i) {
    return {x:10, y:10+(i*32), width:30, height:30};
  }

  _getFooterBounds() {
    return {x:0, y:this.panel.bounds.height-30, width:this.panel.bounds.width, height:30};
  }
  _getStartButtomBounds() {
    return {x:10, y:10, width:this.panel.bounds.width-20, height:30};
  }

  // hexを0~1のrgbaに
  _hexToRgba(hex) {
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r,g,b,1];
  }

  // カラーコードが正しいかどうか
  _assertColorString(hextext) {
    // すべて半角英数
    if (hextext.match(/[^0-9a-zA-Z,#]+/)) {
      alert(`invalid input`);
      return false;
    }
    // 形式が正しい
    const colors = hextext.split(',');
    for (let i = 0; i < colors.length; i++) {
      let color = colors[i];
      if (!color.match(/^#[0-9a-fA-F]{6}$/)) {
        alert(`invalid color code`);
        return false;
      }
    }
    return true;
  }

  // エクスプレッションを作る
  _buildExp(key) {
    return ` // added by ColorIntegrator
      (function(hex){
        var r = parseInt(hex.substring(0, 2), 16) / 255;
        var g = parseInt(hex.substring(2, 4), 16) / 255;
        var b = parseInt(hex.substring(4, 6), 16) / 255;
        return [r,g,b,1];
      })(
        (function(x){
          var t = comp('_colorIntegrator').layer('colors').text.sourceText.split(',');
          if(typeof t[x] === 'undefined'){
            return 'FFFFFF';
          }
          return t[x].replace('#','');
        })(${key})
      )`;
  }
}
module.exports = ColorIntegrator;
