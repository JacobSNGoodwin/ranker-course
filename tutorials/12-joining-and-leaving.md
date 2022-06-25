# 11 - Joining and Leaving Polls and Socket Rooms

*Using RedisInsight V2, Postman, and referencing Socket.io broadcast*

In the last few tutorials, we took care of a lot of the underlying plumbing. I think that info is very useful as a software developer, but perhaps a bit tedious.

Hopefully what we do today will remind you that we do have a [PollsService](../server/src/polls/polls.service.ts) and [PollsRepository](../server/src/polls/polls.repository.ts) which ultimately deal with application logic and updating the data for each poll we create.

One important piece of data for the poll is the participants belonging to a poll. We'll get to the point where a user, or participant is added to the poll in Redis when they connect, and removed when they either disconnect, or request to be disconnected. 

We'll also deal with a concept in Socket.io and often more generally with websockets called "rooms". This is a way to make sure that data is only sent via web sockets to users participating in a particular poll, and not to all websockets that might be a part of some other poll. 

*Reminder to "checkout" github*

## Review of PollsRepository

Let's start working from the [PollsRepository](../server/src/polls/polls.repository.ts) and work our way towards the [PollsGateway](../server/src/polls/polls.gateway.ts).

Inside notice the we already have a method called `addParticipantToPoll`. We used this in tandem with a `rejoinPoll` endpoint in the [PollsController](../server/src/polls/polls.controller.ts). I'm going to leave this endpoint, but we may change how we rejoin a poll from our React Client. 

Before writing this tutorial, I didn't know how to validate our client's JWT until after connecting. So I did some things in a funny way to get around this, one of which might have been "rejoining" a poll via a REST endpoint. But now that we can assure access to a token upon connection, I think that the `/rejoin` endpoint may be unnecessary. But we'll leave it in case I find that I am mistaken!

Ok, let's now create a similar method for removing a participant from our Redis Database. This will be necessary for when a client inadvertently disconnects, or when they deliberately leave a poll. 

We'll add it as follows.

```ts
  async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`removing userID: ${userID} from poll: ${pollID}`);

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from poll: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }
```

Notice that we don't need to pass a payload as we're just deleting participant data stored under this particular `userID`. If we look back at `addParticipant`, we see that we store the participant's name as the value corresponding to the key of their `userID`.

Notice that we reuse our `getPoll` method to return the entire poll. I debated whether or not to return the poll, or just the updated participants. But I have decided that I mostly want to return the entire poll from our Repository methods, and let the service decide if it wants to perform any validation or extract and particular data to send back to the controller or gateway. I'm sure there's a good argument for some other abstraction, but let's not go there right now!

While we're in our `PollsRepository`, let's also refactor our `addParticipant` to use `getPoll` like we do in `removeParticipant`.

```ts
    return this.getPoll(pollID);

    // replaces the following
    // const pollJSON = await this.redisClient.send_command(
    //     'JSON.GET',
    //     key,
    //     '.',
    //   );

    //   const poll = JSON.parse(pollJSON) as Poll;

    //   this.logger.debug(
    //     `Current Participants for pollID: ${pollID}:`,
    //     poll.participants,
    //   );

    //   return poll;
```

There's one more thing I want to do while we're working in our Repository. And that is to update the initial Poll state along with the types for the poll.

In our shared [poll-types.ts](../shared/poll-types.ts), let's make sure we have a `hasStarted` and `adminID` available. Remember that we're doing this to align our server and client state a little more consistently. 

```ts
// uncomment below lines
adminID: string;
hasStarted: boolean;
```

Let's then make sure these our initialized in the `PollsRepository`.

```ts
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
      hasStarted: false,
    };
```

Let's now move on to the [PollsService](../server/src/polls/polls.service.ts)!

## PollsService Updates

Next we'll add service methods to add and remove a participant. And before doing that, let's define the shape of these methods' expected arguments as `AddParticipantFields` and `RemoveParticipantFields` in [types.ts](../server/src/polls/types.ts). 

```ts
// in service types section
export interface AddParticipantFields {
  pollID: string;
  userID: string;
  name: string;
}

export interface RemoveParticipantData {
  pollID: string;
  userID: string;
}
```

