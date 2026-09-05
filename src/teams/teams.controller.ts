import {
  Controller,
  Body,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddTeamMemberdto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-teamber.dto';
import { imageUploadOptions } from '../common/upload.config';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  create(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.teamsService.create(dto.name, user.userId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.teamsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.teamsService.findOne(Number(id), user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateTeamDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.teamsService.update(Number(id), dto.name, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.teamsService.remove(Number(id), user.userId);
  }

  @Post(':id/members')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  addMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberdto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.teamsService.addMember(
      Number(id),
      user.userId,
      dto,
      file ? `/uploads/${file.filename}` : undefined,
    );
  }

  @Patch(':teamId/members/:memberId')
  updateMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.teamsService.updateMember(
      Number(teamId),
      Number(memberId),
      user.userId,
      dto,
    );
  }

  @Delete(':teamId/members/:memberId')
  removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.teamsService.removeMember(
      Number(teamId),
      Number(memberId),
      user.userId,
    );
  }
}
