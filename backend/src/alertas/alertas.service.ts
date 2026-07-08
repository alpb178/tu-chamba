import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AlertasService {
  constructor(private prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.alertaEmpleo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAlertaDto, userId: string) {
    const departamento = dto.departamento ?? null;
    const categoria = dto.categoria ?? null;

    // Evita alertas idénticas duplicadas (el @@unique no aplica con NULLs).
    const existe = await this.prisma.alertaEmpleo.findFirst({
      where: { userId, departamento, categoria },
    });
    if (existe) {
      throw new ConflictException('Ya tienes una alerta con estos criterios');
    }

    return this.prisma.alertaEmpleo.create({
      data: { userId, departamento, categoria },
    });
  }

  async remove(id: string, user: AuthUser) {
    const alerta = await this.prisma.alertaEmpleo.findUnique({ where: { id } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    if (alerta.userId !== user.id) {
      throw new ForbiddenException('No puedes eliminar esta alerta');
    }
    await this.prisma.alertaEmpleo.delete({ where: { id } });
    return { deleted: true };
  }
}
