import React from 'react';

import { createBundle } from 'js/components/Bundle';
import RelativeRouter from 'js/components/RelativeRouter';

const routes = [
  {
    exact: true,
    component: createBundle(() => import('./pages/Base')),
  },
];

const rootRoute = (
  <RelativeRouter path="/home" routes={routes} />
);

export default rootRoute;
