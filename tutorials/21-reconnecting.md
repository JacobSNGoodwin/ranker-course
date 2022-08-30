# 21 - Reconnecting to a Poll and Leaving Poll

Last time we were able to establish a socket.io connection between our client and server. Today, we'll learn how to reestablish the connection if the user accidentally navigates away or closes their browser tab, and send them to the proper Page of the application based on the poll's state.

Well also learn how to leave a poll.

*Reminder of Github repo*

## Reconnecting

Let's demo what happens when a user has connected to the poll, and then refreshes the page.

The entire single page application will reload. But we didn't store the poll or any of its data in local storage, though that would be an option. The application's memory gets cleared, and therefore we have no state or info about the poll.

However, we do store the user's accessToken which gives a reference to the poll they belong to. So what we'll do, it make a quick check that this token.

We'll do this at the top level of our app, which is the [App](../client/src/App.tsx) component.

*Review getTokenPayload, which we may earlier.*

```tsx
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
```

This is nearly complete. However, if we try to reload our application, we'll see that the loader does not go away...we'll also see that we don't have our token in local storage. That's because if we look at our `subscribeKey` in [state.ts](../client/src/state.ts), we see that our token will get deleted from storage if we do not have both the poll and the accessToken. So this is causing an issue.

I think that we probably no longer need to check if we have both a poll and an access token. I think checking for a `poll` was a legacy of how I originally wrote this code. Maybe we'll find out I was wrong later, but hopefully this will be good!

```ts
subscribeKey(state, 'accessToken', () => {
  if (state.accessToken) {
    localStorage.setItem('accessToken', state.accessToken);
  }
});
```

We still need an `if` statement since `localStorage.setItem` requires a string and does not allow undefined. 

Anyhow, to get the loader to go away and the token to reset, we need to stop loading. But instead of `stopLoading` in the `useEffect`, we'll add it to the `connect` handler in [socket-io.ts](../client/src/socket-io.ts).

```ts
  socket.on('connect', () => {
    console.log(
      `Connected with socket ID: ${socket.id}. UserID: ${state.me?.id} will join room ${state.poll?.id}`
    );

    // add this
    actions.stopLoading();
  });
```

*Show the updated state. The UI still shows the Welcome page, but the loading stops. Consider slowing your network connection to see loader.*

## Navigating to Proper page

To keep things from going on for too long today, we'll wrap up with setting up the logic for sending the user to the proper page after reconnecting.

Right now, there's only one page to go to if the user is re-connected. And that is the waiting room. If we look at our poll's state in the redux devtools, we can see that our poll has a flag for `hasStarted`. That means that all users have submitted nominations. We'll add a page where the participants actually vote later on. But that's where the users will be pushed to if the poll `hasStarted`.

We'll do these transitions in the [Pages](../client/src/Pages.tsx) component.

```tsx
  useEffect(() => {
    if (currentState.me?.id && !currentState.poll?.hasStarted) {
      actions.setPage(AppPage.WaitingRoom);
    }

    // add sequential check here
  }, [currentState.me?.id, currentState.poll?.hasStarted]);
```

*Demo*

## Stop Loading on Socket Connection Failure

However, what if there's a connection failure? Then our app will be in a permanent loading state. I guess this isn't the end of the world, as any person would try to refresh. However, socket-io provides a [connect-error](https://socket.io/docs/v4/client-socket-instance/#connect_error) event for connection errors.

We can use this to log an error and then stop loading. 

```ts
  socket.on('connect_error', () => {
    console.log(`Failed to connect socket`);

    actions.stopLoading();
  });
```

That's a start, but how can we actually show users that there was an error, instead of causing them to throw their laptop or phone on the floor? Well, we'll handle socket errors next time... so I hope you don't throw your laptop on the floor or at the wall!

## Conclusion

That's all for today. Next time, we'll have learn how to handle errors for both connection errors and general server errors that our socket sends.