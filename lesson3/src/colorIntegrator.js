class ColorIntegrator {
  constructor(thisPanel) {
    this.panel = thisPanel;
    this.version = '1.0.4';
    this.compName = '_colorIntegrator';
    this.layerName = 'colors';
    this.commands = ['scan'];
    this.lists = [];
    this.icons = [];
    this.startButton = false;
    this.startText = false;
    this.footer = false;
    this.scanButton = false;
    this.reloadButton = false;
    this.panel.onResize = () => this._fitLayout();
    // this.panel.onActivate = () => this.start();
  }

  // 起動時に実行
  start() {
    // コンポジションが存在しない
    if (this.startButton === false) {
      this.startText = this.panel.add('statictext', this._getStartTextBounds(), 'start', {multiline:true});
      this.startText.text = `Color Integrator\nv${this.version}\n@matsurai25`;
      this.startButton = this.panel.add('button', this._getStartButtonBounds(), 'start');
      this.startButton.onClick = () => {
        this.panel.remove(this.startButton);
        this.startButton = false;
        if (this.getColorComp() === false) {
          this.init();
        } else {
          this.reloadUI();
        }
      }
    } else {
      this.reloadUI();
    }
  }

  // 何もない状態から始める
  init() {
    let comp = app.project.items.addComp(this.compName, 1920, 1080, 1, 10, 30);
    let layer = comp.layers.addText(`#FFFFFF`);
    layer.name = this.layerName;
    this.reloadUI();
  }

  // UIを再構築
  reloadUI() {
    this.clearUI();
    const colorStr = this.getColorString();
    const colors = String(this.getColorString()).split(',').filter(color => color.match(/^#[0-9a-fA-F]{6}$/));;
    this._makeLists(colors);
    this._makeFooter(colorStr);
    this._makeScan();
    this._makeReload();
  }

  // UIを削除
  clearUI() {
    if(this.lists !== []){
      _.each(this.lists, (list,i) => {
        this.panel.remove(list);
        delete this.lists[i];
      });
    }
    if(this.icons !== []){
      _.each(this.icons, (icon,i) => {
        this.panel.remove(icon);
        delete this.icons[i];
      });
    }
    this.lists = [];
    this.icons = [];
    if(this.footer !== false){
      this.panel.remove(this.footer);
    }
    this.footer = false;
    if(this.startText !== false){
      this.panel.remove(this.startText);
    }
    this.startText = false;
    if(this.startButton !== false){
      this.panel.remove(this.startButton);
    }
    this.startButton = false;
    if(this.scanButton !== false){
      this.panel.remove(this.scanButton);
    }
    this.scanButton = false;
    if(this.reloadButton !== false){
      this.panel.remove(this.reloadButton);
    }
    this.reloadButton = false;
  }

  // 選択されたプロパティにエクスプレッションを追加
  addExp(key) {
    // コンポジションを取得
    const activeComp = app.project.activeItem;
    if(!activeComp){
      alert('Please select Composition');
      return;
    }

    // レイヤーを取得
    const selectedProperties = activeComp.selectedProperties;
    if(selectedProperties.length !== 0){
      // レイヤーすべてにエクスプレッションを挿入する。
      app.beginUndoGroup("ColorIntegrator::addExpression");
      _.each(selectedProperties, property => property.expression = this._buildExp(key));
      app.endUndoGroup();
      return;
    }

    // 選択されているレイヤーのプロパティを探してエクスプレッションを挿入
    _.each(activeComp.selectedLayers, layer => {
      const props = [];
      if(this.getType(layer) === 'ShapeLayer'){
        props.push(layer.property("ADBE Root Vectors Group"));
      }
      props.push(layer.property("ADBE Effect Parade"));
      app.beginUndoGroup("ColorIntegrator::addExpression");
      this._scanPropertiesAndSetExpression(props, this._buildExp(key));
      app.endUndoGroup();
      return;
    });
    return;
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
    return String(text).toUpperCase();
  }

  // コンポジションに色配列を書き出す
  setColorString(text) {
    this.getColorComp().layer(this.layerName).text.sourceText.setValue(text);
  }

  // 色指定要素を抜き出す
  scan() {
    // 選択している要素によって処理を変更
    const activeComp = app.project.activeItem;
    if(!activeComp){
      alert('Please select Composition adn layer');
      return;
    }
    const selectedProperties = activeComp.selectedProperties;
    if(selectedProperties.length > 0){
      app.beginUndoGroup("ColorIntegrator::scan");
      this._scanProperties(selectedProperties);
      app.endUndoGroup();
      return;
    }
    const selectedLayers = activeComp.selectedLayers;
    if(selectedLayers.length > 0){
      app.beginUndoGroup("ColorIntegrator::scan");
      this._scanLayers(selectedLayers);
      app.endUndoGroup();
      return;
    }
    alert('No matches. Please select properties, layers or composition.');
  }

  _scanProperties(properties) {
    _.each(properties, property => {
      if(this.getType(property) === 'PropertyGroup'){
        let childProperties = [];
        for (let propertyCount = 1; propertyCount <= property.numProperties; propertyCount++) {
          childProperties.push(property(propertyCount));
        }
        return this._scanProperties(childProperties);
      }
      // このpropertyのvalue型がCOLORでないならおわり
      if (property.propertyValueType !== PropertyValueType.COLOR) {
        return
      }
      // エクスプレッションを設定不能な項目ならおわり
      if (property.canSetExpression === false) {
        return
      }
      const hex = this._rgbaToHex(property.value);
      const colors = String(this.getColorString()).split(',').filter(color => color.match(/^#[0-9a-fA-F]{6}$/));
      // 既に存在している色かを判定、その色のexpressionに置き換える
      if (colors.indexOf(hex) > -1) {
        property.expression = this._buildExp(colors.indexOf(hex));
      } else {
        // 新たに色を追加して、その番号のexpressionに置き換える
        colors.push(hex);
        this.footer.text = colors.join(',');
        this.setColorString(colors.join(','));
        property.expression = this._buildExp(colors.length-1);
        this.reloadUI();
      }
    });
  }

  _scanPropertiesAndSetExpression(properties, expression) {
    _.each(properties, property => {
      if(this.getType(property) === 'PropertyGroup'){
        let childProperties = [];
        for (let propertyCount = 1; propertyCount <= property.numProperties; propertyCount++) {
          childProperties.push(property(propertyCount));
        }
        return this._scanPropertiesAndSetExpression(childProperties, expression);
      }
      // このpropertyのvalue型がCOLORでないならおわり
      if (property.propertyValueType !== PropertyValueType.COLOR) {
        return
      }
      // エクスプレッションを設定不能な項目ならおわり
      if (property.canSetExpression === false) {
        return
      }
      property.expression = expression;
    });
  }

  _scanLayers(layers) {
    _.each(layers, layer => {
      const props = [];
      if(this.getType(layer) === 'ShapeLayer'){
        props.push(layer.property("ADBE Root Vectors Group"));
      }
      props.push(layer.property("ADBE Effect Parade"));
      return this._scanProperties(props);
    });
  }

  // リスト部分を作成して追加
  _makeLists(colors) {
    _.each(colors, (color,i) => {
      if (!color.match(/^#[0-9a-fA-F]{6}$/)) {
        return;
      }
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
        app.beginUndoGroup("ColorIntegrator::changeColor");
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
        this.reloadUI();
        app.endUndoGroup();
        return;
      };
    });
  }

  // フッター部分を作成して追加
  _makeFooter(colorStr) {
    this.footer = this.panel.add('edittext',this._getFooterBounds());
    this.footer.text = colorStr;
    this.footer.onChange = () => {
      if(this.commands.indexOf(this.footer.text) > -1){
        const command = this.footer.text;
        this[command]();
        this.footer.text = this.getColorString();
        return;
      };
      if(!this._assertColorString(this.footer.text)){
        this.footer.text = this.getColorString();
        return;
      };
      app.beginUndoGroup("ColorIntegrator::changeFooter");
      this.setColorString(this.footer.text);
      this.reloadUI();
      app.endUndoGroup();
    };
  }

  // scanボタンを作成
  _makeScan() {
    this.scanButton = this.panel.add('button',this._getScanButtonBounds());
    this.scanButton.text = 'scan';
    this.scanButton.onClick = () => this.scan();
  }

  // scanボタンを作成
  _makeReload() {
    this.reloadButton = this.panel.add('button',this._getReloadButtonBounds());
    this.reloadButton.text = 'reload';
    this.reloadButton.onClick = () => this.reloadUI();
  }

  // カラーピッカーを起動してカラーコードを返す
  _colorPicker(color) {
    const picked_color = $.colorPicker(color.replace('#','0x'));
    return '#'+('000000'+picked_color.toString(16).toUpperCase()).slice(-6);
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
    if(this.startButton !== false){
      this.startButton.bounds = this._getStartButtonBounds();
    }
    if(this.scanButton !== false){
      this.scanButton.bounds = this._getScanButtonBounds();
    }
    if(this.reloadButton !== false){
      this.reloadButton.bounds = this._getReloadButtonBounds();
    }
  }

  _getListBounds(i) {
    return {x:10+(this.panel.bounds.width-20)/2, y:10+(i*32), width:(this.panel.bounds.width-20)/2, height:30};
  }
  _getIconBounds(i) {
    return {x:10, y:10+(i*32), width:(this.panel.bounds.width-20)/2, height:30};
  }
  _getFooterBounds() {
    return {x:0, y:this.panel.bounds.height-30, width:this.panel.bounds.width, height:30};
  }
  _getStartTextBounds() {
    return {x:10, y:10, width:this.panel.bounds.width-20, height:60};
  }
  _getStartButtonBounds() {
    return {x:10, y:70, width:this.panel.bounds.width-20, height:30};
  }
  _getScanButtonBounds() {
    return {x:0, y:this.panel.bounds.height-60, width:(this.panel.bounds.width)/2, height:30};
  }
  _getReloadButtonBounds() {
    return {x:(this.panel.bounds.width)/2, y:this.panel.bounds.height-60, width:(this.panel.bounds.width)/2, height:30};
  }

  // hexを0~1のrgbaに
  _hexToRgba(hex) {
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r,g,b,1];
  }

  // 0~1のrgbaをhexに
  _rgbaToHex(rgba) {
    const r = ('00'+(rgba[0]*255).toString(16)).slice(-2);
    const g = ('00'+(rgba[1]*255).toString(16)).slice(-2);
    const b = ('00'+(rgba[2]*255).toString(16)).slice(-2);
    return String('#'+r+g+b).toUpperCase();
  }

  // カラーコードが正しいかどうか
  _assertColorString(hextext) {
    // 空文字列
    if (hextext === '') {
      return true;
    }
    // すべて半角英数
    if (hextext.match(/[^0-9a-zA-Z,#]+/)) {
      alert(`invalid input`);
      return false;
    }
    // 形式が正しい
    const colors = hextext.split(',').filter(color => color.match(/^#[0-9a-fA-F]{6}$/));;
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
    return `// **color(${key+1})** added by ColorIntegrator v${this.version}
      (function(hex){
        var r = parseInt(hex.substring(0, 2), 16) / 255;
        var g = parseInt(hex.substring(2, 4), 16) / 255;
        var b = parseInt(hex.substring(4, 6), 16) / 255;
        return [r,g,b,1];
      })(
        (function(x){
          var t = comp('_colorIntegrator').layer('colors').text.sourceText.split(',');
          if(typeof t[x] === 'undefined' || t[x] === ''){
            return 'FFFFFF';
          }
          return t[x].replace('#','');
        })(${key})
      )`;
  }

  getType(anything){
    if(anything === null || anything === 'undifiend') return null;
    var objstr = String(anything);
    if(objstr.match(/\[object (.*)\]/)){
      return objstr.match(/\[object (.*)\]/)[1];
    }
    return objstr;
  }

}
module.exports = ColorIntegrator;
