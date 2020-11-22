import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payments.service";

@Resolver(of => Payment)
export class PaymentResolver {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Role(['Owner'])
  @Mutation(returns => CreatePaymentOutput)
  async createPayment (
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentService.createPayment(owner, createPaymentInput);
  }
}