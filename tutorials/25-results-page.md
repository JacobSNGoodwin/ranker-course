# 25 - Results Page

Welcome back. Last time we fixed some tedious bugs and handled users ranking their choices. Today, we'll handle sending users to a Results Page, where they'll wait for the all Results to come in. Once all results have arrived, we'll show all of the participants the results.

*Github Page Reminder*

## User hasVoted Derived State + New AppPage Enum

We'll send each user to a `Results` page after they submit their votes. We'll know if they have voted if their `id` is found in the `rankings` object, which matches a user's `ID` to an array of their votes. 

In a more secure app, we wouldn't send these results back to the client, but maybe just a Set of id's of users who have voted. So perhaps that is an enhancement you'll want to add. 

Let's add a `derived` field per user called `hasVoted`, which will be the flag we'll use to send a participant to a result page. Let's also add to our `AppPages` for the result page.

While we're add it, lets add another derived count, which is the `rankingsCount`.

```ts
export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
  Voting = 'voting',
  Results = 'results',
}

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
  wsErrors: WsErrorUnique[];
  me?: Me;
  isAdmin: boolean;
  nominationCount: number;
  participantCount: number;
  canStartVote: boolean;
  hasVoted: boolean;
  rankingsCount: number;
};

  // in proxy object
  get hasVoted() {
    const rankings = this.poll?.rankings || {};
    const userID = this.me?.id || '';

    return rankings[userID] !== undefined ? true : false;
  },
  get rankingsCount() {
    return Object.keys(this.poll?.rankings || {}).length;
  },
```

We'll also give the admin the ability to end, or close, the poll early to calculate the results. This event is called `close_poll`, so lets add that action now. 

```ts
  closePoll: (): void => {
    state.socket?.emit('close_poll');
  },
```

## Set to Result Page

We now need a page to send the participant to after voting. So let's scaffold out a basic [Results Page](../client/src/pages/Results.tsx).

```tsx
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { state } from '../state';

export const Results: React.FC = () => {
  const { poll, isAdmin, participantCount } = useSnapshot(state);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isLeavePollOpen, setIsLeavePollOpen] = useState(false);

  return (
    <>
      <div className="mx-auto flex flex-col w-full justify-between items-center h-full max-w-sm">
        <div className="w-full">
          <h1 className="text-center mt-12 mb-4">Results</h1>
        </div>
      </div>
    </>
  );
};
```

Let's now add this page to our route config, and send the participant to to this page if they have voted. 

```ts
const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
  [AppPage.WaitingRoom]: WaitingRoom,
  [AppPage.Voting]: Voting,
  [AppPage.Results]: Results,
};

 useEffect(() => {
    if (currentState.me?.id && !currentState.poll?.hasStarted) {
      actions.setPage(AppPage.WaitingRoom);
    }

    if (currentState.me?.id && !currentState.poll?.hasStarted) {
      actions.setPage(AppPage.Voting);
    }

    // add this
    if (currentState.me?.id && currentState.hasVoted) {
      actions.setPage(AppPage.Results);
    }
  }, [
    currentState.me?.id,
    currentState.poll?.hasStarted,
    currentState.hasVoted, // update dependency array
  ]);
```

Looking at this now, it might make sense to run this as separate `useEffect` functions.

Time to work on some UI stuff!

## Update ResultCard

*Storybook open*

Between my initial creation of this tutorial and this version, I changed how the results were computed. I previously did a classic ranked choice voting, where the candidate with the least votes got eliminated each round, and the second votes for that candidate were spread among other candidates in subsequent rounds. But in reality, this did not work well for a small number of voters, or participants. 

*Show previous components. We'll now only use the ResultCard, since we will not have multiple rounds.*

Let's update the `ResultCard` to use a new type in [poll-types.ts](../shared/poll-types.ts).

```ts
import React from 'react'; // remove useState
import { Results } from 'shared/poll-types';

type ResultCardProps = {
  results: DeepReadonly<Results>;
};

// change Prop type
const ResultCard: React.FC<ResultCardProps> = ({ results }) => {...
  // remove
  const [showPercent, setShowPercent] = useState(false);
  const totalVotes = result.totalVotes;


         // remove
         <div className="col-span-1 font-semibold text-right">
          <button
            onClick={() => setShowPercent(false)}
            className={showPercent ? '' : 'text-orange-700'}
          >
            Count
          </button>
          {' / '}
          <button
            onClick={() => setShowPercent(true)}
            className={showPercent ? 'text-orange-700' : ''}
          >
            %
          </button>
        </div>
        // replace above with
        <div className="col-span-1 font-semibold text-right">Score</div>

      // change map
      <div className="divide-y-2 overflow-y-auto pr-4">
        {results.map((result) => (
          <div
            key={result.nominationID}
            className="grid grid-cols-3 gap-4 my-1 items-center"
          >
            <div className="col-span-2">{result.nominationText}</div>
            <div className="col-span-1 text-right">{{result.score.toFixed(2)}}</div>
          </div>
        ))}
      </div>
```

