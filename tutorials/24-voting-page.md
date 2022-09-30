# 24 - Voting Page and Events

Last time, we added the UI for participants to add their nominations to the poll. We also added UI to show the participants who have joined. We gave the admin the ability to remove both participants and nominations they don't like. 

Today, we'll handle starting the vote. So we'll need to scaffold out a new page, as well as send an event to the server to start the poll. If the poll is started, we'll then need to make sure participants are sent to this page. 

We'll also fix an issue where if a participant is kicked out of the poll by the admin, they were not sent back to the home page.

*Reminder to checkout github repo*

## Minor Fixes

Alright, we're going to start with a few fixes.

### Update Deprecated Code in Valtio Devtools

In the [App Component](../client/src/App.tsx), we're getting a warning about a deprecated usage of `devtools` from valtio. Let's fix this.

```ts
devtools(state, { name: 'app state' });
```

### Minor Update to actions.initializeSocket

There was an issue with hot reloading on our application, where we attempt to "maybe" reinitialize our socket from the `WaitingRoom`. The problem is that our socket hasn't been disconnected, we we ended up having a loading state set, but never cleared.

So we'll update our action as follows in [state.ts](../client/src/state.ts).

```ts
  initializeSocket: (): void => {
    if (!state.socket) {
      state.socket = ref(
        createSocketWithHandlers({
          socketIOUrl,
          state,
          actions,
        })
      );

      return;
    }

    if (!state.socket.connected) {
      state.socket.connect();
      return;
    }

    actions.stopLoading();
  },
```
*This code is a little difficult to reason about. Maybe you can come up with a nicer way to do this.*

## Send User to the Welcome Page if They're Removed from poll

Last time, we had a little bug where, if the admin removed a participant from a poll, they were not sent back to the [Welcome](../client/src/pages/Welcome.tsx) page. 

So what we need to do, is add some logic to one of our effect hooks in a top-level component, which well reset this participant's poll state if they're no longer in the poll. 

Recall that we added an action called `startOver` in [state.ts](../client/src/state.ts) last time that handles resetting application state and sending a participant to the home page. We'll make use of this in a `useEffect` in our [App Component](../client/src/App.tsx).

```tsx
  useEffect(() => {
    console.log('App useEffect - check current participant');
    const myID = currentState.me?.id;

    if (
      myID &&
      currentState.socket?.connected &&
      !currentState.poll?.participants[myID]
    ) {
      actions.startOver();
    }
  }, [currentState.poll?.participants]);
```

It's helpful to look at the sequence of actions in the `devtools` for this. We first set, or define a reference to the socket in the state. However the participants will not be updated (on the server) until we have a connection. We then receive `poll_updated` from the server, and that's when participants get updates, and our effect gets run. 

## Scaffold Voting Page

It's finally time to start working on the new page. First, we need to scaffold out the page.

Let's create a [Voting.tsx](../client/src/pages/Voting.tsx) page and add some basic markup just so we have something to show on the page.

```tsx
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { state, actions } from '../state';

export const Voting: React.FC = () => {
  const currentState = useSnapshot(state);
  const [rankings, setRankings] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmVotes, setConfirmVotes] = useState(false);

  return (
    <div className="mx-auto flex flex-col w-full justify-between items-center h-full max-w-sm">
      <div className="w-full">
        <h1 className="text-center">Voting Page</h1>
      </div>
    </div>
  );
};
```
We add some state for 2 separate confirmation dialog. You may remember we used a prebuilt [Confirmation Dialog](../client/src/components/ui/ConfirmationDialog.tsx) in the last tutorial to confirm actions. These will confirm cancelling the vote as well as confirming that they're completed. 

Let's do one more little thing, and that's to add an enum for this page to [state.ts](../client/src/state.ts).

```ts
export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
  Voting = 'voting',
}
```

## Starting the Vote and Sending Participant to Voting Page

To get participant to the poll, the admin clicks a button to "Start Voting" on the [WaitingRoom](../client/src/pages/WaitingRoom.tsx) page. This will fire off an event to start the voting. The server in turn will respond with the `poll_updated` event. The poll will return with a `hasStarted` flag of true.

We can basically watch this flag in our [Pages.ts](../client/src/Pages.tsx), and then use our existing `setPage` action to send the participant to the `Voting` page. 

Let's first add an action in [state.ts](../client/src/state.ts) to our state which will send the event to the server to start the poll. 

```ts
  startVote: (): void => {
    state.socket?.emit('start_vote');
  },
```

Again, the server will respond with a `poll_updated` event.

Let's now add this to the appropriate button in our [WaitingRoom Page](../client/src/pages/WaitingRoom.tsx).

```tsx
              <button
                className="box btn-orange my-2"
                disabled={!currentState.canStartVote}
                onClick={() => actions.startVote()}
              >
                Start Voting
              </button>
```

*Show poll.hasStarted update in devtools. Have a poll with 3 users and nominations submitted ready.*

Now lets add an effect to the [Pages Component](../client/src/Pages.tsx) that looks for this field, and sets the page to the [Voting](../client/src/pages/Voting.tsx) page if the poll has started.

