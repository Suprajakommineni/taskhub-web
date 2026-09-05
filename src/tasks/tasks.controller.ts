import {
  Controller,
  Req,
  UseGuards,
  Body,
  Post,
  Query,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import type { Request } from 'express';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignMembersDto } from './dto/assign-members.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.tasksService.create(
      dto.title,
      dto.description,
      dto.projectId,
      user.userId,
      dto.status,
      dto.assignees || [],
      dto.priority,
    );
  }

  @Get()
  findAllForProject(
    @Query('projectId') projectId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.tasksService.findAllForProject(Number(projectId), user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.tasksService.update(Number(id), user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    return this.tasksService.remove(Number(id), user.userId);
  }

  @Post(':id/assignees')
  assignMembers(
    @Param('id') id: string,
    @Body() dto: AssignMembersDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.tasksService.assignMembers(
      Number(id),
      user.userId,
      dto.assignees,
    );
  }

  @Delete(':id/assignees/:teamMemberId')
  unassignMember(
    @Param('id') id: string,
    @Param('teamMemberId') teamMemberId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    return this.tasksService.unassignMember(
      Number(id),
      Number(teamMemberId),
      user.userId,
    );
  }
}
