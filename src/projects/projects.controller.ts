import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateTeamSpecDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.projectsService.create(dto.title, user.userId, dto.teams);
  }

  @Post(':id/teams')
  addTeam(
    @Param('id') id: string,
    @Body() dto: CreateTeamSpecDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.projectsService.addTeamToProject(
      Number(id),
      user.userId,
      dto.teamName,
      dto.members,
    );
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.projectsService.getMembers(Number(id), user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.projectsService.findOne(Number(id), user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.projectsService.update(Number(id), dto.title, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.projectsService.remove(Number(id), user.userId);
  }
}
