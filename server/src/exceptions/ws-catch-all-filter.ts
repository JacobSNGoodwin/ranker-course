import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/types';
import { WsBadRequestException, WsUnknownException } from './ws-exceptions';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof HttpException) {
      const exceptionData = exception.getResponse();
      const exceptionMessage = exceptionData['message'] ?? exceptionData;

      const wsException = new WsBadRequestException(exceptionMessage);
      socket.emit('exception', wsException.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit('exception', wsException.getError());
  }
}
