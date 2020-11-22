import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RestaurantRepository } from "src/restaurants/repositories/restaurant.repository";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentService {
  constructor (
    @InjectRepository(Payment)
    private readonly payment: Repository<Payment>,
    private readonly restairamts: RestaurantRepository,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restairamts.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: `Restaurant not found`,
        }
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: `You are not allowed to do this`
        }
      }

      await this.payment.save(
        this.payment.create({
          transactionId,
          user: owner,
          restaurant,
        })
      );

      return {
        ok: true,
      }
    } catch {
      return {
        ok: false,
        error: `Could not create payment`,
      }
    }
  }
}