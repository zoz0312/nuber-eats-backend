import { InputType, PickType, PartialType, Field, Int, ObjectType } from "@nestjs/graphql";
import { Category } from '../entities/category.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class EditCategoryInput extends PickType(
  PartialType(Category),
  ['name', 'coverImage']
) {
  @Field(type => Int)
  categoryId: number;
}

@ObjectType()
export class EditCategoryOutput extends CoreOutput {}