import { Injectable } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { Raw, Repository } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";
import { TOTAL_PAGES } from '../common/common.pagenation';
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/search-restaurant.dto";
import { RestaurantRepository } from "./repositories/restaurant.repository";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Dish } from "./entities/dish.entity";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import { isURL } from "class-validator";
import { MyRestaurantsInput, MyRestaurantsOutput } from "./dtos/my-restaurants.dto";

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async myRestaurants (
    owner: User,
    { page }: MyRestaurantsInput,
  ): Promise<MyRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAllRestaurantsCount(page, { owner });

      return {
        ok: true,
        restaurants,
        totalPages: TOTAL_PAGES(totalResults, 6),
        totalResults,
      }
    } catch (error) {
      return {
        ok: false,
        error
      }
    }
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

      const restaurants = await this.restaurants.findAllRestaurants(
        page,
        { category }
      );

      category.restaurants = restaurants;

      const totalResults = await this.countRestaurants(category);

      return {
        ok: true,
        category,
        restaurants,
        totalPages: TOTAL_PAGES(totalResults, 6),
        totalResults,
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
      const [restaurants, totalResults] =
        await this.restaurants.findAllRestaurantsCount(page, {});

      return {
        ok: true,
        results: restaurants,
        totalPages: TOTAL_PAGES(totalResults, 6),
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
      const restaurant = await this.restaurants.findOne(
        restaurantId,
        { relations: ['menu'] },
      );
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
      const [restaurants, totalResults] =
        await this.restaurants.findAllRestaurantsCount(
          page,
          { name: Raw(name => `${name} ILIKE '%${query}%'`) }
        );
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: TOTAL_PAGES(totalResults, 6),
      }
    } catch {
      return {
        ok: false,
        error: 'Could not find search restaurant',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId
      );
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: `You don't have permission`,
        }
      }

      await this.dishes.save(
        this.dishes.create({
          restaurant,
          ...createDishInput,
        })
      );

      return {
        ok: true,
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create dish',
      }
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(
        editDishInput.dishId,
        { relations: ['restaurant'] },
      );

      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        }
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: `You don't have permission`,
        }
      }

      await this.dishes.save([{
        id: editDishInput.dishId,
        ...editDishInput,
      }]);

      return {
        ok: true,
      }
    } catch {
      return {
        ok: false,
        error: `Could not Edit Dish`,
      }
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(
        dishId,
        { relations: ['restaurant'] },
      );

      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        }
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: `You don't have permission`,
        }
      }

      await this.dishes.softDelete(dishId);

      return {
        ok: true,
      }
    } catch {
      return {
        ok: false,
        error: 'Could not Delete dish'
      }
    }
  }
}