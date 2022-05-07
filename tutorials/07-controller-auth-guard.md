# 07 - Creating a Controller Auth Guard

Welcome back folks! In the last tutorial we setup the JWT module to return an access token in the form of a JSON Web token. 

Today, we'll learn how we can accept that token from a client application, verify that it's valid, and then extract its payload so that a user who closes their browser can "rejoin" a poll they left by closing their browser.

## Review of Current Endpoints

Let's review our existing endpoints in [polls.controller.ts](../server/src/polls/polls.controller.ts).

In the `@Controller` decorator, we declare the base path to this feature, namely the poll's endpoints. As it stands, our `create` and `join` handlers, or methods, are functioning. They return `CreatePollResponse` and `JoinPollResponse`. These responses include a JWT, which we added last time.

Let's take a look at an example in Postman.

*Demonstrate CreatePoll and JoinPoll in Postman*

Notice that we have a 3rd endpoint to `rejoin` a poll. What purpose does this serve? 

It will serve to allow a user who may have closed their browser or tab to re-enter a poll, and receive the current state of the poll. We want this to happen without the user having to enter new user info. We also want to make sure that they get assigned back to the same poll they had previously joined. 

We can do this by sending the JWT the user originally received when creating or joining the poll!

NestJS provides a way for us to do this with something called [guards](https://docs.nestjs.com/guards).

Let's see how we can create one, and then use it to extract JWT info for a user!

## Creating a Controller AuthGuard

We'll add this guard inside of our polls folder, since we'll specifically be extracting info about the poll. However, I can see an argument for putting this guard and the JWT module at the app level, which you're welcome to do if you prefer that!

In [controller-auth.guard.ts](../server/src/polls/controller-auth.guard.ts), we'll initialize a guard as follows.

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}
}
```

To create a guard, we need to create an injectable class which implements the `CanActivate` interface. If we `cmd+click` the class, we can have VS code and typescript add the required method to implement the `CanActivate` interface. A class which implements `CanActivate` can in turn be used as a guard. 

```ts
@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    throw new Error('Method not implemented.');
  }
}
```

This method must return a boolean, or Promise or Observable wrapped boolean, telling us that yes you may proceed by granting the client access to a particular controller method, which in our case will be `rejoin`. The `context: ExecutionContext` allows us to grab information of the incoming request. In this case, we'll see how to get the HTTP request's body.

Let's also remove the `Observable` since I won't plan on using Observables.

```ts
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    this.logger.debug(`Checking for auth token on request body`, request.body);

    return false;
  }
```

We use `context.switchToHttp()` to tell this guard it will work with an HTTP request. We could also switch to a websocket context, which we'll actually do later on. For now, we'll return `false`, which means the client will always fail this guard. 

Let's add a little utility type to define the expected shape of our incoming request body, which should receive the JWT access token. We'll do this in [polls types.ts](../server/src/polls/types.ts).

```ts
import { Request } from 'express';
// ... content omitted

// guard types
type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type RequestWithAuth = Request & AuthPayload;
```

To define `Request`, we sort of just need to know that NestJS uses Express under that hood. However, it could also be using Fastify if you configure it that way.  We then intersect this with an `AuthPayload`. Now this is a little tricky. The incoming request won't actually have these types, but we want to mutate the `request` object with this information, which is info we'll extract from the JWT.

Let's do that now.

First, we'll give the request a type `const request: RequestWithAuth = context.switchToHttp().getRequest();`

Next let's get the accessToken and verify it is valid.

```ts

    const { accessToken } = request.body;

    if (!accessToken) {
      throw new ForbiddenException('No authorization token provided');
    }

    this.logger.debug(`Validating auth token: ${accessToken}`);

    // validate JWT Token
    try {
      const payload = this.jwtService.verify(accessToken);
      // append user and poll to socket
      request.userID = payload.sub;
      request.pollID = payload.pollID;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException('Invalid authorization token');
    }
```

Our API will expect the accessToken as part of the request body's JSON, though it's common that it might be send in a header as well. 

We then use the `jwtService.verify` method which checks that our token has not been modified, as well as that it is not expired. If it is expired, this method throws an error. We'll catch this error and then throw a built in Error provided by NestJS. This we'll essentially send the user a 403, error.

If there is not an error, the `payload` will be the decoded JWT token. We'll add this data to our `request`, which our `controllers` and `services` will then be able to use!

## Applying the Guard

To apply the guards, let's open up [polls.controller.ts](../server//src/polls/polls.controller.ts). We add it via a `UseGuard` decorator provided by NestJS. 

```ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ControllerAuthGuard } from './controller-auth.guard';
// ... content omitted

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin() {
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'Also from token',
      userID: 'Guess where this comes from?',
    });

    return result;
  }
```

Next, we can now extract the incoming request using NestJS's built-in `@Req`. Recall that we now know that this request will have the shape that we just defined in [types.ts](../server/src/polls/types.ts).

```ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
// omitted content
import { RequestWithAuth } from './types';

// omitted content

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'Also from token',
      userID: 'Guess where this comes from?',
    });

    return result;
  }
```

If the AuthGuard's `canActivate` method fails, or in our case throws a `ForbiddenException`, then NestJS's default error handing, called an [exception filter](https://docs.nestjs.com/exception-filters) will respond with a 403 error. We'll demonstrate this later. If it passes, then we know that our request will have the user's info and poll info available, as defined on the `RequestWithAuth` type.

Let's know extract the user info from the request to rejoin the poll!

```ts
async rejoin(@Req() request: RequestWithAuth) {
    const { userID, pollID, name } = request;
    const rejoinPollResponse = await this.pollsService.rejoinPoll({
      userID,
      pollID,
      name,
    });

    return {
      poll: rejoinPollResponse,
    };
  }
```

Recall that we already defined our `rejoinPoll` method. Let's take a look just to recall what's happening [there](../server/src/polls/polls.service.ts). This method then adds the participant to the [polls repository](../server/src/polls/polls.repository.ts). We'll see how the participant is removed when we start working with WebSockets.

## Demonstrate

Let's now test this out using Postman. We'll also reopen RedisInsight-V2 so we can remove a user from the poll and see them rejoin!

With docker running, run `npm run start` from the root of the project.

* Create 2 users. 
  * User1 by creating the poll (note a token is return)
  * User2 by joining the poll (note that we'll use this token to rejoin the poll)
* remove second user via Redis RedisInsight
* Rejoin poll with second user's access token.


