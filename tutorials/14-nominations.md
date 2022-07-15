# 14 - Adding and Removing Nominations Via Socket Events

Last time we created an authorized socket.io event and handler to remove a participant from the poll. 

Today, we're going to working on creating events and handlers for adding and removing nominations. A nomination is a candidate for the answer to a poll. So for example, if the poll's "topic" is "Where should we go out for dinner?" and nomination might be "The Turkish Restaurant," or the "Mexican Restaurant." (I'm not gonna lie, I would have a hard time deciding between the two).

To get all of this done, we'll need to add some new repository methods to add nominations to our poll, along with some service methods. If I recall, the service methods should be rather straight-forward for nominations. But we'll see!

*Github reminder*

## Defining Types for Nominations

Before creating repository methods to add and remove nominations, I want to define the necessary types for this. Let's first define the payload we'll use in an `addNomination` method in [types.ts](../server/src/polls/types.ts). Recall that we add a `Data` suffix to our payload types for the repository layer methods.

```ts
export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};
```

We'll end up extracting the `pollID` from the client's token. The `nominationID` will be created in the service methods using a little helper we have for creating ids in [ids.ts](//server/src/ids.ts). But we have yet to define a nomination. 

Recall that we're defining our `Poll` and associated types in a [shared](../shared) package using npm workspaces. So let's add the Nomination type to [poll-types.ts](../shared/poll-types.ts)!

And while we are add it, I want to update all of the `interfaces` to `types`, since we're using `types` and not `interfaces` elsewhere in our project. 

```ts
export type Participants = {
  [participantID: string]: string;
}

export type Nomination = {
  userID: string;
  text: string;
}

export type Nominations = {
  [nominationID: string]: Nomination;
}

export type Poll = {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  nominations: Nominations;
  // rankings: Rankings;
  // results: Results;
  adminID: string;
  hasStarted: boolean;
}
```

A single `Nomination` contains the id of the user submitting the nomination along with the text of the nomination. 

Then we'll store all nominations in an object which maps the `nominationID` we'll soon create to the nomination. 

Finally, make sure to import `Nomination` into [types.ts](../server/src/polls/types.ts).

```ts
// ...
import { Nomination } from 'shared/poll-types';
```

## Repository methods

With our Poll types updated and our addNomination argument type defined, let's create our `addNomination` method in [polls.repository.ts](../server/src/polls/polls.repository.ts).

Upon opening the file, you'll see that we now have an error. This is because we have no initialized our poll with nominations. This is an easy fix.

```ts
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      nominations: {},
      adminID: userID,
      hasStarted: false,
    };
```

And our method is as follows:

```ts
  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a nomination with nominationID/nomination: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with nominationID/text: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to add a nomination with nominationID/text: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
      );
    }
  }
```

Even though we haven't done too much repository work in a while, I hope this is straightforward. We essentially access our polls key, and then set the nested nominations object's key, which is the `nominationID` which is passed to this method. We then return the updated poll, and throw an `InternalServerErrorException` if anything goes wrong. 

Let's add a similar method to remove a nomination.

```ts
  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(
      `removing nominationID: ${nominationID} from poll: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
        e,
      );

      throw new InternalServerErrorException(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
      );
    }
  }
```

This is pretty similar to the last method, except we'll use the Redis JSON command to delete the value at a particular path, `JSON.DEL`.first-letter:

That's basically it. The only thing I want to update is to use an `InternalServerErrorException` for `addParticipant` and `getPoll`. I merely want to do this for consistency, and to control precisely what information a client might see.

```ts
// ...
throw new InternalServerErrorException(`Failed to get pollID ${pollID}`);
//...
throw new InternalServerErrorException(
  `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
);
```

## Adding Service Methods for Nominations

We'll need to update some types here as well. Let's update [types.ts](../server/src/polls/types.ts).

I'm also going to delete an unused `RemoveParticipantData` type that is unused. I think I decided to just pass the pollID and userID directly as method arguments since there were only 2 arguments.

```ts
export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
};

// remove interface below

// export interface RemoveParticipantData {
//   pollID: string;
//   userID: string;
// }
```

Let's now create a service `addNomination` method to the [PollsService](../server/src/polls/polls.service.ts).

```ts
import { createUserID, createPollID, createNominationID } from 'src/ids';

  async addNomination({
    pollID,
    userID,
    text,
  }: AddNominationFields): Promise<Poll> {
    return this.pollsRepository.addNomination({
      pollID,
      nominationID: createNominationID(),
      nomination: {
        userID,
        text,
      },
    });
  }
```

Recall that we had a little id-creation file to create id's for our polls. Each poll nomination will have 8 characters.

Next, let's add `removeNomination`.

```ts
   async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    return this.pollsRepository.removeNomination(pollID, nominationID);
  }
```

Like I said, there's not a lot to this. 

## Gateway Socket.io Event Handlers

We're going to accept a nomination event that will allow nominations from any authorized user, which is any user who connected and joined our poll's room. However, we're going to restrict removing nominations to the admin via the guard we created in our last tutorial.

Let's add the first method to our [PollsGateway](../server/src/polls/polls.gateway.ts).

```ts
@SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user ${client.userID} to poll ${client.pollID}\n${nomination.text}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }
```

So we'll listen to an event called `nominate`, perform a little logging, then call our service method. If all goes well, we'll send out updated poll via the `poll_updated` event we've been using. 

But, we also need to define the shape of our `NominationDto`. Recall that we create these details with a class decorated with decorators from the class-validator library. We also previously handled converting validation errors from the class-validator library into socket.io errors, which we'll see when we demo this.

That was a lot of words to add a DTO with one field to [dtos.ts](../server/src/polls/dtos.ts).

```ts
  export class NominationDto {
    @IsString()
    @Length(1, 100)
    text: string;
  }
```

we merely want to make sure the nomination text does not exceed 100 characters.

*Remember to import this into polls.gateway.ts to eliminate errors*.

Let's now add our admin-only event handler for removing nominations.

```ts
  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') nominationID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove nomination ${nominationID} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeNomination(
      client.pollID,
      nominationID,
    );

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }
```

First, note that we use the auth guard from last time. Then we reach out to our service layer, and send the updated poll back to clients connected to the same room, or `pollID`.

## Testing in Postman

1. Create Poll - "Where should we go out to eat?"
2. Join poll with second player
3. Connect Socket client 1 and socket client 2
4. Show addition of `nominate` and `removeNomination`
5. Try to nominate with empty `text` to show validation error. Example of our exception filter working!
6. Submit valid nominations form each participant
7. Try to remove a nomination with Participant or socket client 2
  - show authorization error



