import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { Payment } from './entities/payment.entity';
import { PaymentResolver } from './payments.resolver';
import { PaymentService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Payment,
    RestaurantRepository,
  ])],
  providers: [PaymentResolver, PaymentService]
})
export class PaymentsModule {}
