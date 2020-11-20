import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { Order } from "./entities/order.entity";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly order: Repository<Order>,
  ) {}

  async createOrder(
    customer: User,
    createOrderIntput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {

    } catch {
      return {
        ok: false,
      }
    }
  }
}