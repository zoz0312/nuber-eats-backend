import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { User } from "./entities/user.entity";


export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>
  ) {}

  async createAccount({
        email,
        password,
        role,
      }: CreateAccountInput
      ): Promise<{ ok: boolean, error?: string }>
    {
    // check new User
    // create User & hash password
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        // make Error
        return {
          ok: false,
          error: 'There is a user with that email already'
        };
      }
      await this.users.save(
        this.users.create({
          email,
          password,
          role,
        }
      ));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: `Couldn't create account`
      };
    }
  }

  async login({
    email,
    password,
  }) :Promise<{ ok: boolean, error?: string, token?: string }> {
    try {
      const user = await this.users.findOne({ email });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Worng password',
        };
      }

      return {
        ok: true,
        token: '',
      }
    } catch (error) {
      return {
        ok: false,
        error,
      }
    }
  }
}