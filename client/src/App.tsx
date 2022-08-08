import React from 'react';
import { useSnapshot } from 'valtio';
import { devtools } from 'valtio/utils';
import Loader from './components/ui/Loader';

import './index.css';
import Pages from './Pages';
import { state } from './state';

devtools(state, 'app state');
const App: React.FC = () => {
  const currentState = useSnapshot(state);

  return (
    <>
      <Loader isLoading={currentState.isLoading} color="orange" width={120} />
      <Pages />
    </>
  );
};

export default App;