Recall that we're generally appending our service types with `Fields`.

Let's now add methods for adding and removing participants!

```ts
  async addParticipant(addParticipant: AddParticipantFields): Promise<Poll> {
    return this.pollsRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    pollID: string,
    userID: string,
  ): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(
        pollID,
        userID,
      );
      return updatedPoll;
    }
  }
```

Notice that we call our repository methods which have the same name. This is the case here, but won't always be the case. The `addParticipant` is pretty straight forward. We're basically only forward the call to the repository. 

In `removeParticipant`, you'll notice that we only remove a participant if the poll hasn't started. And by this, I actually mean the literal voting. I want to lock a user in when this is the case. You may ask what happens if the voting has started and a participant just disappears and doesn't vote? We'll give the admin the ability to end the poll early. 

This `removeParticipant`` will be used for 3 purposes. First for when a participant intentionally leaves the poll. The second is for when they disconnect whether intentionally or deliberately. The third is for when an admin wants to kick out a particular participant. We'll see how we can give an admin this ability in a later tutorial.

One other thing I want to mention is the returning of the entire poll. In my first iteration of this app, I only returned the `participants`, and then sent an event to all clients telling them to update their poll state's participants. This has a benefit in that it uses less bandwidth. However, I also worry about each client having the proper poll state. So I'm willing to live with sending the whole `Poll` data. We could put a limit on the number of participants if the payload got out of hand. 

## PollsGateway

We're now ready to move onto adding and removing participants upon connection.

### Add Participants

One thing we haven't discussed yet is how to make sure participants belonging to a particular poll only communicate with each other, and not with everyone else. We do this by adding a socket to a room. These rooms are a socket-specific concept, so this will be separate from the service and repository methods we just created.

Let's add the code in `handleConnection` of the `PollsGateway`.first-letter:

```ts
// make async
 async handleConnection(client: SocketWithAuth) {
// remove below code
// this.io.emit('hello', `from ${client.id}`);

    const roomName = client.pollID;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms.get(roomName).size;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );
}
```

As you can see, joining a room is relatively trivial with socket.io. We then access the room's date on `io`, which you might remember references the server, giving access to it's various methods. This is how we get the number of clients connected to the room. 

We then lock that our participant, or user, successfully connected and the log the total number of participants in that room. You may consider consolidating some of the logs in this method, but I'll leave it for now.

We then add the participant using our service method as follows.

```ts
   const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);
```

After we retrieve the updated poll, we'll send this back to our client by emitting a `poll_updated` event. To send an event to a particular room, we first call `to(roomName)` to specify that we only want to send the message to clients connected to this room. 

One thing important to note here is how the call an `emit` method. There are three ways to do this. 

The first is with the socket, or client itself. If we review [ws-catch-all-filter](../server/src/exceptions/ws-catch-all-filter.ts), we can see that we emit from the socket, which we sometimes call `client`. This sends the message only to that specific socket client. 

*Reference [socket.io broadcasting](https://socket.io/docs/v4/broadcasting-events/)*

The second way is for the server to emit, as above. This sends the message to every connected socket, or in this case, to every socket belonging to a room. 

The last way is also to emit from the socket, but using the `broadcast` property before calling `emit`. This will send the message to all other clients except the one sending the message.

### Leaving Poll

With all the explanation out of the way, let's handle leaving the poll.

```ts
// remove existing logs
    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );

    const roomName = client.pollID;
    const clientCount = this.io.adapter.rooms.get(roomName).size;
    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state
    if (updatedPoll) {
      this.io.to(pollID).emit('poll_updated', updatedPoll);
    }
```

## Test With Postman

Let's now test with Postman, and also open RedisInsight V2.

1. Start the app
2. Make sure to add `poll_updated` listener to clients
3. Create poll, then join with participant 2 and 3
4. Connect each socket with their token
4. Disconnect clients.

## Next Time

In the next tutorial we're going to add an event for "forcibly" removing, or maybe you'd call it "ejecting" a participant. Some of the logic for removing them will be similar to what we did today, but we will want to restrict this functionality to the admin, which is the participant who started the poll.

See you then!
