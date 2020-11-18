import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>
  ) {
  }

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant (
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.create(createRestaurantInput);
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      }
    } catch (error) {
      return {
        ok: false,
        error
      }
    }
  }
}