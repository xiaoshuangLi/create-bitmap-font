import React, { Component, Children } from 'react';
import { Route, Switch } from 'react-router-dom';

import App from 'js/components/App';

const createChildrenRoutes = (basePath = '', routes = []) => {
  const items = routes.map((route = {}, i) => {
    const { path = '', children, ...others } = route;

    return (
      <Route path={`${basePath}${path}`} {...others} key={i}>
        { children }
      </Route>
    );
  });

  return items;
};

class RelativeRouter extends Component {
  renderChildren() {
    const { children, path: basePath } = this.props;

    return Children.map(children, (obj = {}) => {
      const { type: Comp, props = {}, ...others } = obj;
      const { path: childPropsPath, ...restProps } = props;

      const path = childPropsPath && `${basePath}${childPropsPath}`;

      return (
        <Comp
          path={path}
          {...others}
          {...restProps}
          />
      );
    });
  }

  render() {
    const {
      path = '',
      routes = [],
      location = {},
      children: propsChildren,
      ...others
    } = this.props;

    const items = createChildrenRoutes(path, routes);
    const children = this.renderChildren();

    return (
      <App {...others}>
        <Switch location={location}>
          { items }
          { children }
        </Switch>
      </App>
    );
  }
}

RelativeRouter.createChildrenRoutes = createChildrenRoutes;

export default RelativeRouter;
