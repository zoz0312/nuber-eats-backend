import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { User } from "./entities/user.entity";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";

export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput>
    {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return {
          ok: false,
          error: 'There is a user with that email already'
        };
      }

      const user = await this.users.save(
        this.users.create({
          email,
          password,
          role,
        })
      );

      await this.verifications.save(
        this.verifications.create({ user })
      );

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
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
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

      const token = this.jwtService.sign({ id: user.id });
      return {
        ok: true,
        token,
      }
    } catch (error) {
      return {
        ok: false,
        error,
      }
    }
  }

  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<User> {
    const user = await this.users.findOne(userId);
    if (email) {
      user.email = email;
      user.verified = false;
      await this.verifications.save(
        this.verifications.create({ user })
      );
    }
    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        }
      }
      return {
        ok: false,
        error: `Verification not found.`,
      }
    } catch (error) {
      return {
        ok: false,
        error,
      }
    }
  }
}