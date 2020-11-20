import { Field, Float, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsNumber } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { OrderService } from "../orders.service";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' })

@InputType('OrderInputType', { isAbstract:true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(type => User, { nullable: true })
  @ManyToOne(
    type => User,
    user => user.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  customer?: User;

  @Field(type => User, { nullable: true })
  @ManyToOne(
    type => User,
    user => user.rides,
    { onDelete: 'SET NULL', nullable: true },
  )
  driver?: User;

  @Field(type => Restaurant, { nullable: true })
  @ManyToOne(
    type => Restaurant,
    restaurant => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  restaurant?: Restaurant;

  @Field(type => [OrderItem])
  @ManyToMany(type => OrderItem)
  @JoinTable()
  items: OrderItem[];

  @Field(type => Float)
  @Column({ nullable: true })
  @IsNumber()
  total?: number;

  @Field(type => OrderStatus)
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.Pending
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}