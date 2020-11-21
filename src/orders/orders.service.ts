import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Dish } from "src/restaurants/entities/dish.entity";
import { RestaurantRepository } from "src/restaurants/repositories/restaurant.repository";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order } from "./entities/order.entity";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    private readonly restaurants: RestaurantRepository,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: `Restaurant not found`,
        }
      }

      let orderFinalPrice = 0;
      const orderItmes: OrderItem[] = [];
      for (const { dishId, options } of items) {
        const dish = await this.dishes.findOne(dishId);
        if (!dish) {
          return {
            ok: false,
            error: `Dish not found`,
          }
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of options) {
          const dishOption = dish.options.find(dishOption => {
            return dishOption.name === itemOption.name;
          });
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(optionChoice => {
                return optionChoice.name === itemOption.choice;
              });
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;

        orderItmes.push(
          await this.orderItems.save(
            this.orderItems.create({
              dish,
              options,
            })
          )
        );
      };

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItmes,
        })
      );
      return {
        ok: true,
      }
    } catch {
      return {
        ok: false,
        error: 'Could not create order'
      }
    }
  }
}