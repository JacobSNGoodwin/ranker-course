import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisModule } from 'src/modules.config';
import { PollsController } from './polls.contoller';
import { PollsRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
