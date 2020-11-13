import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.contants';
import { JwtModuleOptions } from './jwt.interfaces';


@Injectable()
export class JwtService {
  constructor (
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions
  ) {}

  sign(payload: object): string {
    return jwt.sign(payload, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
