# 20 - Connecting to Socket.io Server from React

Last time, we add finished up our form and api request to allow a participant to join an existing poll. Now that we're able to create or join a poll, we want to be able to take the token returned by those endpoints, and use it to connect to a particular socket.io room on our server. That's because from this point on, all data transfer between server and client will be real-time using Websockets. 

That's what we'll get to work on today!

*Github reminder*

## Adding Socket to our Valtio State

Before establishing our socket.io connection, I want to define it on the type of our state. We could connect to the socket.io server in the NestJS application without storing it on our state, but I found given our socket.io client access to our application state and actions to be quite useful. 

This may not make sense now, but hopefully it will be the end of the tutorial. 

We add the `Socket` client provided by Socket.io to our [state](../client/src/state.ts) as follows.

```ts
import { Socket } from 'socket.io-client';

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  me?: Me;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
};
```

We will not add the `poll` to our initial state. We'll just let it be initially undefined. 

Next, I want to create an `action` to initialize a socket connection if one doesn't exist, or reconnect if we DO have a socket as a part of our state.

```ts
  // update import
  import { proxy, ref } from 'valtio';

  initializeSocket: (): void => {
    if (!state.socket) {
      state.socket = ref(
        createSocketWithHandlers({
          socketIOUrl,
          state,
          actions,
        })
      );
    } else {
      state.socket.connect();
    }
  },
```

We have yet to define the `createSocketWithHandlers` method. But this basically creates our socket client, which itself holds the event handler. These event handlers will receive messages from the server when our poll receives any updates, or when it's completed. 

*See [valtio](https://github.com/pmndrs/valtio)*

So what is a `ref`?  This allows us to store the an object in valtio without tracking any changes to it. We really just want a reference to the `Socket`, which manages itself. The `connect()` method is a method provided on a `Socket` client. We're passing the `state` to the `createSocketWithHandlers` to get access to the `accessToken` we're storing on the state. The `actions` allow us to update our state from within the socket client's event handlers. 

## Creating the Socket (Connecting!)

We'll add our socket client logic in [socket-io.ts](../client/src/socket-io.ts).

First, let's define the socket's URL based on environment variables. 

```ts
export const socketIOUrl = `http://${import.meta.env.VITE_API_HOST}:${
  import.meta.env.VITE_API_PORT
}/${import.meta.env.VITE_POLLS_NAMESPACE}`;
```

Then we can import this into our `state.ts` file. 

```ts
import { socketIOUrl } from './socket-io';
```

We probably could have just defined our `createSocketWithHandlers` function without accepting a socketUrl, but if I were to actually go through testing in this tutorial, it's often useful to be able to mock or inject values into your functions this way. 

Before leaving this file, I want to extract the type of our actions using the following: 

```ts
export type AppActions = typeof actions;
```

Now I'm noticing that I have some named exports at the bottom and some throughout the file. Feel free to clean this up if you'd like. 

Let's define the socket creation function now.

```ts
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

  return socket;
};
```

The `socket.io` library has an event called `connect` that is automatically fired when we connect to the server. 

So let's just check that this is being fired with a `console.log`. Notice that our function returns the `Socket`, which you will recall we stored in our state. So we'll explore our state with redux-devtools to make sure it's stored.

But we need to also import this function into `state.js`.

```ts
import { createSocketWithHandlers, socketIOUrl } from './socket-io';
```


## Calling initializeSocket Action

I forgot to do one more thing... and that is to fire the `initializeSocket` action we just created. There are a few places you could fire this. I'll to it upon entering our currently empty [WaitingRoom](../client/src/pages/WaitingRoom.tsx) page in a `useEffect`.

```ts
  useEffect(() => {
    console.log('Waiting room useEffect');
    actions.initializeSocket();
  }, []);
```

*Demo connection when creating a poll*.

## Updating Poll in State

When we connect to your server via socket.io, an event is sent back to the client called `poll_updated`. Let's take a quick look at this handler in [polls.gateway.ts](../server/src/polls/polls.gateway.ts). We the client connect, we reach out to `addParticipant`, and then send a `poll_updated` message.

```ts
  const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);
```

So let's receive this message in [socket-io.ts](../client/src/socket-io.ts).

```ts
  socket.on('poll_updated', (poll) => {
    console.log('event: "poll_updated" received', poll);
    actions.updatePoll(poll);
  });
```

And then we need to define this new action!

```ts
  updatePoll: (poll: Poll): void => {
    state.poll = poll;
  },
```

When working on the server, I mentioned that I previously had events and methods for updating individual pieces of a poll. For example, upon connection, we previously received a `participants_updated` event. However, I decided to keep things simple. But there are definitely good reasons to only update pieces of the state in terms of not sending huge updates to the client. However, you also run sum risk of not having poll state match between client and server, so there are some tradeoffs.

Let's take this for a spin!

*Demo with at least 2 browser windows*

## Conclusion

Next time we'll get working on the UI of the `WaitingRoom`. This is where the various participants can submit their nominations in response to the poll topic. It's a little bit UI heavy, but you'll also get to see our real-time updates at work!

There's also some work we might do on `reconnecting` a user if they have a valid `token` in their browser storage. See you then!