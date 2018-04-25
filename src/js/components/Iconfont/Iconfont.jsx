import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const href = '//at.alicdn.com/t/font_639510_2gvjf0fu9ye0o1or.css';
let link;

const createDom = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  const dom = document.createElement('link');

  dom.rel = 'stylesheet';
  dom.href = href;
  document.head.appendChild(dom);

  return dom;
};

createDom();

class Iconfont extends Component {
  componentWillMount() {
    if (!link) {
      link = createDom();
      return;
    }

    if (link.href !== href) {
      link = createDom();
      return;
    }
  }

  render() {
    const { type, theme, className, ...others } = this.props;
    const cls = classnames({
      'layout-icon': true,
      [`layout-${type}`]: !!type,
      [`theme-${theme}`]: !!theme,
      [className]: !!className,
    });

    return (
      <i className={cls} {...others} />
    );
  }
}

Iconfont.propTypes = {
  type: PropTypes.string,
  theme: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error']),
};

Iconfont.defaultProps = {
  type: '',
  theme: 'default',
};

export default Iconfont;
