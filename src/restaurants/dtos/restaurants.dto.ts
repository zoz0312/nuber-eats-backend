import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PagenationInput, PagenationOutput } from "src/common/dtos/pagenation.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class RestaurantsInput extends PagenationInput {}

@ObjectType()
export class RestaurantsOutput extends PagenationOutput {
  @Field(type => [Restaurant], { nullable: true })
  results?: Restaurant[];
}