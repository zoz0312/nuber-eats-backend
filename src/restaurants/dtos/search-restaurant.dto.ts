import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PagenationInput, PagenationOutput } from "src/common/dtos/pagenation.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class SearchRestaurantInput extends PagenationInput {
  @Field(type => String)
  query: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PagenationOutput {
  @Field(type => [Restaurant], { nullable: true })
  retaurants?: Restaurant[];
}