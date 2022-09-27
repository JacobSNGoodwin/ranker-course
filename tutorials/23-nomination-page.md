# 23 - Nomination UI and Events

Now that we have our state, socket connection, and error handling set up, we're ready to build out the final pages of UI of our application.

Right now, we have a placeholder page for nominating poll responses, and today we'll add the ability to add nominations and send them to all clients connected to our poll via socket connection so all users can see the nominations.

*Github reminder*

## Adding New State Actions and Socket Events

*Application is up and running*

Before adding the UI, we need to provide `actions` on our [state](../client/src/state.ts). These actions, in turn, will need to emit socket events, which we've yet to do. This will be pretty straight forward, though.

We're going to add 5 actions that our page will use. 

First, we'll add the event that allows each participant to `nominate` a candidate response to the poll. 

```ts
  nominateEvent: (text: string): void => {
    state.socket?.emit('nominate', { text });
  },
```

This is our first example of emitting an event with the socket.io client! Recall that our `state.socket` stores our socket, specifically with a reference to the `polls` namespace. Recall that our state stores a reference only to the socket, and does not manage it's properties.  

Next, we'll add each participant the ability to leave the poll, going back to the home screen. To do this, we'll update a `startOver` action. I actually forgot we had this. It looks like we use this in the pages where a user creates or joins a poll. 

```ts
  // startOver will replace existing action method
  startOver: (): void => {
    actions.reset();
    localStorage.removeItem('accessToken');
    actions.setPage(AppPage.Welcome);
  },
  reset: (): void => {
    state.socket?.disconnect();
    state.poll = undefined;
    state.accessToken = undefined;
    state.isLoading = false;
    state.socket = undefined;
    state.wsErrors = [];
  },
```

Next, I want to some "admin-only" actions. The first will be to remove a nomination. This isn't a necessary feature, but I thought I would build it for kicks.

```ts
  removeNomination: (id: string): void => {
    state.socket?.emit('remove_nomination', { id });
  },
```

Let's also add an action to remove a participant, just in case some creeper joins the poll. 

```ts
  removeParticipant: (id: string): void => {
    state.socket?.emit('remove_participant', { id });
  },
```

And lastly, we'll add a `startVote` event so that the admin can determine that all of the votes are in, and the vote is ready to start.

```ts
  startVote: (): void => {
    state.socket?.emit('start_vote');
  },
```

Alright, I think and hope that's all!

## State and Methods for WaitingRoom

*Open up storybook with `npm run storybook`*

Time for some react work, eh.

We call the page where we add nominations the [WaitingRoom](../client/src/pages/WaitingRoom.tsx), as each participant can start nominating candidates for the poll, while also waiting for other users to join the poll. Let's open this page and start building it out. 

You may also want to run `npm run storybook`, which has a demo of some of the pre-built UI component we are using for this application. 

Let's add the state that we'll be tracking in this component. It's actually quite a lot. If this component had more effects and craziness going on, I might opt for a `useReducer` hook, but I'm fine living with several `useState` hooks in this case.

```tsx
  const [_copiedText, copyToClipboard] = useCopyToClipboard();
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isNominationFormOpen, setIsNominationFormOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [participantToRemove, setParticipantToRemove] = useState<string>();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentState = useSnapshot(state);
```

We'll import a nice little hook called `useCopyToClipboard` from the `react-use` library. We'll also pull in the current state "snapshot."

Let's also add some methods that might require doing more complex things with state.

```tsx
  const confirmRemoveParticipant = (id: string) => {
    setConfirmationMessage(
      `Remove ${currentState.poll?.participants[id]} from poll?`
    );
    setParticipantToRemove(id);
    setIsConfirmationOpen(true);
  };

  const submitRemoveParticipant = () => {
    participantToRemove && actions.removeParticipant(participantToRemove);
    setIsConfirmationOpen(false);
  };
```

These methods handle the confirmation process of removing a participant. We don't want the admin to remove a user without confirming this via a dialog box. If you watched the server-side portion of this course, you'll know that we sort of guarded the websocket event handler to remove participants so that only the admin can do that. 

## State Updates

Next, I was having some trouble with Valtio and the typing of `derived`. One of the challenges is that I have "derived" state based on other "derived" state. 

