import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PagenationInput, PagenationOutput } from "src/common/dtos/pagenation.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class MyRestaurantsInput extends PagenationInput {}

@ObjectType()
export class MyRestaurantsOutput extends PagenationOutput {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}