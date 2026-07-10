import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.jobAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAlertDto, userId: string) {
    const department = dto.department ?? null;
    const category = dto.category ?? null;

    // Evita alertas idénticas duplicadas (el @@unique no aplica con NULLs).
    const exists = await this.prisma.jobAlert.findFirst({
      where: { userId, department, category },
    });
    if (exists) {
      throw new ConflictException('Ya tienes una alerta con estos criterios');
    }

    return this.prisma.jobAlert.create({
      data: { userId, department, category },
    });
  }

  async remove(id: string, user: AuthUser) {
    const alert = await this.prisma.jobAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');
    if (alert.userId !== user.id) {
      throw new ForbiddenException('No puedes eliminar esta alerta');
    }
    await this.prisma.jobAlert.delete({ where: { id } });
    return { deleted: true };
  }
}
