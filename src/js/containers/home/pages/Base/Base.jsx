import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import BabyForm from 'react-baby-form';

import { getValueFromEvent } from 'js/common';

import base from './base.json';

const convertList = [
  {
    code: '&amp;',
    char: '&',
  },
  {
    code: '&lt;',
    char: '<',
  },
  {
    code: '&quot;',
    char: '"',
  },
];

const converCodeToChar = (code = '') => {
  const curr = convertList.find(item => item.code === code);

  return curr === undefined ? code : curr.char;
};

const converCharToCode = (char = '') => {
  const curr = convertList.find(item => item.char === char);

  return curr === undefined ? char : curr.code;
};

const convertNum = (size = 12) => (num = 16) => Math.ceil(num * size / 12);

let ctx;

const initCanvas = (ele) => {
  ctx = ele.getContext('2d');

  ele.style.width = `${ele.clientWidth}px`;
  ele.style.height = `${ele.clientHeight}px`;

  // ele.width = ele.clientWidth;
  // ele.height = ele.clientHeight;

  ele.width = ele.clientWidth * 2;
  ele.height = ele.clientHeight * 2;

  ctx.textBaseline = "top";
  ctx.fillStyle = '#ffffff';
};

const getTextMeasure = (font, text) => {
  const width = 1000;
  const height = 200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const x = 500;
  const y = 80;

  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.clearRect(0, 0, width, height);
  ctx.fillText(text, x, y);

  // Get the pixel data from the canvas
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let v = 0; v < data.length; v += 4) {
    const currTransparent = data[v + 3];
    const currX = (v % (width * 4)) / 4;
    const currY = Math.floor(v / (width * 4));

    if (currTransparent >= 60) {
      minX = Math.min(minX, currX);
      maxX = Math.max(maxX, currX);

      minY = Math.min(minY, currY);
      maxY = Math.max(maxY, currY);
    }
  }

  if (data.some(item => item)) {
    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      offsetX: minX - x,
      offsetY: minY - y,
    };
  }

  return {
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

const jsonToXML = (json = {}) => {
  let str = '';

  const { tag, children = [], ...others } = json;
  const childrenStr = children.map(jsonToXML).join('');
  const keys = Object.keys(others);

  keys.forEach((key) => {
    const value = others[key];

    str = `${str} ${key}="${value}"`;
  });

  str = `<${tag} ${str}>${childrenStr}</${tag}>`;

  return str;
};

const getFntStr = (json = {}) => {
  return `<?xml version="1.0" encoding="utf-8"?>${jsonToXML(json)}`;
};

const download = (url, name) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
};

const downloadBlob = (blob, name) => {
  const url = window.URL.createObjectURL(blob);

  download(url, name);
};

class Base extends Component {
  state = {
    fonts: [],
    value: {
      text: '',
      minSize: 20,
      maxSize: 20,
    },
  };

  _canvasRef = createRef();

  componentDidMount() {
    this._initText();
    this._initCanvas();
  }

  componentDidUpdate(prevProps, prevState = {}) {
    const { value = {} } = this.state;
    const { value: prevValue = {} } = prevState;

    if (JSON.stringify(value) === JSON.stringify(prevValue)) {
      return;
    }

    this._refreshFonts();
  }

  onChangeForm = (baseValue = {}) => {
    const { text: baseText, ...others } = baseValue;

    const text = this._getText(baseText);
    const value = Object.assign({}, others, { text });

    this.setState({ value });
  }

  onChange = (e = {}) => {
    const text = getValueFromEvent(e);

    this._setText(text);
  }

  onClickDownload = () => {
    const { fonts = [] } = this.state;
    const ele = this._canvasRef.current;

    fonts.forEach((font = {}) => {
      const { size } = font;
      const xml = getFntStr(font);

      const xmlBlob = new Blob([xml], {type : 'application/xml'});
      const imageUrl = ele.toDataURL("image/png");

      downloadBlob(xmlBlob, `char_${size}.fnt`);
      download(imageUrl, `char_${size}.png`);
    });
  }

  _initText() {
    const { children = [] } = base;

    const text = children
      .map((item = {}) => item.code)
      .join('');

    this._setText(text);
  }

