import { InputType, OmitType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";

/* @InputType() 하나의 object type에 사용됨 */
@InputType()
export class CreateRestaurantDto extends OmitType(
    Restaurant,
    ['id']
) {}
