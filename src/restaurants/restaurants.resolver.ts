import { Query, Args, Mutation, Resolver, ResolveField, Parent } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurants.service";

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restauantService: RestaurantService){

  }

  @Role(['Owner'])
  @Mutation(returns => CreateRestaurantOutput)
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restauantService.createRestaurant(
      authUser,
      createRestaurantInput
    );
  }

  @Role(['Owner'])
  @Mutation(returns => EditRestaurantOutput)
  async editRestaurant(
    @AuthUser() authUser: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restauantService.editRestaurant(
      authUser,
      editRestaurantInput,
    );
  }

  @Role(['Owner'])
  @Mutation(returns => DeleteRestaurantOutput)
  async deleteRestaurant(
    @AuthUser() authUser: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restauantService.deleteRestaurant(
      authUser,
      deleteRestaurantInput,
    );
  }
}


@Resolver(of => Category)
export class CategoryResolver {
  constructor(
    private readonly restauantService: RestaurantService
  ){}

  @ResolveField(type => Number)
  restauantCount(@Parent() category: Category): Promise<number> {
    return this.restauantService.countRestaurants(category);
  }

  @Query(type => AllCategoriesOutput)
  allcategories(): Promise<AllCategoriesOutput> {
    return this.restauantService.allCategories();
  }

  @Query(type => CategoryOutput)
  category(
    @Args() categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restauantService.findCategoryBySlug(categoryInput);
  }
}