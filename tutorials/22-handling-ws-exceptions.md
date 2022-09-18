# 22 - Handling Websocket Exceptions

In the last tutorial we handled reconnecting a user, or participant, to a poll after they accidentally left the poll. Today, as promised, we'll handle any failed websocket connection errors, as well as other websocket exceptions which we might encounter when our react application sends messages to the server.

*Github reminder*

OK, let's get going on handling exceptions!

## Updating State to Handle Errors

The first thing we'll do is add a piece of state to hold and socket.io error, which I'll reiterate could happen on failed connection, or could be sent from the server for other reasons. We'll then display a [SnackBar](../client/src/components/ui/SnackBar.tsx) to show any error. We'll look at this snack bar once we get our state updates completed. 

Let's add the error to [state.ts](../client/src/state.ts).

First, we'll define the shape of the errors our server sends.

```ts
type WsError = {
  type: string;
  message: string;
};

type WsErrorUnique = WsError & {
  id: string;
};
```

We'll see what the deal is with `WsErrorUnique` in a bit. But it's essentially needed so that if multiple errors occur, we can close the proper error message displayed in a `SnackBar`.

We then add the errors to our state type and to the state itself.

```ts
export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  me?: Me;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
  wsErrors: WsErrorUnique[];
};

const state: AppState = proxy({
  isLoading: false,
  currentPage: AppPage.Welcome,
  wsErrors: [],
});
```

The reason we have an array is because, in theory, we could have multiple errors happen.

Let's now create actions to add and remove `wsErrors`.

```ts
  addWsError: (error: WsError): void => {
    state.wsErrors = [
      ...state.wsErrors,
      {
        ...error,
        id: nanoid(6),
      },
    ];
  },
  removeWsError: (id: string): void => {
    state.wsErrors = state.wsErrors.filter((error) => error.id !== id);
  },
```

We can now make use of these to add a new error.

## Adding SnackBar to UI

*Run storybook with `npm run storybook` to show SnackBar*

Now that you see what a `SnackBar` looks like, you can in theory see that we could get multiple websockets errors before previous errors are either manually or automatically closed. It may be overkill to deal with this "multiple-error" case, but hey, I'm all about overkill! This is the whole reason we store our errors in an array with a unique id. 

We can allow the `SnackBar` to pop up over the screen on any page. Therefore, we can add it to our top-level [App Component](../client/src/App.tsx), just like we do with our `Loader` component. 

We'll add it beneath our `Loader`, by mapping over errors and showing a Snackbar for any existing error. 

```tsx
    <Loader isLoading={currentState.isLoading} color="orange" width={120} />
    {currentState.wsErrors.map((error) => (
      <SnackBar
        key={error.id}
        type="error"
        title={error.type}
        message={error.message}
        show={true}
        onClose={() => actions.removeWsError(error.id)}
        autoCloseDuration={5000}
      />
    ))}
    <Pages />
```

We'll show our errors for a default of `5000` milliseconds. After that, the component will call the `onClose`. We'll then filter out the error with it's unique `id` using the `removeWsError` action we just created. Our websocket exceptions will have a `type` and a `message`, and we'll use these for the `SnackBar` `title` and `message`, respectively. 

But now, how to we add the errors to our state?

## Adding Errors to State from Socket.io Handlers

In our [socket-io.ts](../client/src/socket-io.ts) file, we previously created a handler to handle a connection error. This error is emitted by socket.io itself as a `connect_error` message. Let's now queue up, or add an error when this occurs. 

```ts
  socket.on('connect_error', () => {
    console.log(`Failed to connect socket`);
    // add this action
    actions.addWsError({
      type: 'Connection Error',
      message: 'Failed to Connect to the Poll',
    });

    actions.stopLoading();
  });
```

Let's also add a handler for other exception that might occur. As a review, let's look at how our server emits exceptions. This occurs in a so-called filter, [ws-catch-all-filter.ts](../server/src/exceptions/ws-catch-all-filter.ts). I don't want to go over what an exception filter is in nest-js, but feel free to go back an watch that video if you're interested. 

The main point it that we emit an `exception` event to connected clients. If we look at the fields on our exception, we see that they have a `type` and a `message`. Not that this is also what our `state.ts` expects, which was a deliberate decision. 

Let's add a handler for general exceptions. 

```ts
  socket.on('exception', (error) => {
    console.log('WS exception: ', error);
    actions.addWsError(error);
  });
```

## Testing Exceptions

### Connection Error

To show our exceptions being displayed in our SnackBar, we'll need to sort of force an error to occur from our server. 

To force a connection error, we have a Socket.io middleware in [socket-io-adapter.ts](../server/src/socket-io-adapter.ts) that basically parses our auth token and then returns an error if anything goes wrong. 

So what we can do to cause a connection error it create a poll, then refresh the page to force a connection reattempt. But before refreshing, lets change a character in our JWT inside of the browser local storage to invalidate the token signature. 

*Demonstrate tweaking the signature, any character after the second period.*

Another way we could cause this is by throwing an error in the `handleConnection` method of our [PollsGateway](../server/src/polls/polls.gateway.ts).

### General Exceptions

We'll demo these later. Right now, we're not really sending any messages from the client to the server, we're merely handling connection. But after we add some UI in the next tutorial, we'll be able to receive other websocket errors from the server.

### Small Connection Bug

We had a small bug in our application that would send us to the [WaitingRoom](../client/src/pages/WaitingRoom.tsx) page even if the user failed to make a socket connection. We can add a basic fix for now by checking that we have a `poll` field on our state in the `useEffect` of the [Pages.tsx](../client/src/Pages.tsx) file, which handles directing us to the proper page. 

```tsx
useEffect(() => {
    if (
      currentState.me?.id &&
      currentState.poll &&
      !currentState.poll?.hasStarted
    ) {
      actions.setPage(AppPage.WaitingRoom);
    }

    // add sequential check here
  }, [currentState.me?.id, currentState.poll?.hasStarted]);
```
 
## Conclusion

I hope that was somewhat useful any gives you one potential way how to handle your socket exceptions on the client. 

In the next tutorial, we'll add our UI for adding nominations, which will allow us to send a new `nominate` event to the server via Socket.io. See you then!

