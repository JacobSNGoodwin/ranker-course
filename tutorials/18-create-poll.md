# 18 - Creating a Poll

Last time we create a basic Welcome page with buttons that lead us to pages for creating or joining a poll. Today, we'll commence work on reaching out to our API to create the poll, and then storing this poll in the application state we created last time.

*Github reminder*

## Adding Markup and Logic to Create Page

*Start App and Click into Create Page*

If we click into the `Create` page, we currently don't have any form for creating a poll. 

We'll need to create some state and text fields to enter the name of the poll, the maximum number of votes per participant, and the the name of the person creating the poll. Let's start by adding some state for these fields.

```tsx
  const [pollTopic, setPollTopic] = useState('');
  const [maxVotes, setMaxVotes] = useState(3);
  const [name, setName] = useState('');
```

We'll then need to create some text inputs. For the `maxVotes`, we're going to use a pre-made component called [CountSelector](../client/src/components/ui/CountSelector.tsx). Let's take a look at this by running `npm run storybook`.

*Demonstrate properties and actions in `storybook`.*

Let's add an input for our topic. Note that we wrap the title and input in a div with `mb-12`, which is equivalent to `3rem`.

```tsx
      <div className="mb-12">
        <h3 className="text-center">Enter Poll Topic</h3>
        <div className="text-center w-full">
          <input
            maxLength={100}
            onChange={(e) => setPollTopic(e.target.value)}
            className="box info w-full"
          />
        </div>
      </div>
```

The `maxLength` corresponds to a maximum length for this field that we set on the server. 

We add the `CountSelector` as follows. 

```tsx
        <h3 className="text-center mt-4 mb-2">Votes Per Participant</h3>
        <div className="w-48 mx-auto my-4">
          <CountSelector
            min={1}
            max={5}
            initial={3}
            step={1}
            onChange={(val) => setMaxVotes(val)}
          />
        </div>
```

And then we add the name input.

```tsx
        <div className="mb-12">
          <h3 className="text-center">Enter Name</h3>
          <div className="text-center w-full">
            <input
              maxLength={25}
              onChange={(e) => setName(e.target.value)}
              className="box info w-full"
            />
          </div>
        </div>
```

Finally, I want to create a button to go ahead with creating the poll but posting to the `/create` endpoint of our server. But I also want to have a `Start Over` button that will send the user back to the home page.

```tsx
// beneath mb-12 div, child of flex container
    <div className="flex flex-col justify-center items-center">
        <button
          className="box btn-orange w-32 my-2"
          onClick={() => console.log('createPoll')}
          disabled={false}
        >
          Create
        </button>
        <button
          className="box btn-purple w-32 my-2"
          onClick={() => console.log('starting over')}
        >
          Start Over
        </button>
      </div>
```

For now we'll just log when we click the buttons, but we'll update this shortly. 

## Validating Data

But first, let's add some client-side validation for our inputs, just for kicks I suppose. We'll do this just beneath where have our hooks in [Create](../client/src/pages/Create.tsx).

```tsx
  const areFieldsValid = (): boolean => {
    if (pollTopic.length < 1 || pollTopic.length > 100) {
      return false;
    }

    if (maxVotes < 1 || maxVotes > 5) {
      return false;
    }

    if (name.length < 1 || name.length > 25) {
      return false;
    }

    return true;
  };
```

We'll then disable our `Create` button until we have valid fields. 

```tsx
        <button
          className="box btn-orange w-32 my-2"
          onClick={() => console.log('createPoll')}
          disabled={!areFieldsValid()}
        >
          Create
        </button>
```

## Wiring Up Start Over

Let's now wire up the Start Over Button! 

The simplest thing to do would be to use the `setPage` action that we created in the last tutorial. However, we're going to subsequently create a `startOver` action which will make sure all application storage and poll state is reset. So let's just go ahead and create this method now in [state.ts](../client/src/state.ts).


