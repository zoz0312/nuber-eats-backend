import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Dish } from "src/restaurants/entities/dish.entity";
import { RestaurantRepository } from "src/restaurants/repositories/restaurant.repository";
import { User, UserRole } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";

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

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          }
        })
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          }
        })
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });

        orders = restaurants.map(restaurant => {
          return restaurant.orders;
        }).flat(1);

        if (status) {
          orders = orders.filter(order => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      }
    } catch {
      return {
        ok: false,
        error: 'Could not load orders'
      }
    }
  }

  userPermissionChecker(
    { role, id: userId }: User,
    order: Order,
  ): boolean {
    let isCanSee = true;
    if (
      role === UserRole.Client
      && order.customerId !== userId
    ) {
      isCanSee = false;
    }

    if (
      role === UserRole.Delivery
      && order.driverId !== userId
    ) {
      isCanSee = false;
    }

    if (
      role === UserRole.Owner
      && order.restaurant.ownerId !== userId
    ) {
      isCanSee = false;
    }
    return isCanSee;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(
        orderId,
        { relations: ['restaurant']
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        }
      }

      if (!this.userPermissionChecker(user, order)) {
        return {
          ok: false,
          error: `You don't have permission`
        }
      }

      return {
        ok: true,
        order,
      }
    } catch (error) {
      console.log('error', error)
      return {
        ok: false,
        error: `Could not load order`,
      }
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(
        orderId,
        { relations: ['restaurant'] }
      );

      if (!order) {
        return {
          ok: false,
          error: `Order not found`
        }
      }

      if (!this.userPermissionChecker(user, order)) {
        return {
          ok: false,
          error: `You don't have permission`
        }
      }

      let canEdit = false;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }

      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooking
          || status === OrderStatus.Cooked
        ) {
          canEdit = true;
        }
      }

      if (user.role === UserRole.Delivery) {
        if (status === OrderStatus.PickedUp
          || status === OrderStatus.Delivered
        ) {
          canEdit = true;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: `You can't edit`
        }
      }

      await this.orders.save([{
        id: orderId,
        status,
      }]);

      return {
        ok: true,
      }
    } catch {
      return {
        ok: false,
        error: `Could not found order`
      }
    }
  }
}