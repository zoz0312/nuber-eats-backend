import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CreateRestaurantDto } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";

@Resolver(of => Restaurant)
export class RestaurantResolver {
    @Query(returns => [Restaurant])
    restaurants(@Args('vegaonOnly') veganOnly: boolean): Restaurant[] {
        return [];
    }

    @Mutation(retuns => Boolean)
    createRestaurant(
        @Args() createRestaurantInput: CreateRestaurantDto,
    ): boolean {
        console.log(createRestaurantInput)
        return true;
    }
}
