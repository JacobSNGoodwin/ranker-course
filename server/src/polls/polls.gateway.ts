import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';
import { NominationDto } from './dtos';
import { GatewayAdminGuard } from './gateway-admin.guard';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './types';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID}, and name: "${client.name}"`,
    );

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    const roomName = client.pollID;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollID, userID } = client;
    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );

    const roomName = client.pollID;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

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
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Attempting to remove participant ${id} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant(
      client.pollID,
      id,
    );

    if (updatedPoll) {
      this.io.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

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

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('start_vote')
  async startVote(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Attempting to start voting for poll: ${client.pollID}`);

    const updatedPoll = await this.pollsService.startPoll(client.pollID);

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('submit_rankings')
  async submitRankings(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody('rankings') rankings: string[],
  ): Promise<void> {
    this.logger.debug(
      `Submitting votes for user: ${client.userID} belonging to pollID: "${client.pollID}"`,
    );

    const updatedPoll = await this.pollsService.submitRankings({
      pollID: client.pollID,
      userID: client.userID,
      rankings,
    });

    // an enhancement might be to not send ranking data to clients,
    // but merely a list of the participants who have voted since another
    // participant getting this data could lead to cheating
    // we may add this while working on the client
    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('close_poll')
  async closePoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Closing poll: ${client.pollID} and computing results`);

    const updatedPoll = await this.pollsService.computeResults(client.pollID);

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('cancel_poll')
  async cancelPoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Cancelling poll with id: "${client.pollID}"`);

    await this.pollsService.cancelPoll(client.pollID);

    this.io.to(client.pollID).emit('poll_cancelled');
  }
}
