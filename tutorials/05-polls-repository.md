# 05 - Creating the Polls Repository

In the last tutorial we learned how to create a [Redis Module](../server/src/redis.module.ts), which gave us access to an [IORedis client](https://github.com/luin/ioredis) which we injected into our Polls Provider.

Today, we'll use this client to store our poll inside of our Redis database, which we create via `docker-compose`. Not only will we use Redis, but we'll use the [Redis JSON Module](https://redis.io/docs/stack/json/), which allows us to store, update, and retrieve values in Redis as if it were a JSON object. There's no great reason to do this, but I hadn't had the opportunity to play with Redis JSON yet. That said, it does make it convenient to share the "shape" of our poll between the server and the client, which we'll see today!

*Reminder to clone or degit repo*

## Overview 

As shown in the diagram below, we've been working on a `Polls Module`. As of yet, we've built all of the blocks aside from the `PollsRepository`, which is a provider that we'll create today. With this repository provided, our service will be able to reach out to the repository for storing, updating, and retrieving data in Redis. 

![Polls Repository and current status](/tutorials/resources/05-Polls-Repository-Diagram.png)

Let's scaffold out our repository!

## Creating and Injecting the PollsRepository Class

We'll now create our polls repository in the polls folder at [polls.repository.ts](../server/src/polls/polls.repository.ts). We'll scaffold this out with the familiar `@Injectable` decorator that will allow us to make this accessible to other modules within our [Polls Module](../server/src/polls/polls.module.ts).

```ts
import { Inject } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis.module';

@Injectable()
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }
}
```

We create this class with a private `ttl`, or time to live. In the `constructor`, we access this via the `configService` which has been made available to our [PollsModule](../server/src/polls/polls.module.ts). Recall that this environment variable is set in the [.env file](../server/.env). We set the time to 7200 seconds, which is equal to 2 hours. 

We also initialize a logger which will be helpful for debugging, but would also be useful if you were to take the app to production, which we will not. 

Then we set a private `redisClient` field on our class called `redisClient`. We access this client we provided via our [RedisModule](../server/src/redis.module.ts), which we injected into this polls module in the last tutorial.  Recall in this module that we defined a specific key to locate our client. We import that key and use it along with the `@Inject` field decorator.  

We now have the database config available to store, update, and retrieve items in, and from, Redis. 

Like always, we'll need to register this service, or repository, in the `PollsModule`, which will allow the `PollsService` to call this module's class methods. 

```ts
//omitted previous code
import { PollsRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
```

## Defining Shared Types

I now want to create a shared module for types that will be common to our client and server. This might be overkill, or even unwise, but I still think it's good for learning. But the actual state of our `Poll` can be used by our future client application's state, and to define the `Poll` as stored in our database.

First, let's create a folder called `shared` which will be at the same level as [client](../client/) and [server](../server/).

We'll be sharing features using npm workspaces. So we need to register this inside of our root-level [package.json](../package.json).

```json /package.json
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
```

Next, we'll need to initialize a module in our shared folder. You can use npm init, but I'll just add the following code to [shared/package.json](../shared/package.json). I recommend going to [this repository](https://github.com/JacobSNGoodwin/ranker-course) and grabbing the code directly, if that helps. 


```json /shared/package.json
{
  "name": "shared",
  "version": "0.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "license": "MIT",
  "devDependencies": {
    "@types/react": "^17.0.39",
    "@types/react-dom": "^17.0.13",
    "socket.io-client": "^4.4.1",
    "typescript": "^4.5.3"
  }
}
```

This module will have some dev dependencies that allow us to use Typescript and some types from a couple 3rd party libraries. 

Let's now give this module a typescript configuration. We could also add Typescript configurations for our client and server applications here, but we'll forego this tedious task to keep this from being an hour-long video. 

We add [tsconfig.json](../shared/tsconfig.json) as follows:

```ts
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "strictNullChecks": true,
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react",
  },
  "include": ["."]
}
```

If a recall correctly, the main setting I made sure to update was the `skipLibCheck`, as there were some modules that weren't quite updated for the version of Typescript we're using. 

Let's now run `npm install` to make sure our workspace has access to these dev dependencies.

```sh
npm install
```

We'll then create our poll types in [poll-types.ts](../shared/poll-types.ts).

```ts
export interface Participants {
  [participantID: string]: string;
}

export interface Poll {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminID: string;
  // nominations: Nominations;
  // rankings: Rankings;
  // results: Results;
  // hasStarted: boolean;
}
```

For now, we'll merely create the poll with the 4 fields shown. Later on, we'll add types for other fields as we need them. 

Lastly, we need to export these types, which we'll do in `index.ts`, which we defined in our [package.json](../shared/package.json) as well.

```ts index.ts
export * from './poll-types';
```

## Defining Repository-Only Types

Let's now add types we'll need to create a new poll and to add a participant to a poll. We'll add these to the same [types.ts](../server/src/polls/types.ts) we used for our service types.

```ts types.ts
// polls repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};
```

We'll suffix our types with `Data` for our repository types. 

## Polls Repository Methods

After that necessary aside, we're now ready to add our repository methods. The first will be to create the initial poll. 

```ts
// ...omitted content
import { Poll } from 'shared';
import { CreatePollData } from './types';
import { InternalServerErrorException } from '@nestjs/common/exceptions';

// ...omitted content

 async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }
```

The first thing we do is extract data that will be passed when the function is called.  We set the `pollID`, `topic`, `admin`, and `votesPerVoter` for our initial poll. The admin in our case, we'll be the user who creates the poll. We won't add this user to the `participants` object. That's because we'll add the participant via a token that will provided when the user connects with web sockets. 

We then add some logging.

Lastly, we add code to add this object to Redis in a JSON-like format. Notice that we're sort of using some very base-level usage of the Redis client. That's because the Client doesn't support sophisticated RedisJSON use-cases, or it didn't as of version 4. There is now version 5, so it may be worth looking into any possible updates. 

Anyhow, IORedis allows us to execute multiple comments. In the first commend, we send the command to set a JSON object at the key, `polls:{pollID}`. The `.` is notation of `RedisJSON to access the root of the key. We then need to serialize the JSON to set it in Redis.

The second command we execute is to set a time-to-live on this key.

If this succeeds, we'll return the `initialPoll`, otherwise we throw an exception provided by NestJS for `500` internal server exceptions. We'll go over these in a future tutorial. 

Let's add similar methods to `getPoll`.

```ts
  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll);
    } catch (e) {
      this.logger.error(`Failed to get pollID ${pollID}`);
      throw e;
    }
  }
