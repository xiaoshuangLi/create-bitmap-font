import React, { Component, createRef } from 'react';
import { hydrate } from 'react-dom';
import classnames from 'classnames';

import { createDom } from 'js/common';

let dom;
let otherDom;

const OFFSET = 30;

const _open = (opts = {}, target) => {
  const { children, ...others } = opts;

  if (!target) {
    dom = dom || createDom('float-container');
    target = dom;
  } else {
    otherDom = target;
  }

  const element = (
    <Float {...others}>
      { children }
    </Float>
  );

  hydrate(
    element,
    target
  );
};

const _close = () => {
  hydrate(
    null,
    otherDom || dom
  );

  otherDom = null;
};

const _stop = e => e.stopPropagation();

class Float extends Component {
  constructor(props) {
    super(props);

    this.eleRef = createRef();
  }

  static propTypes = {};

  static defaultProps = {
    position: {
      x: 0,
      y: 0,
    },
  };

  componentDidMount() {
    this._setPosition();
    this._addListener();
  }

  componentDidUpdate() {
    this._setPosition();
  }

  componentWillUnmount() {
    this._removeListener();
  }

  _setPosition() {
    const { position = {} } = this.props;
    const { x, y } = position;
    const ele = this.eleRef.current;

    if (!ele) {
      return;
    }

    const rect = ele.getBoundingClientRect();
    const { width, height } = rect;
    const { innerWidth, innerHeight } = window;

    const outWidth = OFFSET + x + width >= innerWidth;
    const outHeight = OFFSET + y + height >= innerHeight;

    const top = outWidth ? (x - width) : x;
    const left = outHeight ? (y - height) : y;

    ele.style.transform = `translate(${top}px, ${left}px)`;
  }

  _addListener() {
    const ele = this.eleRef.current;

    document.addEventListener('click', _close);
    ele && ele.addEventListener('click', _stop);
  }

  _removeListener() {
    const ele = this.eleRef.current;

    document.removeEventListener('click', _close);
    ele && ele.removeEventListener('click', _stop);
  }

  render() {
    const { className, children } = this.props;

    const cls = classnames({
      'components-float-render': true,
      [className]: !!className,
    });

    return (
      <div className={cls} ref={this.eleRef}>
        { children }
      </div>
    );
  }
}

Float.open = _open;
Float.close = _close;

export default Float;
