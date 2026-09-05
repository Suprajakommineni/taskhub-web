import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { imageUploadOptions } from '../common/upload.config';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.usersService.me(user.userId);
  }

  @Patch('me/password')
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.usersService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  uploadPhoto(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No photo file provided');
    const user = req.user as { userId: number };
    return this.usersService.updatePhoto(user.userId, `/uploads/${file.filename}`);
  }
}
