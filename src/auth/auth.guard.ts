import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // switching context => graphql context
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const { user } = gqlContext;
    return user ? true : false;
  }
}