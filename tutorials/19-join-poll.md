# 19 - Joining a Poll

Well, I hate to undersell this tutorial, but it will be a little more of the same things we saw last time. But instead of joining a poll, we're going to hit our API endpoint for joining an existing poll.

*Github reminder*

## Adding UI and Validation to Join Page

Right now, our [Join page](../client/src/pages/Join.tsx) doesn't really have anything but a placeholder. So let's add some state to hold our form field data, along with a validator method to make sure our data is valid before submitting it to the server.

```tsx
const Join: React.FC = () => {
  const [pollID, setPollID] = useState('');
  const [name, setName] = useState('');
  const [apiError, setApiError] = useState('');

  const areFieldsValid = (): boolean => {
    if (pollID.length < 6 || pollID.length > 6) {
      return false;
    }

    if (name.length < 1 || name.length > 25) {
      return false;
    }

    return true;
  };

  return (
    <div className="flex flex-col w-full justify-around items-stretch h-full mx-auto max-w-sm">
      <h3 className="text-center">Enter Code Provided by &quot;Friend&quot;</h3>
    </div>
  );
};
```

In this form, we'll end up providing a `pollID` to tell the App what poll we want to join, whereas with the [Create Page](../client/src/pages/Create.tsx) we submitted the number of votes per vote. 

Let's now update some of the JSX we return. Let's replace the content inside of the outer div.

```tsx
// import actions and add handleJoinPoll
  const handleJoinPoll = () => console.log('joinPoll');

//...
      <div className="mb-12">
        <div className="my-4">
          <h3 className="text-center">
            Enter Code Provided by &quot;Friend&quot;
          </h3>
          <div className="text-center w-full">
            <input
              maxLength={6}
              onChange={(e) => setPollID(e.target.value.toUpperCase())}
              className="box info w-full"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
        <div className="my-4">
          <h3 className="text-center">Your Name</h3>
          <div className="text-center w-full">
            <input
              maxLength={25}
              onChange={(e) => setName(e.target.value)}
              className="box info w-full"
            />
          </div>
        </div>
        {apiError && (
          <p className="text-center text-red-600 font-light mt-8">{apiError}</p>
        )}
      </div>
      <div className="my-12 flex flex-col justify-center items-center">
        <button
          disabled={!areFieldsValid()}
          className="box btn-orange w-32 my-2"
          onClick={handleJoinPoll}
        >
          Join
        </button>
        <button
          className="box btn-purple w-32 my-2"
          onClick={() => actions.startOver()}
        >
          Start Over
        </button>
      </div>
```

*Go over markup, including auto capitalization of poll ID or code input. Test the start over button.*

## Adding Join Poll handler

Let's now implement the `handleJoinPoll` method where we currently only have a `console.log`. 

```tsx
const handleJoinPoll = async () => {
    actions.startLoading();
    setApiError('');

    const { data, error } = await makeRequest<{
      poll: Poll;
      accessToken: string;
    }>('/polls/join', {
      method: 'POST',
      body: JSON.stringify({
        pollID,
        name,
      }),
    });

    if (error && error.statusCode === 400) {
      setApiError('Please make sure to include a poll topic!');
    } else if (error && !error.statusCode) {
      setApiError('Unknown API error');
    } else {
      actions.initializePoll(data.poll);
      actions.setPollAccessToken(data.accessToken);
      actions.setPage(AppPage.WaitingRoom);
    }

    actions.stopLoading();
  };
```

We first call our `startLoading` action, which we can use to show our sort of global app state loader in [App.tsx](../client/src/App.tsx). Recall that we can "type" our `makeRequest` to tell it our expected data type. We handle setting an API error message within this functional component's state. *Show apiError in markup*. If all goes well, we'll set out poll and access token in our state. 

## Demo

*Open 3 browser windows side-by-side and demo creating a poll, and then joining with 2 other users. Show application state.*

## Deriving User From Token

*With [Valtio Docs](https://github.com/pmndrs/valtio) open*

Since what we did today was a lot of repetition and using what we did last time, I wanted to take the time to add a couple more features to our App State.

The first feature I want to add is to derive the user's info from their token. To do this, we'll use the `derive` utility provided by Valtio. Notice that we need to use a `get` method inside of derive to "get" whatever the current state snapshot is. 

The first think I want to do is refactor our state so that we're exporting the "derived" proxy.

```ts
const stateWithComputed: AppState = derive(
  {
    // TODO - add derived state
  },
  {
    proxy: state,
  }
);

// ...
export { stateWithComputed as state, actions };
```

We're now going to create a new piece of state called `me`, which will contain our name and participant, or user, id.

```ts
    me: (get) => {
      const accessToken = get(state).accessToken;

      if (!accessToken) {
        return;
      }

      const token = getTokenPayload(accessToken);

      return {
        id: token.sub,
        name: token.name,
      };
    },
```

So we get the access token. Then we parse it by importing a utility function that I previously created called `getTokenPayload`, which basically just extracts the token payload from base64. But don't worry, we won't be relying on this extracted token data for communicating with the server, we'll be sending the full token.

*With [jwt.io](jwt.io) opened...*

If we take a look at `getTokenPayload`, you can see that we'll just getting the middle part of the JWT, where each section is separated by a period. We then convert that base64 to a normal text string, and then parse that into JSON. 

You'll notice there's a deprecation warning, and that's probably because we have node typings in the app, even though we're working on the client. So you can either ignore this deprecation warning, or else you can prefix it with `window` as follows.

```ts
JSON.parse(window.atob(accessToken.split('.')[1]));x
```

Let's kind of add some derived state on top of derived state. This will be a little `isAdmin` which will determine if the user's `id` matches the poll's `adminID`. We add it as follows:

```ts
    isAdmin: (get) => {
      return get(state).me?.id === get(state).poll?.adminID;
    },
```

We now get a warning that `me` doesn't exist on the `state`. Typing with `derive` is a little awkward, but it's something valtio folks know about. Anyhow, we can simply add the type to our `AppState.`

```ts
type Me = {
  id: string;
  name: string;
};

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  me?: Me;
  poll?: Poll;
  accessToken?: string;
};
```

*Demo in redux devtools*

## Fix IsAdmin Bug

The above `isAdmin` function has a bug. It will returned true is both the poll and `me` are undefined. So let's just say that if `me` is undefined, `isAdmin` is false.

```ts
    isAdmin: (get) => {
      if (!get(state).me) {
        return false;
      }
      return get(state).me?.id === get(state).poll?.adminID;
    },
```

## Setting Token in Local Storage with Subscription

The final thing we'll do is set the participant's access token in the browser's local storage. The main reason for this is so that they can automatically reconnect to a poll if they, say, accidentally close their browser tab. To do this, we can use valtio's `subscribeKey` to watch for changes on the `accessToken` field, and then set the access token in local storage.

```ts
subscribeKey(state, 'accessToken', () => {
  if (state.accessToken && state.poll) {
    localStorage.setItem('accessToken', state.accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }
});
```

## Next Time

With the users having gotten a token by either creating or joining a poll, we're ready to get to work on connecting our participants via websockets to a particular socket.io "room". So see you next time, where will setup a model to handle our emitting socket events from client to server, and then receiving events send from the server. 

