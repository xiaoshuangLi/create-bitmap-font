import { hydrate } from 'react-dom';

import 'css/index.scss';
import Global from './containers/global';

hydrate(
  Global,
  document.getElementById('app')
);
