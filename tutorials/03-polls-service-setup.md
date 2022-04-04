# 03 - Setting Up the Polls Service

Hey there! Another day, another tutorial! Thanks for joining along once more!

*Show these files* 

In the last tutorial we discussed who we can scaffold out some Rest endpoints by creating a class decorated with [NestJS's Controller](https://docs.nestjs.com/controllers) decorator. We set up the shape, or definition, of the incoming request body as "data transfer objects," or DTOs. We also included validation for our request body fields using the `class-validator` library's decorators.

Today, we're going to create our first [provider](https://docs.nestjs.com/providers), which is some code, or functionality that can be injected as a dependency in a module. 

*With Repo Open*

If you'd like to join along with me without going through previous tutorials, you can go to the repo and either clone or degit the branch from the previous tutorial.

## The Polls Service Overview

Let's take a look at our first provider, which will be a "Polls Service." Why are we going to create a service? The polls service will handle logic that belongs neither to parsing incoming and outgoing requests and responses, nor with storing and retrieving entities of data in our database. Often there is some application logic that we need to execute, like operating on the incoming request before storing the data. Or we may need to reach out to another service or provider.

Now that was a bit of a word salad, so let's take a look at the example creating a poll in the diagram below. 

Last time we scaffolded out the Polls Controller with 3 endpoints with corresponding handlers. Let's just look at the `create` function. This extracts and validates the incoming JSON body from the request. 

We'll then pass this data along to the polls service we're going to create. This will be enabled by the fact that we'll make our service "Injectable", or a provider. 

The `createPoll` function will handle the steps outlined in the diagram. Notice there is quite a bit of logic to handle here, including interacting with a Polls Repository for persisting and retrieving data in Redis, as well as working with another service, the "JWT Service." In some applications, you might create the IDs in that repository layer or via that database itself, but we'll just go ahead and take care of this in our service layer. 

![Service - Create Poll Diagram](./resources/03-Polls-Service-Diagram.png)

We'll add somewhat similar logic for joining and rejoining an existing poll. When all is said and done, the polls service will sort of be a middle man for handling business logic between the controller and other provided services or repositories. 

But let's now go ahead and create our this Polls Service and "provide" it to our poll module for access to other modules and a providers in our module!

## Creating Polls Service Class

Let's create our [polls.service.ts](../server/src/polls/polls.service.ts) file. Let's also create a file for our types, [types.ts](../server/src/polls/types.ts), which will just be sort of nice for storing the types for various functions in our services and repositories.

In [types.ts](../server/src/polls/types.ts), lets define parameters for the 3 service methods we will scaffold out today.

```ts
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};
```

I'll use `Fields` as a suffix for these types, but you might see some use `Options`, `Parameters`, or `Config`. For the service return values, or objects, I'll create similar types with a suffix of `Results`.

For now, we won't define the result, or return, types as we won't quite flush out our data structure in this tutorial. We'll just use type inference for now!

Let's create a class for the polls service and our first 3 methods in [polls.service.ts](../server/src/polls/polls.service.ts)!

```ts
import { Injectable } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {}

  async joinPoll(fields: JoinPollFields) {}

  async rejoinPoll(fields: RejoinPollFields) {}
}
```

Something very important here is the we have annotated the `PollsService` as injectable. This is how we mark a class as a provider (hover or look at definition). We'll include this "Injectable" class as a provider to our polls module later. 

### Create IDs In Polls Service

Since we're not going to be persisting any data today, I'd like to add some logic for create user and poll IDs. 

In the server's `src` folder, let's create an [ids.ts](../server/src/ids.ts) file. We're going to make use of a an ID library called `nanoid`. This package was installed in the [package.json file in the server folder](../server/package.json).

We add the following code:

```ts
import { customAlphabet, nanoid } from 'nanoid';

export const createPollID = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  6,
);

export const createUserID = () => nanoid();
export const createNominationID = () => nanoid(8);
```

Note that `createPollID` makes use of a "custom alphabet." This allows us to create a 6 character ID for our polls made only of capital letters and numbers. This is because we want to create an ID for the game which can easily be shared, or passed, among friends.

Our userID will be a [standard nanoid](https://zelark.github.io/nano-id-cc/), which has a default length of 21 characters. The `nominationID` will be used later on in the course, but I suppose we might as well add it now.

### Add Logic to methods

With this, let's now create IDs in the service methods. 

```ts
import { Injectable } from '@nestjs/common';
import { createPollID, createUserID } from 'src/ids';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    return {
      ...fields,
      userID,
      pollID,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    return {
      ...fields,
      userID,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    return fields;
  }
}
```

In `createPoll` we need to create both a `gameID` and a `userID`. We'll go into details about where we store these IDs and how we use them in subsequent tutorials.

In `joinPoll` we will only create a `userID`, as the client will actually provide the `pollID` for the poll they are attempting to join. We can see this by reminding ourselves of the `JoinPollsField` type.

We won't do anything with rejoining a poll for now, as this will come from authorization data coming from the user's browser.

## Access Polls Service Insider of Polls Controller

Let's now make our polls service accessible to other classes inside of our polls module. We do this by registering it as a `provider` in the `Module` decorator of [polls.module.ts](../server/src/polls/polls.module.ts)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
```

To conclude today, I now want to show how we access our injected, or provided service in the controller. First, we add the service in the constructor of [polls.controller.ts](../server/src/polls/polls.controller.ts).

```ts
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}
  
  // rest of code
}
```

And let's update our methods to access the service. We'll remove the logging we added lasted time and return the result of calling our service methods.

```ts
  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    const result = await this.pollsService.createPoll(createPollDto);

    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = await this.pollsService.joinPoll(joinPollDto);

    return result;
  }

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

Notice that in the case of `createPoll` and `joinPoll`, we can merely pass this "DTOs" because they happen to conform to the type that the methods expect. 

For `rejoinPoll`, we'll extract the data from a token. So for now, we'll populate it with some dummy data. 

Also make sure to remove `Logger` from the imports.

## Demonstrate with Postman 

We can run the app with `npm run start` in the root directory. (Testing shown in video).

## Next time

Thanks again for hanging with me! Next time, we'll learn how to create a `RedisModule` which will allow us to access the `IORedis` library, or module, in our application. 

We need to do this do be able to create a repository layer, or provider, in subsequent tutorials which can store data in Redis!