```tsx
const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
  [AppPage.WaitingRoom]: WaitingRoom,
  [AppPage.Voting]: Voting, // add this
};

  useEffect(() => {
    if (currentState.me?.id && !currentState.poll?.hasStarted) {
      actions.setPage(AppPage.WaitingRoom);
    }

    // add this if block
    if (currentState.me?.id && currentState.poll?.hasStarted) {
      actions.setPage(AppPage.Voting);
    }

    // add sequential check here
  }, [currentState.me?.id, currentState.poll?.hasStarted]);
```

*Demo user at page!*

## Adding Ranked Checkboxes UI

*Start storybook*

Let's take a look at the main component we'll be using to vote. 

We'll use these little boxes called [RankedCheckBox](../client/src/components/ui/RankedCheckBox.tsx). This checkbox basically allows us to click on it. It will then fire an event with the ID corresponding to the box. We can then use this id to toggle the nomination on and off, as well as track the order in which they were clicked. 

*Show nomination IDs in devtools*

Let's add a little header that shows how many votes the participant has remaining.

```tsx
      <div className="w-full">
        {currentState.poll && (
          <>
            <div className="text-center text-xl font-semibold mb-6">
              Select Your Top {currentState.poll?.votesPerVoter} Choices
            </div>
            <div className="text-center text-lg font-semibold mb-6 text-indigo-700">
              {currentState.poll.votesPerVoter - rankings.length} Votes
              remaining
            </div>
          </>
        )}
      </div>
```

We show the total number of votes, as well as the votes remaining. We're going to store the votes, or `rankings` for the participant in the `rankings` array. 

Let's now render the `RankedCheckBox` components we just looked at. 

```tsx
        <div className="px-2">
          {Object.entries(currentState.poll?.nominations || {}).map(
            ([id, nomination]) => (
              <RankedCheckBox
                key={id}
                value={nomination.text}
                rank={getRank(id)}
                onSelect={() => toggleNomination(id)}
              />
            )
          )}
        </div>
```

So we need to add methods to toggle a nomination, and "queue it up" or add it to our array of rankings. If the item is already in the array, we want to remove it. To be clear, we're going to store the nomination `id` in this array, in the order in which they're ranked. 

```tsx
  const toggleNomination = (id: string) => {
    const position = rankings.findIndex((ranking) => ranking === id);
    const hasVotesRemaining =
      (currentState.poll?.votesPerVoter || 0) - rankings.length > 0;

    if (position < 0 && hasVotesRemaining) {
      setRankings([...rankings, id]);
    } else {
      setRankings([
        ...rankings.slice(0, position),
        ...rankings.slice(position + 1, rankings.length),
      ]);
    }
  };
```

So first, we find the index where the id exists in our current rankings. If the ranking does not exist and the participant has votes remaining, then we add the nomination id to the end of the rankings. 

If the nomination id is in the rankings, we'll remove it from the rankings. 

We also made use of a `getRank` function. This simply maps the nomination id to its position in the array.

```tsx
  const getRank = (id: string) => {
    const position = rankings.findIndex((ranking) => ranking === id);

    return position < 0 ? undefined : position + 1;
  };
```

*Demo*

## Submitting Rankings or Cancelling Poll

We'll now add UI for each participants to submit their vote. 

```tsx
      <div className="mx-auto flex flex-col items-center">
        <button
          disabled={rankings.length < (currentState.poll?.votesPerVoter ?? 100)}
          className="box btn-purple my-2 w-36"
          onClick={() => setConfirmVotes(true)}
        >
          Submit Votes
        </button>
        <ConfirmationDialog
          message="You cannot change your vote after submitting"
          showDialog={confirmVotes}
          onCancel={() => setConfirmVotes(false)}
          onConfirm={() => actions.submitRankings(rankings)}
        />
        {currentState.isAdmin && (
          <>
            <button
              className="box btn-orange my-2 w-36"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel Poll
            </button>
            <ConfirmationDialog
              message="This will cancel the poll and remove all users"
              showDialog={confirmCancel}
              onCancel={() => setConfirmCancel(false)}
              onConfirm={() => actions.cancelPoll()}
            />
          </>
        )}
      </div>
```

First, we'll give each participant the ability to submit their votes. We'll add the action shortly. 

We also have an admin feature to cancel the poll. This button opens a confirmation dialog, which if confirmed, will cancel the poll. 

If you want an exercise, you could also add an admin button to end the vote early. A use case for this would be if somebody left the poll, and you can't get them to submit their vote. Again, I just wanted to leave that as sort of a "full stack" exercise for you!

Let's add these new actions as they're pretty straight forward. 

```tsx
  submitRankings: (rankings: string[]): void => {
    state.socket?.emit('submit_rankings', { rankings });
  },
  cancelPoll: (): void => {
    state.socket?.emit('cancel_poll');
  },
```

## Demo and Conclusion

*Demo what happens on cancel*

Next time we'll show how we send the user to the Results page and show the final results. 