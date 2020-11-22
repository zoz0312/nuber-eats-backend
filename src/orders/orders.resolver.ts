import { Inject } from "@nestjs/common";
import { Args, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { PubSub } from "graphql-subscriptions";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { NEW_ORDER_UPDATE, NEW_COOKED_ORDER, NEW_PNEDING_ORDER, PUB_SUB } from "src/common/common.contants";
import { User } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderUpdatesInput } from "./dtos/order-updates.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { Order } from "./entities/order.entity";
import { OrderService } from './orders.service';


@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  @Role(['Client'])
  @Mutation(returns => CreateOrderOutput)
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderIntput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderIntput);
  }

  @Role(['Any'])
  @Query(returns => GetOrdersOutput)
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, getOrdersInput);
  }

  @Role(['Any'])
  @Query(returns => GetOrderOutput)
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Role(['Any'])
  @Mutation(returns => EditOrderOutput)
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  @Mutation(returns => Boolean)
  async potatoReady(
    @Args('potatoId') potatoId: number,
  ) {
    await this.pubSub.publish('testPubSub', {
      readyPotato: potatoId,
    })
    return true;
  }

  @Role(['Owner'])
  @Subscription(returns => Order, {
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id;
    },
    resolve: ({ pendingOrders: { order } }) => {
      return order;
    }
  })
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PNEDING_ORDER);
  }

  @Role(['Delivery'])
  @Subscription(returns => Order)
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Role(['Any'])
  @Subscription(returns => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input: { id } }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (order.driverId !== user.id
        && order.customerId !== user.id
        && order.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === id;
    }
  })
  orderUpdates(
    @Args('input') orderUpdatesInput: OrderUpdatesInput,
  ) {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE)
  }

  @Role(['Delivery'])
  @Mutation(returns => TakeOrderOutput)
  async takeOrder(
    @AuthUser() driver: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.ordersService.takeOrder(driver, takeOrderInput);
  }
}