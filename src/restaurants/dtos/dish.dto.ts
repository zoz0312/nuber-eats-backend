import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { Dish } from "../entities/dish.entity";
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DishInput extends PickType(
  Dish,
  ['id'],
) {}

@ObjectType()
export class DishOutput extends CoreOutput {
  @Field(type =>Dish, { nullable: true })
  dish?: Dish;
}