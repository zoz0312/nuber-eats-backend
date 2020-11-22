import { Injectable } from "@nestjs/common";
import { Cron, Interval, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { RestaurantRepository } from "src/restaurants/repositories/restaurant.repository";
import { User } from "src/users/entities/user.entity";
import { LessThan, Repository } from "typeorm";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { GetPaymentOutput } from "./dtos/get-payment.dto";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentService {
  constructor (
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    private readonly restaurants: RestaurantRepository,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
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

      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.isPromoted = true;
      restaurant.promitedUntil = date;
      this.restaurants.save(restaurant);

      await this.payments.save(
        this.payments.create({
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

  async getPayment (
    owner: User,
  ): Promise<GetPaymentOutput> {
    try {
      const payments = await this.payments.find({ user: owner });
      return {
        ok: true,
        payments,
      }
    } catch (error) {
      return {
        ok: false,
        error: `Could not get payment`,
      }
    }
  }

  @Interval(2000)
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      isPromoted: true,
      promitedUntil: LessThan(new Date()),
    });
    restaurants.forEach(async restaurant => {
      restaurant.isPromoted = false;
      restaurant.promitedUntil = null;
      await this.restaurants.save(restaurant);
    })
  }
}