We then need to update the demo code, or story, for this component with accurate dating mimicking what our real results will have. We do this in the [ResultCard.stories.ts](../client/src/stories/ResultCard.stories.tsx) file.

```ts
import { Results } from 'shared/poll-types';

// copy this whole code
export default {
  title: 'ResultCard',
  component: ResultCard,
} as ComponentMeta<typeof ResultCard>;

const Template: ComponentStory<typeof ResultCard> = (args) => (
  <div className="max-w-sm m-auto h-screen">
    <ResultCard {...args} />
  </div>
);

const results: Results = [
  {
    nominationID: '1',
    score: 5.0,
    nominationText: 'Taco Bell',
  },
  {
    nominationID: '2',
    score: 2.56,
    nominationText: 'Del Taco',
  },
  {
    nominationID: '3',
    score: 2.4,
    nominationText: "Papa's Tacos",
  },
  {
    nominationID: '4',
    score: 1.55,
    nominationText: 'Los Taqueros Locos con Nombre Largo',
  },
  {
    nominationID: '5',
    score: 1.41,
    nominationText: 'El Vilsito',
  },
  {
    nominationID: '6',
    score: 1.11,
    nominationText: 'Tacos El Güero',
  },
  {
    nominationID: '7',
    score: 0.0,
    nominationText: 'Taqueria del Mercado',
  },
];

export const ResultCardLong = Template.bind({});
ResultCardLong.args = {
  results,
};
```

## Result Page UI

With our component fixed, we can now wrap up the UI.

Let's add some UI that will show how many participants have voted if there are no results, and shows the actual results in the `ResultCard` we just created if the poll has been closed. 

```tsx
        {poll?.results.length ? (
            <ResultCard results={poll?.results} />
          ) : (
            <p className="text-center text-xl">
              <span className="text-orange-600">{rankingsCount}</span> of{' '}
              <span className="text-purple-600">{participantCount}</span>{' '}
              participants have voted
            </p>
          )}
```

Our `results` are a default empty array. I don't know why I didn't just set it to null or undefined. But so be it. 

Let's now add the UI for the Admin to close the poll.

```tsx
// beneath w-full
        <div className="flex flex-col justify-center">
          {isAdmin && !poll?.results.length && (
            <>
              <button
                className="box btn-orange my-2"
                onClick={() => setIsConfirmationOpen(true)}
              >
                End Poll
              </button>
            </>
          )}
          {!isAdmin && !poll?.results.length && (
            <div className="my-2 italic">
              Waiting for Admin,{' '}
              <span className="font-semibold">
                {poll?.participants[poll?.adminID]}
              </span>
              , to finalize the poll.
            </div>
          )}
          {!!poll?.results.length && (
            <button
              className="box btn-purple my-2"
              onClick={() => setIsLeavePollOpen(true)}
            >
              Leave Poll
            </button>
          )}
        </div>
```

For users that are not the admin, we let them see that they're waiting on that admin. Once the results are in, we give participants the option to leave the poll, which cleans their app state and token. 

Now let's add the `Confirmation` boxes to leave the poll, or for the admin to compute the results.

```tsx
// inside fragment

      {isAdmin && (
        <ConfirmationDialog
          message="Are you sure close the poll and calculate the results?"
          showDialog={isConfirmationOpen}
          onCancel={() => setIsConfirmationOpen(false)}
          onConfirm={() => {
            actions.closePoll();
            setIsConfirmationOpen(false);
          }}
        />
      )}
      {isLeavePollOpen && (
        <ConfirmationDialog
          message="You'll lose ya results. Dat alright?"
          showDialog={isLeavePollOpen}
          onCancel={() => setIsLeavePollOpen(false)}
          onConfirm={() => actions.startOver()}
        />
      )}
```

## Final demo

*Do a final demo*

## Conclusion and Congrats

You did it! Great work. If you liked my videos, make sure to like them. See you next time!