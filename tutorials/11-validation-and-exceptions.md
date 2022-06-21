# 11 - Configuring Validation Pipe and Exception Handling

Hey y'all! Last time we set up an authorization mechanism for web sockets to make sure that a poll participant only sends data to the poll they created or joined. 

As promised, today we'll learn a little bit about exception handling for websockets as well as in general. 

First, however, we're going to enable validation via so-called "pipes" provided by NestJS.

*Github repo reminder*

## Adding UsePipes Decorator for ValidationPipe

We previously created some classes in [dtos.ts](../server/src/polls/dtos.ts). These classes had fields decorated with some constraints on the field provided by the [class-validator](https://github.com/typestack/class-validator) library. For example, a poll must be a string of exactly 6 characters. The number of votes per vote must be an int from one to five.

Unfortunately, I never wired up our application to use these classes. So if we start up are application and go to Postman, observe that we will not get any validation error if we break these rules. 

*Attempt posting votesPerVoter of 10, then maybe a name over 25 characters or empty*

To fix this, we will use a [pipe](https://docs.nestjs.com/pipes). As seen in the NestJS documents, one use of a Pipe is to evaluate input data, and then throw an exception if the data is invalid. 

One built-in pipe in the class-validator pipe. Actually, it looks like Nest also now has a JoiValidation pipe. I don't know if this existed when I created the tutorial, but I highly recommend giving Joi a try, as it's a pretty thorough validation library. 

Anyhow, notes the `CreateCatDto`, and this pretty much looks just like the DTOs we created. If we scroll down in the documents, we can see that we can use a `ValidationPipe` inside of an `@UsePipes` decorator. Otherwise, we can apply it globally.

Let's decorate our [PollsController](../server/src/polls/polls.controller.ts) and [PollsGate](../server/src/polls/polls.gateway.ts) with a `ValidationPipe`. Right now, we aren't passing any data to the gateway that needs to be validated, but soon we will. 

```ts polls.controller.ts
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

//...
@UsePipes(new ValidationPipe())
```

```ts polls.gateway.ts
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';

//...
@UsePipes(new ValidationPipe())
```

Now, let's try to hit our endpoint again with invalid fields. Notes that we now get HTTP 400 errors with a status message for any validation rule that's broken. 

## Example of Exception Layer

Now in general, we're going to be using the built-in exceptions provided by NestJS. One example is the validation exceptions thrown by the pipe we added. These exceptions are handled by NestJS's default exception handler, which is pretty darn good and easy to use for HTTP exceptions and controllers. 

Another example is in our [ControllerAuthGuard](../server/src/polls/controller-auth.guard.ts). Notice that we throw a `ForbiddenException` if the user is not authorized. NestJS picks this up without any effort on our part and converts this into an HTTP 403 error. 

In the [PollsRepository](../server/src/polls/polls.repository.ts) we throw an `InternalServerException` which gets picked up by NestJS and responds with an HTTP 500 response. Something similar will happen for unknown errors.

## WSException

But how do we handle exceptions for Websockets?

Well, first off, it's quite easy to throw exceptions directly with Websockets. To do so, we can throw a [WsException](https://docs.nestjs.com/websockets/exception-filters). To see how this works, let's add an event listener that will listen to events sent from Postman. So I guess this will actually be our first event listener on the server. We'll add the following at the bottom of [PollsGateway](../server/src/polls/polls.gateway.ts).

```ts
import {
  // ...
  SubscribeMessage,
  //...
} from '@nestjs/websockets';

  @SubscribeMessage('test')
  async test() {
    throw new WsException({ field: 'field', message: 'You screwed up' });
  }
```

To listen to messages, we decorate a method with the `@SubscribeMessage` decorator. We can call the method whatever we want, so I'll just use the same name as the message. Inside, throw a websocket-specific exception provided by nest-js. We can provide either a string or an object to this exception. 

We'll later learn about how to send data with the Websocket message, but for now, we're just send an empty message called `test`.

Let's test this in Postman. But before doing this, I'll inform you that any exception that occurs while using Websockets will send an event back to the client called `exception.` So we need to listen for this in Postman. 

*Demonstrate by sending message to test.*

But what would happen if we receive an exception that is not a WsException. Say we get an unknown error while trying to store data in Redis. Let's demonstrate this by throwing a plain-old error in our `test` handler method.

```ts
  @SubscribeMessage('test')
  async test() {
    throw new Error('Blah');
  }
```

*Send `test` with Postman.*

This time, we get a message with `Internal server error`, as sort of a catch all. However, we may want more control over this, which we can do by creating something in `NestJS` called an `Exception Filter`. But first, I want to create some well-defined socket exception types which extent the `WsException`.

## Defining and Extending WsException

To do this, let's create a [ws-exceptions.ts](../server/src/exceptions/ws-exceptions.ts) file in an `exceptions` folder. We'll define a `WsTypeException` extending the nestjs exception.

```ts
import { WsException } from '@nestjs/websockets';

type WsExceptionType = 'BadRequest' | 'Unauthorized' | 'Unknown';

export class WsTypeException extends WsException {
  readonly type: WsExceptionType;

  constructor(type: WsExceptionType, message: string | unknown) {
    const error = {
      type,
      message,
    };
    super(error);
    this.type = type;
  }
}
```

We define three possible Exception types as a Typescript Union. This means that our exception must be one of these 3 strings. Our exception will store one of these on a class field called `type`. 

To create our exception, we pass the type, along with a string or other type. For the super constructor of the `WsException`, we'll send our type and the message as fields of an object. We then set our class's `type`. We are really doing this so then we can create more specific exceptions from this general exception. We'll do this as follows. 

```ts
export class WsBadRequestException extends WsTypeException {
  constructor(message: string | unknown) {
    super('BadRequest', message);
  }
}

export class WsUnauthorizedException extends WsTypeException {
  constructor(message: string | unknown) {
    super('Unauthorized', message);
  }
}

export class WsUnknownException extends WsTypeException {
  constructor(message: string | unknown) {
    super('Unknown', message);
  }
}
```

These exceptions allow us to throw the various types of exceptions without specifying the type field, and by merely passing a string or some other object. 

Let's try throwing a `WsBadRequestException` exception in our `test` message handler. 

```ts
throw new WsBadRequestException('Invalid empty data :)');
```

*Demo in Postman*

So we basically have a nice way now to send our custom WSException types.

## Exception Filter

Let's now handle how we can convert general exceptions, like those thrown in our service or repository into one of our custom exceptions. To do this in NestJS, we create a filter.

We'll look at docs that mostly reference HTTP Exceptions that would come through a controller, but similar principals will apply to WebSockets. We'll only apply these principals to websockets as I'm pretty content with how NestJS converts general Errors or exceptions into `HttpExceptions`.

*Scroll through doc and show how we can catch particular exceptions*

*Scroll further to show we can generally catch them as well*

I ended up going with an approach to catch all possible exceptions. We'll basically just end up catching a few exception types, so we won't need a million if statements.

We'll create this inside of a [ws-catch-all-filter.ts](../server/src/exceptions/ws-catch-all-filter.ts) in the `exceptions folder`.

First, we'll create a class extending the `ExceptionFilter` provided by NestJS.

```ts
// also add imports
@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const socket: SocketWithAuth = host.switchToWs().getClient();
  }
}
```

First of all, we'll extend the same extension filter as in the NestJS examples. We also don't apply any types in our `@Catch` decorator. One thing I do differently than the examples is apply the `Error` type to our exception, as all possible exceptions have it as a parent type. Then, I access the `socket.io` client which we can access on the `ArgumentHost`. Since the `ExceptionFilter` can be applied to both Http and Socket contexts, we basically need to tell the method to get us the socket. 

We'll now catch some particular exceptions, and then default for all other types.


```ts
// ... imports
    if (exception instanceof BadRequestException) {
      const exceptionData = exception.getResponse();
      const exceptionMessage =
        exceptionData['message'] ?? exceptionData ?? exception.name;

      const wsException = new WsBadRequestException(exceptionMessage);
      socket.emit('exception', wsException.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit('exception', wsException.getError());
```

For now, and we may or may not update this later, I really just want to convert a `BadRequestException`, which is a subclass of `HttpException` into a `WsBadRequestException`. Remember earlier in this tutorial how we added a validation pipe? Well, this pipe only throws `BadRequest` Http exceptions. In subsequent tutorials, we'll actually use a similar class to validate an incoming socket event payload, and we want a way to convert the error into a websocket exception message.

The way I'm extracting the response, and then the message field is just something you'll need to play around with. But getting the `message` field should be valid in most cases. If it's null or undefined though, we'll just send a `BadRequest`, which should be the `exception.name`.

Also note that we emit the `exception` type message ourselves via a socket client. We cannot just rethrow and exception, because we're already in the exception handling zone of Nest, and there's not other code to handle errors after this. 

Now, our app is small, so this may be overkill. We might have just handled the validation manually and thrown the `WsBadRequestException` ourselves. But I wanted to show you an approach which is hopefully more scalable. 

## Apply New WebSockets Exceptions and Test

To apply this, we need to add a `UseFilter` to our [PollsGateway](../server/src/polls/polls.gateway.ts).

```ts
// imports
@UseFilters(new WsCatchAllFilter())
```

*Demo by throwing Error and BadRequestException in Postman*

*Clean up unused exceptions in PollsGateway*

## Next Time

For next time... well, I haven't thought that far ahead. But I believe we'll actually work on some real event handlers, like for joining a particular Socket.io "room", so that your poll sort of stays private.

Can't wait to see you then!