```tsx
  startOver: (): void => {
    actions.setPage(AppPage.Welcome);
  },
```

Then we can import these actions into `Create.tsx` and call this method in our button. 

```tsx
        <button
          className="box btn-purple w-32 my-2"
          onClick={() => actions.startOver()}
        >
          Start Over
        </button>
```

## API Request to Create Poll

We're only going to make HTTP REST style requests to create a poll and join a poll. To help with this, I have created a `makeRequest` function in [api.ts](../client/src/api.ts).

This file take an endpoint, and then some request options matching those from `fetch`, which it turns out have a type of `RequestInit`. 

*Brief overview of function*. 

Let's now create a `handleCreatePoll` method beneath our validation which will use this `makeRequest`. 

```tsx
  const handleCreatePoll = async () => {
    actions.startLoading();
    setApiError('');

    const { data, error } = await makeRequest<{
      poll: Poll;
      accessToken: string;
    }>('/polls', {
      method: 'POST',
      body: JSON.stringify({
        topic: pollTopic,
        votesPerVoter: maxVotes,
        name,
      }),
    });

    console.log(data, error);

    if (error && error.statusCode === 400) {
      console.log('400 error', error);
      setApiError('Name and poll topic are both required!');
    } else if (error && error.statusCode !== 400) {
      setApiError(error.messages[0]);
    } else {
      actions.initializePoll(data.poll);
      actions.setPollAccessToken(data.accessToken);
      actions.setPage(AppPage.WaitingRoom);
    }

    actions.stopLoading();
  };
```

Alright, so what we're going to do is create a sort of global loading state which will show a spinner if data is updating. We don't have this action yet, but we'll create it shortly. Notice that I also commented out setting a poll accessToken

We then tell `makeRequest` the shape of our expected data response shape. Let's hit this endpoint in Postman to review this. 

*Have Postman open to show response*

We will set an `apiError` in our component's state if there's any error. Let's add this now. 

```tsx
const [apiError, setApiError] = useState<string>('');

// in markup after Enter Name mb-12 div
        {apiError && (
          <p className="text-center text-red-600 font-light mt-8">{apiError}</p>
        )}
```

## Adding Loading and Poll to State

We now need to add some loading, accessToken, and Poll state to our proxy state.

We add `isLoading` for when we make API calls. We could separate out our loading states, but for this app, a single loading state suffices. We also add a `poll` field which is optional, because our poll will initially be undefined until it is created or joined. The access token is also allowed to be undefined, which it initially is. 

```tsx
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
```

We add an initial `isLoading` state by setting it to `false` in our `proxy`. Notice that our `poll` is initially undefined. 

Let's now add our missing actions.

```ts
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
```

So these actions are maybe a little simple. 

There's one more error I'm getting related to not yet having defined the `WaitingRoom` `AppPage`. So let's do that now. 

```ts
export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
}
```

## Wiring Up Create Button

Let's now wire up the `Create` button to the handler we just created. 

```tsx
        <button
          className="box btn-orange w-32 my-2"
          onClick={handleCreatePoll}
          disabled={!areFieldsValid()}
        >
          Create
        </button>
```

Before clicking this button, let's add the scaffold for our [WaitingRoom Page](../client/src/pages/WaitingRoom.tsx).

```tsx
import React from 'react';

export const WaitingRoom: React.FC = () => {
  return (
    <div className="flex flex-col w-full justify-between items-center h-full">
      <h3>Waiting Room</h3>
    </div>
  );
};
```

Let's also add this in our `Pages` component.

```tsx
const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
  [AppPage.WaitingRoom]: WaitingRoom,
};
```

We'll also add a `Loader` into our `App.tsx`. This `Loader` is another component I already created.

*Note the backdrop covering whole screen*

We have to refactor the component a bit.

```tsx
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
```

## Next Time

Next time we'll get to work on the `Join` component, which will be similar to this one. We may also work on some things in the state like deriving user info from their token. 

See you then!
