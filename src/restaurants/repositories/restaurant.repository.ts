import { PAGE_NATION } from "src/common/common.pagenation";
import { EntityRepository, Repository } from "typeorm";
import { Restaurant } from "../entities/restaurant.entity";

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async findAllRestaurants (
    page: number,
    where: Object,
  ):Promise<Restaurant[]> {
    return await this.find({
      where,
      ...PAGE_NATION(page),
      order: {
        isPromoted: 'DESC',
      }
    });
  };

  async findAllRestaurantsCount (
    page: number,
    where: Object,
  ):Promise<[Restaurant[], number]> {
    return await this.findAndCount({
      where,
      ...PAGE_NATION(page),
      order: {
        isPromoted: 'DESC',
      }
    });
  }
}