  _initCanvas() {
    const ele = this._canvasRef.current;

    if (!ele) {
      return;
    }

    initCanvas(ele);
  }

  _getText(baseText = '') {
    convertList.forEach((item = {}) => {
      const { code, char } = item;
      const reg = new RegExp(code, 'g');

      baseText = baseText.replace(reg, char);
    });

    return baseText.split('').filter((char = '', index) => {
      var firstIndex = baseText.indexOf(char);

      return firstIndex === index;
    }).join('');
  }

  _setText(baseText = '') {
    const text = this._getText(baseText);

    this._setValue({ text });
  }

  _setValue(obj, cb) {
    const { value: stateValue = {} } = this.state;

    const value = Object.assign({}, stateValue, obj);

    this.setState({ value });
  }

  _refreshFonts() {
    const { value = {} } = this.state;
    const { minSize, maxSize } = value;

    const ele = this._canvasRef.current;

    if (!ele) {
      return;
    }

    const fonts = [];

    for (let v = minSize; v <= maxSize; v += 1) {
      fonts.push(this._drawFont(v));
    }

    this.setState({ fonts });
  }

  _drawFont(size = 12) {
    const ele = this._canvasRef.current;
    const { value = {} } = this.state;
    const { text = '' } = value;

    if (!ele) {
      return;
    }

    const font = `${size}px "Courier New", Monospace`;

    ctx.font = font;

    const { children: baseChildren = [], ...others } = base;
    const { height: baseHeight = 16 } = others;

    const convert = convertNum(size);

    const num = size;
    const maxWidth = size * num * 1.5;

    let currX = size;
    let currY = size;

    const height = convert(baseHeight);

    const children = text.split('').map((char = '') => {
      const oldChild = baseChildren.find(curr => curr.code === converCharToCode(char));
      const measure = getTextMeasure(font, ('▒░▓').includes(char) ? '█' : char);

      const child = {
        tag: 'Char',
        code: converCharToCode(char),
      };

      child.width = measure.width || getTextMeasure(font, '█').width;

      if (oldChild === undefined) {
        child.offset = `0 0`;
        child.rect = `${currX + measure.offsetX} ${currY + measure.offsetY} ${measure.width} ${measure.height}`;
      } else {
        const oldOffsets = oldChild.offset.split(' ').map(item => Number(item));
        const oldRects =  oldChild.rect.split(' ').map(item => Number(item));

        child.width += (oldOffsets[0] ? 2 : 0);
        child.offset = `${oldOffsets[0] ? 1 : 0} ${ measure.offsetY}`;
        child.rect = `${currX + measure.offsetX} ${currY + measure.offsetY} ${measure.width} ${measure.height}`;
      }

      ctx.fillText(char, currX, currY);

      currX += (measure.width + 10);

      if (maxWidth - currX <= size) {
        currX = num;
        currY += (height + num);
      }

      return child;
    });

    return Object.assign({}, others, { height, children, size });
  }

  renderButton() {
    return (
      <div className="base-button">
        <div className="button-item" onClick={this.onClickDownload}>Download</div>
      </div>
    );
  }

  renderSize() {
    return (
      <div className="base-size">
        <input type="text" className="input-item" placeholder="min-size" _name="minSize" />
        <input type="text" className="input-item" placeholder="max-size" _name="maxSize" />
      </div>
    );
  }

  renderTextarea() {
    return (
      <div className="base-textarea">
        <textarea
          className="textarea-item"
          rows="5"
          _name="text"
          />
      </div>
    );
  }

  renderCanvas() {
    const style = {
      width: '100%',
      height: '1000px',
    };

    return (
      <div className="base-canvas">
        <canvas
          className="canvas-item"
          style={style}
          ref={this._canvasRef}
          />
      </div>
    );
  }

  render() {
    const { value = {} } = this.state;
    const { className } = this.props;

    const cls = classnames({
      'pages-home-base-render': true,
      [className]: !!className,
    });

    return (
      <BabyForm className={cls} value={value} onChange={this.onChangeForm}>
        { this.renderButton() }
        { this.renderSize() }
        { this.renderTextarea() }
        { this.renderCanvas() }
      </BabyForm>
    );
  }
}

export default Base;
