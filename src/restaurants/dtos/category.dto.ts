import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { PagenationInput, PagenationOutput } from "src/common/dtos/pagenation.dto";
import { Category } from "../entities/category.entity";

@InputType()
export class CategoryInput extends PagenationInput {
  @Field(type => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PagenationOutput {
  @Field(type => Category, { nullable: true })
  category?: Category;
}