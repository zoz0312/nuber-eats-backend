import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { RestaurantsModule } from './restaurants/restaurants.module';

const config = require('../config.json');

// config {
//   type: 'postgres',
//   host: 'localhost',
//   port: '',
//   username: '',
//   database: '',
//   password: '',
//   synchronze: true,
//   logging: true,
// }

@Module({
  imports: [
    TypeOrmModule.forRoot(config),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
