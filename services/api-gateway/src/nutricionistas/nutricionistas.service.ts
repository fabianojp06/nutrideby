import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNutricionistaDto } from './dto/update-nutricionista.dto';
import { NutricionistaMeDto } from './dto/nutricionista-me.dto';

@Injectable()
export class NutricionistasService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(id: string): Promise<NutricionistaMeDto> {
    const nutricionista = await this.prisma.nutricionista.findUnique({
      where: { id },
      select: this.selectPublico(),
    });
    if (!nutricionista) throw new NotFoundException('Nutricionista não encontrado.');
    return nutricionista;
  }

  async updateMe(id: string, dto: UpdateNutricionistaDto): Promise<NutricionistaMeDto> {
    return this.prisma.nutricionista.update({
      where: { id },
      data: dto,
      select: this.selectPublico(),
    });
  }

  private selectPublico() {
    return {
      id: true,
      nome: true,
      email: true,
      crn: true,
      telefone: true,
      cpfCnpj: true,
      ativo: true,
      criadoEm: true,
    } as const;
  }
}
