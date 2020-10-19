import { ArgsType, Field } from "@nestjs/graphql";
import { IsBoolean, IsString, Length } from "class-validator";

/* @InputType() 하나의 object type에 사용됨 */
@ArgsType()
export class CreateRestaurantDto {
    @Field(type => String)
    @IsString()
    @Length(2, 15)
    name: string;

    @Field(type => Boolean)
    @IsBoolean()
    isVegaon: boolean;

    @Field(type => String)
    @IsString()
    address: string;

    @Field(type => String)
    @IsString()
    ownersName: string;
}