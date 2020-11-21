import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';
import { OrderResolver } from './orders.resolver';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    Order,
    OrderItem,
    Dish,
    RestaurantRepository,
  ])],
  providers: [
    OrderService,
    OrderResolver
  ]
})
export class OrdersModule {}
