import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "./output.dto";

@InputType()
export class PagenationInput {
  @Field(type => Int, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PagenationOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  totalPages?: number;
}