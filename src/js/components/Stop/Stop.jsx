import React, { Component } from 'react';
import classnames from 'classnames';

const stopFunc = e => e.stopPropagation();
const reg = /^on(?=[A-Z])/;

class Stop extends Component {
  _getOthers() {
    const { className, children, ...others } = this.props;

    const keys = Object.keys(others);
    const res = keys.reduce((a, key) => {
      if (reg.test(key) && others[key] === true) {
        a[key] = stopFunc;
      }

      return a;
    }, {});

    return res;
  }

  render() {
    const { className, children } = this.props;

    const cls = classnames({
      'components-stop-render': true,
      [className]: !!className,
    });

    const others = this._getOthers();

    return (
      <div className={cls} {...others}>
        { children }
      </div>
    );
  }
}

export default Stop;
