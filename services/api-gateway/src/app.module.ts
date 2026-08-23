import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NutricionistasModule } from './nutricionistas/nutricionistas.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { ProntuariosModule } from './prontuarios/prontuarios.module';
import { PlanosAlimentaresModule } from './planos-alimentares/planos-alimentares.module';
import { AssinaturasModule } from './assinaturas/assinaturas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    NutricionistasModule,
    PacientesModule,
    ProntuariosModule,
    PlanosAlimentaresModule,
    AssinaturasModule,
  ],
})
export class AppModule {}
