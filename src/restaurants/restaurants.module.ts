import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restauants.resolver';

@Module({
    providers: [RestaurantResolver],
})
export class RestaurantsModule {}
