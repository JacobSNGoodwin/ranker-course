import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisModule } from 'src/modules.config';
import { PollsController } from './polls.contoller';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
