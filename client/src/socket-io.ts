import { io, Socket } from 'socket.io-client';
import { AppActions, AppState } from './state';

export const socketIOUrl = `http://${import.meta.env.VITE_API_HOST}:${
  import.meta.env.VITE_API_PORT
}/${import.meta.env.VITE_POLLS_NAMESPACE}`;

type CreateSocketOptions = {
  socketIOUrl: string;
  state: AppState;
  actions: AppActions;
};

export const createSocketWithHandlers = ({
  socketIOUrl,
  state,
  actions,
}: CreateSocketOptions): Socket => {
  console.log(`Creating socket with accessToken: ${state.accessToken}`);
  const socket = io(socketIOUrl, {
    auth: {
      token: state.accessToken,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log(
      `Connected with socket ID: ${socket.id}. UserID: ${state.me?.id} will join room ${state.poll?.id}`
    );
  });

  socket.on('poll_updated', (poll) => {
    console.log('event: "poll_updated" received', poll);
    actions.updatePoll(poll);
  });

  return socket;
};
