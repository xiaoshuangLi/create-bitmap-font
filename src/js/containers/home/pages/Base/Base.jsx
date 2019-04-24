import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import BabyForm from 'react-baby-form';

import { getValueFromEvent } from 'js/common';

import base from './base.json';

const cubeChars = '▒░▓';
const specialChars = '█╗╔═║╚╝▀▄▒░▓▌▐┐┌└┘';
const rightSpecialChars = '╔╚▐┌└';
const centerSpecialChars = '║';

const normalFont = 'game-font';
const specialFont = '"Courier New", Monospace';

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

const getFont = (size, char) => {
  const fontFamily = (char && specialChars.includes(char)) ? specialFont : normalFont;

  return `${size}px ${fontFamily}`;
};

let ctx;

const initCanvas = (ele) => {
  ctx = ele.getContext('2d');

  ele.style.width = `${ele.clientWidth}px`;
  ele.style.height = `${ele.clientHeight}px`;

  // ele.width = ele.clientWidth;
  // ele.height = ele.clientHeight;

  ele.width = ele.clientWidth;
  ele.height = ele.clientHeight;

  ctx.textBaseline = "top";
  ctx.fillStyle = '#ffffff';
};

const getImageUrl = (imageData = {}) => {
  const { width, height } = imageData;
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
};

const getTextMeasure = (size, text) => {
  const width = 1000;
  const height = 200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const x = 500;
  const y = 80;

  ctx.font = getFont(size, text);
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

    document.fonts.load("12px game-font").then(() => setTimeout(() => this._refreshFonts()));
  }

  onChangeForm = (baseValue = {}) => {
    const {
      text: baseText,
      minSize: baseMinSize,
      maxSize: baseMaxSize,
      ...others
    } = baseValue;

    const text = this._getText(baseText);
    const minSize = Number(baseMinSize);
    const maxSize = Number(baseMaxSize);

    const value = Object.assign({}, others, {
      text,
      minSize,
      maxSize,
    });

    this.setState({ value });
  }

  onChange = (e = {}) => {
    const text = getValueFromEvent(e);

    this._setText(text);
  }

  onClickDownload = () => {
    const ele = this._canvasRef.current;
    const { fonts = [], value = {} } = this.state;
    const { minSize, maxSize } = value;

    for (let v = minSize; v <= maxSize; v += 1) {
      const baseFont = this._drawFont(v);
      const { imageWidth, imageHeight, ...font } = baseFont;

      const xml = getFntStr(font);

      const xmlBlob = new Blob([xml], {type : 'application/xml'});
      const imageUrl = getImageUrl(ctx.getImageData(0, 0, imageWidth, imageHeight));

      downloadBlob(xmlBlob, `char_${v}.fnt`);
      download(imageUrl, `char_${v}.png`);
    }
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
    const { maxSize } = value;

    this._drawFont(maxSize);
  }

  _drawFont(size = 12) {
    const ele = this._canvasRef.current;
    const { value = {} } = this.state;
    const { text = '' } = value;

    if (!ele) {
      return;
    }

    ctx.clearRect(0, 0, ele.width, ele.height);

    const { children: baseChildren = [], ...others } = base;
    const { height: baseHeight = 16 } = others;

    const num = Number(size);
    const maxWidth = 512;

    let currX = num;
    let currY = num;

    const height = getTextMeasure(size, '║').height;
    const baseWidth = getTextMeasure(size, '█').width;

    const children = text.split('').map((char = '') => {
      const font = getFont(size, char);
      const oldChild = baseChildren.find(curr => curr.code === converCharToCode(char));
      const measure = getTextMeasure(size, cubeChars.includes(char) ? '█' : char);

      const child = {
        tag: 'Char',
        code: converCharToCode(char),
      };

      child.width = measure.width || baseWidth;

      if (oldChild === undefined) {
        child.offset = `0 0`;
        child.rect = `${currX + measure.offsetX} ${currY + measure.offsetY} ${measure.width} ${measure.height}`;
      } else {
        const oldOffsets = oldChild.offset.split(' ').map(item => Number(item));
        const oldRects =  oldChild.rect.split(' ').map(item => Number(item));

        if (specialChars.includes(char)) {
          const isRight = rightSpecialChars.includes(char);
          const isCenter = centerSpecialChars.includes(char);

          let offsetX = 0;

          if (isRight) {
            offsetX = baseWidth - measure.width;
          } else if (isCenter) {
            offsetX = (baseWidth - measure.width) / 2;
          }

          child.width = baseWidth;
          child.offset = `${offsetX} ${measure.offsetY}`;
          child.rect = `${currX + measure.offsetX} ${currY + measure.offsetY} ${measure.width} ${measure.height}`;
        } else {
          child.width += (oldOffsets[0] ? 2 : 0);
          child.offset = `${oldOffsets[0] ? 1 : 0} ${ measure.offsetY}`;
          child.rect = `${currX + measure.offsetX} ${currY + measure.offsetY} ${measure.width} ${measure.height}`;
        }
      }

      ctx.font = font;
      ctx.fillText(char, currX, currY);

      currX += (measure.width + 10);

      if (maxWidth - currX <= size) {
        currX = num;
        currY += (height + num);
      }

      return child;
    });

    return Object.assign({}, others, {
      height,
      children,
      size,
      imageWidth: maxWidth,
      imageHeight: currY + num * 2,
    });
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
        <input type="number" className="input-item" placeholder="min-size" _name="minSize" />
        <input type="number" className="input-item" placeholder="max-size" _name="maxSize" />
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
      minWidth: '600px',
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