```

We'll need one more method to add a participant. 

```ts
// ...omitted content
import { AddParticipantData, CreatePollData } from './types';

//... omitted content
  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const pollJSON = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      const poll = JSON.parse(pollJSON) as Poll;

      this.logger.debug(
        `Current Participants for pollID: ${pollID}:`,
        poll.participants,
      );

      return poll;
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw e;
    }
  }
```

## Call Methods from PollsService

Let's now access the repository via our existing service methods. 

To do this, we'll need to access the injected `PollsRepository` via the constructor. 

```ts polls.service.ts
import { Injectable, Logger } from '@nestjs/common';
// ... omitted content
import { PollsRepository } from './polls.repository';
// ... omitted content

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(private readonly pollsRepository: PollsRepository) {}
  // ... omitted content
}
```

We'll add a logger while we're add it. 

We then update our `createPoll` as follows.

```ts
 async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    // TODO - create an accessToken based off of pollID and userID

    return {
      poll: createdPoll,
      // accessToken
    };
  }
```

Let's now update `joinPoll`.

```ts
  async joinPoll(poll: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${poll.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(poll.pollID);

    // TODO - create access Token

    return {
      poll: joinedPoll,
      // accessToken: signedString,
    };
  }
```

And lastly we'll update `rejoinPoll`

```ts
  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );

    const joinedPoll = await this.pollsRepository.addParticipant(fields);

    return joinedPoll;
  }
```

We'll test this out for now by sending `rejoinPollFields` in our HTTP request, but later on these details will be extracted from a JSON Web Token. 

## Postman and RedisInsight

Make sure to start up docker on your computer. In my case, I have docker-desktop running. 

Run the application with `npm run start` from the root directory. 

Check out the YouTube videos to see a demonstration of these endpoints and the entities in RedisInsight!

## Next Time

Thanks for joining again! Next time we'll work on creating a JSON web token after a poll is created or joined. This will then authorize the users to send data to the poll for adding their nominations and for becoming a participant in the poll.