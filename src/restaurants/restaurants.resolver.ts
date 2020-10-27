import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CreateRestaurantDto } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurants.service";

@Resolver(of => Restaurant)
export class RestaurantResolver {
    constructor(private readonly restauantService: RestaurantService){

    }

    @Query(returns => [Restaurant])
    restaurants(): Promise<Restaurant[]> {
        return this.restauantService.getAll();
    }

    @Mutation(retuns => Boolean)
    createRestaurant(
        @Args() createRestaurantInput: CreateRestaurantDto,
    ): boolean {
        console.log(createRestaurantInput)
        return true;
    }
}
