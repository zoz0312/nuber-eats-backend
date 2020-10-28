import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CreateRestaurantDto } from "./dtos/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dtos/update-restaurant.dto";
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

  @Mutation(returns => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantDto
  ): Promise<boolean> {
    try {
      await this.restauantService.createRestaurant(createRestaurantInput);
      return true;
    } catch (e) {
      console.log('e', e);
      return false;
    }
  }

  @Mutation(returns => Boolean)
  async updateRestaurant(
    @Args() UpdateRestaurantDto: UpdateRestaurantDto
  ): Promise<boolean> {
    try {
      await this.restauantService.updateRestaurant(UpdateRestaurantDto);
      return true;
    } catch (e) {
      console.log('e', e);
      return false;
    }
  }
}
