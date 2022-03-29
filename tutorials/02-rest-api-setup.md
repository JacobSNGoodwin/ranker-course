# 02 - Rest API Setup

In this tutorial we'll learn how to configure NestJS to handle incoming requests to crete a poll, join a poll, and rejoin a poll in the case that the user accidentally closes their browser.

We won't flush out all of the details of the creating a poll in a database, but we will learn how to create a `Polls` controller with "endpoints."

As a reminder, this tutorial has a [readme](../readme.md) which explains how to `degit` or `clone` the repo at the starting point of this lesson.

## Modules Overview

Before coding our endpoints, we're going to go over what a ["module"](https://docs.nestjs.com/modules) is in NestJS. NestJS recommends that we use these modules to group an application into related features.

In our application, we basically only have a single feature, which is a feature to manage "polls." By polls, I'm referring to the topic which will be voted on. We will create a couple of other modules later on for configuring our application to work with Redis and JSON web tokens, but our main "feature" module will be used for working with polls.

If we look at [main.ts](../server/src/main.ts), you'll see that we create an application with a "root" `AppModule` via the `NestFactory.create` function. We also provide app creation configuration via the second argument. In this case, we merely configure our server to receive requests from the port of the client application we'll build later on.  

If we take a look at the [AppModule](../server/src/app.module.ts), we see that it is an empty class. 

Perhaps more interestingly, we have the `@Module` decorator. We observe that this `Module` can have `imports`, `providers`, `imports`, and `exports`.

Without going into too much detail and talking more that I already have, let's go over briefly what this are. 

### Provider 

A provider is a way to provide some sort of functionality to your application. If this sounds vague, that's because it sort of it! Usually, it's a way to provide services or application logic to a module. In our application, we'll "provide" a "polls service" which handles application logic between our Rest API and database.

### Imports

Imports provide a way bring in the features of a module which you may have created or maybe one which exists in some library. Looking again at our [App Module]([AppModule](../server/src/app.module.ts), notice that we are importing a `ConfigModule`. This is a [module provided by NestJS](https://docs.nestjs.com/techniques/configuration). We instantiate this module with a provided factory. This factory will look for a `.env` file at the root of the project by default, but can be configured to look for other files or configurations as required.

Since we have injected this `ConfigModule`, we can use it throughout out application to access environment variables. 

Notice that we can even access the Config outside of a module with `app.get(ConfigService)` inside of `main.ts`.

I now want to try adding an new environment variable for CORS. Notice that we hard-code our `CORS` port. First, let's add this to our [.env](../server/.env) file.

```toml
PORT=3000
CLIENT_PORT=8080
REDIS_HOST=localhost
```

Then we'll call a dedicated method on the `app` to dynamically configure CORS.

```ts
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT'));
  const clientPort = parseInt(configService.get('CLIENT_PORT'));

  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
    ],
  });

  await app.listen(port);
```

Notice that we wrap the second possible origin inside of a `RegExp` constructor, which allows us to use string interpolation for the `clientPort`.

We then clean up the `cors` configuration of the app factory.

```ts
const app = await NestFactory.create(AppModule);
```

### Exports

Now that we've gone off on a bit of a tangent, let's talk about `exports`. We'll see this later, but this allows us to define what services or providers of a module we create should be made available externally. Later on, we'll create a `RedisModule` which we export a redis client that other modules or services can use. 

### Controllers

Controllers are used to handle incoming requests from clients and outgoing responses to clients. In the case of our REST API, the controller will define the paths and request methods, along with the parsing of request bodies into typed data structure and serializing of typed data structures for outgoing responses.

## Create Polls Module

With that monstrosity of an overview out of the way, let's create our `PollsModule`. To do so, let's add a new folder for grouping our "poll" functionality. Inside of it, we'll create a [polls.module.ts](../server/src/polls/polls.module.ts) file. 

We will need to import the `Module` decorator from `@nestjs` at the top. 

```ts
import { Module } from '@nestjs/common';
```

While we're add it, we also import the previously mentioned `ConfigModule`.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
```

We then create our `PollsModule` as a class. 

```ts
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
})
export class PollsModule {}
```

Notice that we add the `ConfigModule` as an import, as we'll want to be able to access our environment variable *throughout* this module. We'll see how we can get access to this module later on.

Now that we have a Polls module, we need the application to know about it. Therefore, we will import and register this module in the [app.module.ts](../server/src/app.module.ts) file.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [ConfigModule.forRoot(), PollsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

Let's now fire up our application, which will have live reload enabled via the `nest start --watch` command.

Also, you'll need to make sure that you have `docker` running.

```sh
npm run start
```

## Add a Polls Controller with Endpoints

We're now finally ready to create a controller. We do so by creating a [polls.controller.ts](../server/src/polls/polls.controller.ts) file.  

As we'll frequently do in these class-based frameworks, let's create a class for this `polls` controller. We'll decorate this controller with Nest's built-in `@Controller` decorator. 

```ts
import { Controller, Logger, Post, Body } from '@nestjs/common';

@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!
}
```

Next, we're going to define routes for creating, joining, and rejoining a  poll. We do this with a decorated method inside the class as follows.

```ts
@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!

  @Post()
  async create() {
    Logger.log('In create!');
  }

  @Post('/join')
  async join() {
    Logger.log('In join!');
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('In rejoin!');
  }
}
```

This will allow us to send post requests to `localhost:8080/polls`, `localhost:8080/polls/join`, and `localhost:8080/polls/rejoin`.

*Test these in Postman*

## Define Request Body for Endpoints

But how can we actually capture any incoming data from the client? NestJS has us covered with a nice decorator for this as well. 

To make use of these decorators, we'll first create some Typescript types, classes in this case, that will define what we expect in the request body. 

We'll create a [dtos.ts](../server/src/polls/dtos.ts) file which will store our types. 

```ts
import { Length, IsInt, IsString, Min, Max } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @Length(1, 100)
  topic: string;

  @IsInt()
  @Min(1)
  @Max(5)
  votesPerVoter: number;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class JoinPollDto {
  @IsString()
  @Length(6, 6)
  pollID: string;

  @IsString()
  @Length(1, 18)
  name: string;
}
```

In this code, we add classes which also serve to validate incoming data. 

For example, our `votesPerVotes` must be an integer (or a string that parses to an integer. We can use utilities from the `class-validator` package to validate our class fields. I use this `class-validator` library as it is one that is fairly well-documented by NestJS.

We won't create a request body definition for `Rejoin` poll, which I'll explain shortly. 

Back in the polls controller, we'll update our classes to use these body definitions.

```ts
@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    Logger.log('In create!');

    return createPollDto;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    Logger.log('In join!');

    return joinPollDto;
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('In rejoin!');
    // @TODO - add implementation for extracting user from token

    return {
      message: 'rejoin endpoint',
    };
  }
}
```

## Register Controller in Module

We have one minor step to take care of before this thing will work. And that is, to register it in [polls.module.ts](../server/src/polls/polls.module.ts);

```ts
import { PollsController } from './polls.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PollsController],
  providers: [],
})
export class PollsModule {}
```

## Test Endpoints

With everything setup, we can test our endpoints. *I'll test in the video with Postman.*

## Next Time

Thanks for sticking with me! Next time, we'll learn how we can create a service, which will interact between the controller and our data, or repository layer. 

Hasta la próxima!