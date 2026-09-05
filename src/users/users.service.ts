import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async me(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'profilePhoto'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePassword(
    userId: number,
    currentPassword: string | undefined,
    newPassword: string,
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // Google-only accounts have no passwordHash yet — this call sets one
    // for the first time rather than requiring a password that never existed.
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { success: true };
  }

  async updatePhoto(userId: number, photoUrl: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    user.profilePhoto = photoUrl;
    await user.save();
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePhoto: user.profilePhoto,
    };
  }
}
