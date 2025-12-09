import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { envs } from '../../config/envs';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto, RegisterDto } from './dtos';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const userExists = await this.usersRepository.exists(dto.email);

    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const userData: Prisma.UserCreateInput = {
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
    };

    const user = await this.usersRepository.create(userData);

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(
      dto.email.toLowerCase()
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: envs.jwtRefreshSecret,
      });

      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: envs.jwtExpiresIn }
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: envs.jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: envs.jwtRefreshSecret,
        expiresIn: envs.jwtRefreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
