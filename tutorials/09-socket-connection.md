# 09 - Handling Socket Connection and Disconnection

In the last tutorial we set up a gateway for handling socket.io communication between this server application and multiple clients which will connect to our server via websockets. 

Today, we'll add some methods which log when a socket.io client connects to, or disconnects from, our server. Finally, we'll connect with a client, which in our case will be Postman and confirm that it is connecting and disconnecting from the server. 

In subsequent videos, we'll use our react application to create a socket.io connection via websockets to our application. 

## Handling Connection and Disconnection

*With socket.io [namespace](https://socket.io/docs/v4/server-api/#namespace) docs open*

The first thing we'll handle is what happens when a client connects to and disconnects from our server. It turns our that NestJS's websockets module provides interfaces which we can implement for this case called `OnGatewayConnection` and `OnGatewayDisconnect`. Let's implement this in our [PollsGateway](../server/src/polls/polls.gateway.ts).

```ts
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';

// ...content omitted

@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  handleDisconnect(client: any) {
    throw new Error('Method not implemented.');
  }

  handleConnection(client: any, ...args: any[]) {
    throw new Error('Method not implemented.');
  }
}
```

These newly added methods will have access to the connecting client. You'll see info about these clients when we test connecting a client.

We can actually get some help with the types for these clients, since we know that our implementation will be using socket-io. We can import and apply the `Socket` type from `socket.io`.

```ts
import { Socket } from 'socket.io';
// ... content omitted

  // inside PollsGateway class
  handleConnection(client: Socket) {
    throw new Error('Method not implemented.');
  }

  handleDisconnect(client: Socket) {
    throw new Error('Method not implemented.');
  }
```

Before we do any logging or sending events back to a client socket, I first want to bring in the socket.io server namespace. Lets take a look at what I'm referring to in the [socket.io namespace and server docs](https://socket.io/docs/v4/server-api/#namespace).

*Show some evens such as sockets connected and `.to` method. The namespace.emit is different from the client.emit in that it will send the event to all clients, including the connected client. There's also a client.emit which would send events to all OTHER clients.*

NestJS provides us, once again with a lovely decorator, `@WebSocketServer` which will give us access to the namespace of our `WebSocketGateway`, which in our case is the `/polls` namespace as defined in the class decorator. 

We'll add this field just below our constructor.

```ts
// update imports
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';

// in class body beneath constructor
@WebSocketServer() io: Namespace;
```

With these, we'll now add some logging to show what clients are currently connected to our server.

## Logging connected clients

I'm going cut right to the chase and add the logs to `handleConnection`.first-letter:

```ts
  handleConnection(client: Socket) {
    const sockets = this.io.sockets;

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }
```

Hopefully you'll already see the benefit of bringing in the `io` namespace. Notice that it gives us access to *all* of the sockets that are connected to the server. We add a log showing the current client id of the connected socket, along with the number of total sockets connected to this namespace. 

Later on we'll abstract down even further to "rooms," which will limit sockets to sending and receiving messages belonging to a particular poll. 

We'll also add the following logs to `handleDisconnect`.

```ts
// TODO - use SocketWithAuth (contains userID and pollID)
  async handleDisconnect(client: Socket) {
    const sockets = this.io.sockets;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    // TODO - remove client from poll and send `participants_updated` event to remaining clients
  }
```

Down the line, this handler will also remove the participant, or user, from Redis, then inform other clients that this user has been disconnected. 

## Testing connecting and Disconnecting Clients

*Make sure to go to settings and set client to `v4`*

*Add events for hello and goodbye*

*Emit events both from server and from individual client*

## Next Time

That's all for today! Next time we'll work on adding an authorization guard, similar to how we did for the controller, but for our websockets gateway. I look forward to seeing you then. 

