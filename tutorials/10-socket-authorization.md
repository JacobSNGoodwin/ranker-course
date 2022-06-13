# 10 - Authorization For Socket.io Gateway

Hey there! Between vacations, and dog surgeries, and rewriting this tutorial it has been a while since I published a video. But it's good to be back!

Last time, we got our [PollsGateway](../server/src/polls/polls.gateway.ts) running with some basic handlers to log connected and disconnected clients. We also had a bit of a demonstration on how we can create test Socket.io clients with Postman.

Before we proceed to receiving messages from clients that will affect our application state, or database data, I first want to create an authorization guarding mechanism to make sure that only clients connected to a particular poll are able to interact with that poll. If they are not authorized, we want to be able to send some sort of error back to the client. Lets get to work on that now. 

*Reminder of how to join along with repository*

### Resources on Authorization

[Open NestJS Issue with examples](https://github.com/nestjs/nest/issues/882)
[My preferred solution](https://github.com/nestjs/nest/issues/882#issuecomment-631643591)
[allowRequest socket.io](https://socket.io/docs/v4/server-options/#allowrequest) - downside could be if you wanted to not use socket.io, doesn't have access to the `Socket` object used by socket.io
[Middleware](https://socket.io/docs/v4/middlewares/)

## Run through of ControllerAuthGuard

I first want to review how we created a guard in NestJS for the[ControllerAuthGuard](../server/src/polls/controller-auth.guard.ts).

Recall that the guard needs to be decorated with the nest-provided `@Injectable` decorator. The guard itself is a class which implements the  `canActivate` interface. This `canActivate` interface. The `canActivate` method will receive a request's `ExecutionContext`. 

In the HTTP case, we were able to "switch" the context to HTTP. For websockets we can do something quite similar, but by switching to a websockets context instead. 

We then validate the JWT using our JWT service, and we can do the exact same thing to create a websockets gateway guard. THe difference, however, is that the websocket doesn't have a `request` that we can mutate. We'll see that instead we can add a field to the `socket`. 

Notice that we'll throw an error in the guard if the token is not validated. We'll go over how we can handle exceptions with Websockets in the next tutorial since we can't just throw an exception and expect the framework to send a response with the proper HTTP status.

## Guards on Gateways Don't Block connections

*With [Open NestJS Issue with examples](https://github.com/nestjs/nest/issues/882) opened*

Unfortunately, I found a few challenges with guards for gateways in NestJS. One of them is that the we cannot guard against a websocket actually making a connection to our server via a Guard. 

This Github issue reports the issue and shows some possible solutions. 

*Scroll down to Hwan Sek*

One solution (Hwan Sek) is to just verify your token inside of the `handleConnection` method. The downside of this approach is that you actually have to disconnect the client after it has connected. The good thing is that this seems the most "NestJS" of the options to me.

*Scroll to ChrisKatsaras*

Another option is to add an `allowRequest` option to a custom adapter. This looks promising as we have already scaffolded out a [SocketIOAdapter](../server/src/socket-io-adapter.ts). 

I'll tell you now that we will not use this approach. One reason is that the `request` object provided by the method doesn't really provide us access to the `Socket` type, which we want to modify with the `pollID` and `userID` from the token. It mostly gives us access to the HTTP request that will be upgraded to Websockets. Another downside to this approach is that is it `socket.io` specific. I am not against that, as the actually solution we'll end up using is also socket.io specific. 

The method that we'll use is to create our own `socket.io` middleware. This will allow us to reject connections with invalid tokens **and** to modify the socket with the `userID` and `pollID`.

*Review [GatewayAuthGuard](../server/src/polls/gateway-auth.guard.ts) which we won't be using.*

Even though we're not going to use a NestJS guard to our websocket authorization, I did previously build it out. You can see that it is very similar to our [ControllerAuthGuard](../server/src/polls/controller-auth.guard.ts).

## Creating and Registering Middleware

*Socket.io [middleware](https://socket.io/docs/v4/middlewares/)*

We'll create our middleware inside of our [SocketIOAdapter](../server/src/socket-io-adapter.ts), since this gives us access to modify our socket.io server and it's options. If we look at the documentation for middleware, we see that it receives a `Socket` and `next` function. If we want to continue with connecting, we pass nothing to `next`. Otherwise we can pass an `Error`.

To make this middleware, I actually want to write a function that creates the middleware. In other words, this will be a function that creates a function. 

Let's add this to the bottom of our adapter. 

```ts
const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
  (socket: SocketWithAuth, next) => {
    // for Postman testing support, fallback to token header
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    logger.debug(`Validating auth token before connection: ${token}`);

    try {
      const payload = jwtService.verify(token);
      socket.userID = payload.sub;
      socket.pollID = payload.pollID;
      socket.name = payload.name;
      next();
    } catch {
      next(new Error('FORBIDDEN'));
    }
  };
```

As you can see, we sort of build a middleware wrapped with the `jwtService` since we need to verify a JSON web token to determine whether or not a client can connect. We also want access to the logger, which will end up being the logger of the `SocketIOAdapter`. 

We first extract the token. You'll see that I have a fallback token. When we end up using the socket.io client library in our web app, we'll receive the auth token on a special `auth.token` field. However, Postman provides no way to append this field. Therefore, we'll pass a `token` header, and fall back to that.

We also add some debug-level logging of the received token. 

Other than that, we use our `jwtService` just like we did in the `ControllerAuthGuard`. Remember that this throws if the token is in valid. In that case, we'll pass a simple error to our `next` function. We could also provide a payload, but I'm perfectly content with a simple message for this. 

I just realized that I've gotten a bit ahead of myself, though. Notice that I receive a `SocketWithAuth` type instead of just `Socket` provided by Socket.io. Similar to how we created a `RequestWithAuth` type, let's create this type in [types.js](../server/src/polls/types.ts).

```ts
import { Socket } from 'socket.io';

// ...

export type SocketWithAuth = Socket & AuthPayload;
```

Then make sure to import this in our adapter.

```ts
import { SocketWithAuth } from './polls/types';
```

Let's now get access to the `JWTService` and call this function in our adapter.

```ts
    const jwtService = this.app.get(JwtService);
    const server: Server = super.createIOServer(port, optionsWithCORS);

    // middleware must be namespaced if gateway is namespaced!
    server.of('polls').use(createTokenMiddleware(jwtService, this.logger));

    // we need to return this, even though the signature says it returns void
    return server;
```

Our `JWTService` is already injected in our top-level [AppModule](../server/src/app.module.ts), but to get access to it from this adapter, we need to `get` it.

We then store our `server` in a variable instead of returning it directly. One tricky thing that took my a while to figure out was that middleware will be applied per server namespace. Recall that we added a namespace of polls for our `PollsGateway`. The socket.io way of accessing a namespace if with the `of` method. We then create the middleware as shown. 

## Use SocketWithAuth in Gateway

We're about ready to test this. But to do so, I want to add logging into our [PollsGateway](../server/src/polls/polls.gateway.ts) to make sure we have extracted the user data from the token. 

First, we'll update `handleConnection` and then `handleDisconnect`.

```ts
import { SocketWithAuth } from './types';

//...
  handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID}, and name: "${client.name}"`,
    );

    //...
  }

// ...

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { userID, pollID } = client;

    // these will only be available via actual socket.io client
    // and not with Postman
    this.logger.debug('in handleDisconnect', userID, pollID);

    // ...
  }
```

*Remove unused import*.

## Test with Postman

Let's now test this out!

Make sure to have docker running on your machine, and boot up the app. Let's now go to Postman and test out our changes!

The following steps will be demonstrated on the YouTubes.

1. Create Poll with HTTP Post
2. Point out that we'll store the token to a variable
3. Join poll with player 2 which also has a variable token
4. Create first WS client and add the token1 variable as a query parameters
5. Repeat for Websocket client 2.

## Next Time

So, there are a few things I forgot to set up in previous tutorials. One is handling validation. This is why we created DTOs in [dtos.ts](../server/src/polls/dtos.ts). But I never actually enabled this validation.

So we'll go over this and then also deal with exceptions. We'll show how we can throw an exception in our Websocket context, and then send those errors as messages to all the clients.

See you then!