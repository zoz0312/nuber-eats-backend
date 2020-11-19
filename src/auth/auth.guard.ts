import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    // switching context => graphql context
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles || roles.includes('Any')) {
      // Public Users [OR] Any Users
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user:User = gqlContext['user'];

    return user ? roles.includes(user.role) : false;
  }
}