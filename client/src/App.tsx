import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { devtools } from 'valtio/utils';
import Loader from './components/ui/Loader';

import './index.css';
import Pages from './Pages';
import { actions, state } from './state';
import { getTokenPayload } from './util';

devtools(state, 'app state');
const App: React.FC = () => {
  const currentState = useSnapshot(state);

  useEffect(() => {
    console.log('App useEffect - check token and send to proper page');

    actions.startLoading();

    const accessToken = localStorage.getItem('accessToken');

    // if there's not access token, we'll be shown the default
    // state.currentPage of AppPage.Welcome
    if (!accessToken) {
      actions.stopLoading();
      return;
    }

    const { exp: tokenExp } = getTokenPayload(accessToken);
    const currentTimeInSeconds = Date.now() / 1000;

    // Remove old token
    // if token is within 10 seconds, we'll prevent
    // them from connecting (poll will almost be over)
    // since token duration and poll duration are
    // approximately at the same time
    if (tokenExp < currentTimeInSeconds - 10) {
      localStorage.removeItem('accessToken');
      actions.stopLoading();
      return;
    }

    // reconnect to poll
    actions.setPollAccessToken(accessToken); // needed for socket.io connection
    // socket initialization on server sends updated poll to the client
    actions.initializeSocket();
  }, []);

  return (
    <>
      <Loader isLoading={currentState.isLoading} color="orange" width={120} />
      <Pages />
    </>
  );
};

export default App;
