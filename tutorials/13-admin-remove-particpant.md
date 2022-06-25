# 13 - Admin Gateway Handlers

Last time we handled adding and removing participants to our poll data in Redis as well as making sure that clients only communicate with other clients belonging to the same poll. 

Today, we're going to come up with a way to limit some events from being accessed except by admins. 

If you're thinking we can to this with another Authorization Guard, you nailed it! Since we've done this already hopefully today's tutorial will be a little easier than the last few. 

*Github reminder*

## Adding an Admin Guard

Let's add a new [gateway-admin.guard.ts](../server/src/polls/gateway-admin.guard.ts).

Let's define the class and add the required `canActivate` method. I recommend you check out my previous authorization tutorials on the adding a guard for the controller and also for the gateway.

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
   async canActivate(context: ExecutionContext): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
```

In this case, I'll make `canActivate` async as I would like to `await` some results in our method.

In the other guards, we merely verified and extracted a JSON Web Token payload, but here we need to access our database to get the id of the poll admin and compare it with the id from the extracted JWT.

To do this, we must inject both the `PollsService` and the `JwtService`.

```ts
// at top of class
 private readonly logger = new Logger(GatewayAdminGuard.name);
 constructor(
    private readonly pollsService: PollsService,
    private readonly jwtService: JwtService,
  ) {}
```

We'll also add a `Logger` instance while we're at it. 

Unfortunately, we actually don't have any method in our [PollsService](../server/src/polls/polls.service.ts) to get a poll. This is going to be a pretty simple method, so let's add it now

```ts polls.service.ts
  async getPoll(pollID: string): Promise<Poll> {
    return this.pollsRepository.getPoll(pollID);
  }
```

With this, we can now get the current socket's id, and compare it with the poll's `adminID`. If they do not match, we'll throw a `WsUnauthorizedException` which we created 2 tutorials ago. 

I also want to give us some type help when we parse the JWT. To do this, we just need to make sure to export `AuthPayload` in [types.ts](../server/src/polls/types.ts).

```ts
export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};
```

Now the rest of `canActivate` becomes:

```ts
    // regular `Socket` from socket.io is probably sufficient
    const socket: SocketWithAuth = context.switchToWs().getClient();

    // for testing support, fallback to token header
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.error('No authorization token provided');

      throw new WsUnauthorizedException('No token provided');
    }
    
    try {
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        token,
      );

      this.logger.debug(`Validating admin using token payload`, payload);

      const { sub, pollID } = payload;

      const poll = await this.pollsService.getPoll(pollID);

      if (sub !== poll.adminID) {
        throw new WsUnauthorizedException('Admin privileges required');
      }

      return true;
    } catch {
      throw new WsUnauthorizedException('Admin privileges required');
    }
```

Notice here that I tell the `verify` method about the type I expect the payload to be. It should be our `AuthPayload` joined with some standard JWT claims. I wasn't sure where to access the official types for standard JWT claims, but I'm betting if you installed `@types/jsonwebtoken`, it would be in there somewhere.

## Add *remove_participant* event handler

Let's now add a handler in our [PollsGateway](../server/src/polls/polls.gateway.ts) that accepts a `remove_participant` event, which can only be accessed by an Admin.

```ts
// remove test() event/method
  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {}
```

We add 2 decorators. The first is to use the guard we created, and the second is to map the socket event name to the handler.

Inside of the function, we define arguments. This is something new for us!

The first argument defines the payload we send with the event. In this case we'll be expecting a body with an `id` field as a field in a JSON payload. The admin needs to tell us the id of the participant they want to remove. 

Then we also get information about the actual client that is sending this message by using the `@ConnectedSocket()` decorator. 

With this, we can now implement the function body.

```ts
    this.logger.debug(
      `Attempting to remove participant ${id} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant(
      client.pollID,
      id,
    );

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
```

For now, I'm not going to actually force disconnect the client, as this user may try to reconnect, which will readd them to the poll if the poll, or voting hasn't yet started. 

## Minor Bug Fix

I found there was an error getting the clients in room count, where the size was `undefined`. Let's just create a fallback to `0`:

```ts
// correct in handleConnect and handleDisconnection
 const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;
```

## Fix for WsCatchAllFilter

We failed to properly resend general WS exceptions. I suppose that was the danger of a catch all filter. To fix, we just need to make sure we emit an `exception` properly when our incoming `Error` in an instance of `WsTypeException`. Add the following to [ws-catch-all-filter](../server/src/exceptions/ws-catch-all-filter.ts).

```ts
    if (exception instanceof WsTypeException) {
      socket.emit('exception', exception.getError());
      return;
    }
```

## Test with Postman

Let's fire up the app, Postman, and RedisInsight to see if this works!

1. Start App
2. Make sure you're listening to `poll_updated` still
3. Create poll and join with another participant
  - note userIDs from Redis or logs
4. Try to remove the admin with participant 2
5. Remove participant 2 with admin

## Next time

Next time, we'll add a few more events... perhaps for adding nominations.

See you then!