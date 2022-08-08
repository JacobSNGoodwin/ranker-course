import { Poll } from 'shared/poll-types';
import { proxy } from 'valtio';

export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
}

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  poll?: Poll;
  accessToken?: string;
};

const state: AppState = proxy({
  isLoading: false,
  currentPage: AppPage.Welcome,
});

const actions = {
  setPage: (page: AppPage): void => {
    state.currentPage = page;
  },
  startOver: (): void => {
    actions.setPage(AppPage.Welcome);
  },
  startLoading: (): void => {
    state.isLoading = true;
  },
  stopLoading: (): void => {
    state.isLoading = false;
  },
  initializePoll: (poll?: Poll): void => {
    state.poll = poll;
  },
  setPollAccessToken: (token?: string): void => {
    state.accessToken = token;
  },
};

export { state, actions };
