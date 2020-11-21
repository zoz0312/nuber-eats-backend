import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './common.contants';

// PubSub is not sync another server
// if you want sync, then use "RedisPubsub"

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    }
  ],
  exports: [PUB_SUB]
})
export class CommonModule {}
