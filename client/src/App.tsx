import React from 'react';
import { devtools } from 'valtio/utils';

import './index.css';
import Pages from './Pages';
import { state } from './state';

devtools(state, 'app state');
const App: React.FC = () => <Pages />;

export default App;