I found out that there was another way we can handle this issue, and that is by using the JS keyword `this`, as well as making use of `getters` inside of the object passed to the proxies. And example can be found at [in this example](https://github.com/pmndrs/valtio/discussions/161) and [this other issue](https://github.com/pmndrs/valtio/discussions/468). So, while I hate to leave `derive` behind, I think we're going to do it!

So we're going to update our AppState type, and then compute all of our fields using JS getters.

```ts
// remove derive from import
import { subscribeKey } from 'valtio/utils';

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
  wsErrors: WsErrorUnique[];
  me?: Me;
  isAdmin: boolean;
};

// Note the explicit type annotation
const state = proxy<AppState>({
  isLoading: false,
  currentPage: AppPage.Welcome,
  wsErrors: [],
  get me() {
    const accessToken = this.accessToken;

    if (!accessToken) {
      return;
    }

    const token = getTokenPayload(accessToken);

    return {
      id: token.sub,
      name: token.name,
    };
  },
  get isAdmin() {
    if (!this.me) {
      return false;
    }
    return this.me?.id === this.poll?.adminID;
  },
});

// delete stateWithComputed

// update export to no export stateWithComputed
export { state, actions };
```
### New Derived Properties

The above example works because `this` will refer to a snapshot of the sate. There may be some issues with heavy computations using this approach, but our derived properties are really light weight. So I'm really not worried about any performance issues.

We'll now add 3 more derived properties, or getters, that will be used in the UI that we will add. 

```ts
export type AppState = {
  // ...
  nominationCount: number;
  participantCount: number;
  canStartVote: boolean;
};
```

```ts
const state = proxy<AppState>({
  // ...
  get participantCount() {
    return Object.keys(this.poll?.participants || {}).length;
  },
  get nominationCount() {
    return Object.keys(this.poll?.nominations || {}).length;
  },
  get canStartVote() {
    const votesPerVoter = this.poll?.votesPerVoter ?? 100;

    return this.nominationCount >= votesPerVoter;
  },
})
```

## Adding the UI (JSX)

Let's now actually add the markup, or JSX.

### New Header and Buttons

Let's replace our current "Waiting Room" header tag with the following.

```tsx
        <div>
          <h2 className="text-center">Poll Topic</h2>
          <p className="italic text-center mb-4">{currentState.poll?.topic}</p>
          <h2 className="text-center">Poll ID</h2>
          <h3 className="text-center mb-2">Click to copy!</h3>
          <div
            onClick={() => copyToClipboard(currentState.poll?.id || '')}
            className="mb-4 flex justify-center align-middle cursor-pointer"
          >
            <div className="font-extrabold text-center mr-2">
              {currentState.poll && colorizeText(currentState.poll?.id)}
            </div>
            <MdContentCopy size={24} />
          </div>
        </div>
```

This outer `div` is because the main page is a column with space justified between. We want this header to appear at the top. Notice that we make use of the `copyToClipboard` exposed by the 3rd-party hook that we're using. 

We also make use of a `Copy` icon from our icons library that is installed as a part of this project. 

We also use a [utility](../client/src/util.tsx) function called `colorizeText`. This just shows numbers as orange and letters as purple, as some character are difficult to distinguish, like distinguishing between `1` and `l` or `0` and `O`.

Next, let's add what is not my greatest achievement in UI design. But hey, this is a tutorial, and you get what you paid for. 

```tsx
        <div className="flex justify-center">
          <button
            className="box btn-orange mx-2 pulsate"
            onClick={() => setIsParticipantListOpen(true)}
          >
            <MdPeopleOutline size={24} />
            <span>{currentState.participantCount}</span>
          </button>
          <button
            className="box btn-purple mx-2 pulsate"
            onClick={() => setIsNominationFormOpen(true)}
          >
            <BsPencilSquare size={24} />
            <span>{currentState.nominationCount}</span>
          </button>
        </div>
```

Let's see what this buttons look like. Note that the first button shows the number of participants, and then opens a "participant list", the second button shows the number of nominations and opens a nomination form. We also use some icons in these buttons. 

### Participant List and Nomination Forms

That's great that we can show these forms, but we need to actually add the forms!

Let's now add these components! For a preview, we can check these out in storybook.

* [ParticipantList](../client/src/components/ParticipantList.tsx)
* [NominationForm](../client/src/components/NominationForm.tsx.tsx)
* [ConfirmationDialog](../client/src/components/ui/ConfirmationDialog.tsx)

Now that we've seen these components, let's add them to the bottom of our screen.

```tsx
// wrap in Fragment
<>
      {/* ... */}
      <div>
        {/* ... */}
        <div className="flex flex-col justify-center">
          {currentState.isAdmin ? (
            <>
              <div className="my-2 italic">
                {currentState.poll?.votesPerVoter} Nominations Required to
                Start!
              </div>
              <button
                className="box btn-orange my-2"
                disabled={!currentState.canStartVote}
                onClick={() => console.log('will add start vote next time!')}
              >
                Start Voting
              </button>
            </>
          ) : (
            <div className="my-2 italic">
              Waiting for Admin,{' '}
              <span className="font-semibold">
                {currentState.poll?.participants[currentState.poll?.adminID]}
              </span>
              , to start the voting.
            </div>
          )}
          <button
            className="box btn-purple my-2"
            onClick={() => setShowConfirmation(true)}
          >
            Leave Poll
          </button>
          <ConfirmationDialog
            message="You'll be kicked out of the poll"
            showDialog={showConfirmation}
            onCancel={() => setShowConfirmation(false)}
            onConfirm={() => actions.startOver()}
          />
        </div>
      </div>
      <ParticipantList
        isOpen={isParticipantListOpen}
        onClose={() => setIsParticipantListOpen(false)}
        participants={currentState.poll?.participants}
        onRemoveParticipant={confirmRemoveParticipant}
        isAdmin={currentState.isAdmin || false}
        userID={currentState.me?.id}
      />
      <NominationForm
        title={currentState.poll?.topic}
        isOpen={isNominationFormOpen}
        onClose={() => setIsNominationFormOpen(false)}
        onSubmitNomination={(nominationText) =>
          actions.nominate(nominationText)
        }
        nominations={currentState.poll?.nominations}
        userID={currentState.me?.id}
        onRemoveNomination={(nominationID) =>
          actions.removeNomination(nominationID)
        }
        isAdmin={currentState.isAdmin || false}
      />
      <ConfirmationDialog
        showDialog={isConfirmationOpen}
        message={confirmationMessage}
        onConfirm={() => submitRemoveParticipant()}
        onCancel={() => setIsConfirmationOpen(false)}
      />
</>
```

*Review all of this markup*

## Testing out Application

* Open 3 browsers
* Show state in dev tools

That's all for today, y'all. Next time, we're going to add an event to state the voting, and then send the user to the actual voting page. I think the UI on that page should be a little less heavy than today's. So see you then!