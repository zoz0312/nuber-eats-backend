import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Like, Raw, Repository } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";
import { FIXED_PAGE, PAGE_NATION, SKIP_PAGE, TOTAL_PAGES } from '../common/common.pagenation';
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/search-restaurant.dto";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant (
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.create(createRestaurantInput);
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName
      );
      newRestaurant.owner = owner;
      newRestaurant.category = category;
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

  async editRestaurant(
    ownser: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        editRestaurantInput.restaurantId,
      );

      if (!restaurant) {
        return {
          ok: false,
          error: 'Not found restaurant',
        }
      }

      if (ownser.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: `You can't edit a restaurant that you don't own`,
        }
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
      }

      await this.restaurants.save([{
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && { category }),
      }])

      return {
        ok: true
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit Restaurant',
      }
    }
  }

  async deleteRestaurant(
    ownser: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        restaurantId
      );

      if (!restaurant) {
        return {
          ok: false,
          error: 'Not found restaurant',
        }
      }

      if (ownser.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: `You can't edit a restaurant that you don't own`,
        }
      }

      await this.restaurants.softDelete(restaurantId);
      return {
        ok: true,
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete Restaurant',
      }
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories',
      }
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug(
    { slug, page }: CategoryInput
  ): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        }
      }

      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        ...PAGE_NATION(page),
      });

      category.restaurants = restaurants;

      const totalResult = await this.countRestaurants(category);

      return {
        ok: true,
        category,
        totalPages: TOTAL_PAGES(totalResult),
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load category'
      }
    }
  }

  async allRestaurants(
    { page }: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        ...PAGE_NATION(page),
      });

      return {
        ok: true,
        results: restaurants,
        totalPages: TOTAL_PAGES(totalResults),
        totalResults,
      }
    } catch {
      return {
        ok: false,
        error: 'Could not load restaurants'
      }
    }
  }

  async findRestaurantById(
    { restaurantId }: RestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Not found restaurant',
        }
      }
      return {
        ok: true,
        restaurant,
      }
    } catch {
      return {
        ok: false,
        error: 'Could not find restaurant',
      }
    }
  }

  async searchRestaurantByName(
    { query, page }: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try {
      const [retaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`)
        },
        ...PAGE_NATION(page),
      });
      return {
        ok: true,
        retaurants,
        totalResults,
        totalPages: TOTAL_PAGES(totalResults),
      }
    } catch {
      return {
        ok: false,
        error: 'Could not find search restaurant',
      };
    }
  }
}