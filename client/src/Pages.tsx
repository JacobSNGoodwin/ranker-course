import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { useSnapshot } from 'valtio';
import Create from './pages/Create';
import Join from './pages/Join';
import Welcome from './pages/Welcome';
import { AppPage, state } from './state';

const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
};

const Pages: React.FC = () => {
  const currentState = useSnapshot(state);
  return (
    <>
      {Object.entries(routeConfig).map(([page, Component]) => (
        <CSSTransition
          key={page}
          in={page === currentState.currentPage}
          timeout={300}
          classNames="page"
          unmountOnExit
        >
          <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
            <Component />
          </div>
        </CSSTransition>
      ))}
    </>
  );
};

export default Pages;
