import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { NutricionistasModule } from './nutricionistas/nutricionistas.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { ProntuariosModule } from './prontuarios/prontuarios.module';
import { PlanosAlimentaresModule } from './planos-alimentares/planos-alimentares.module';
import { AssinaturasModule } from './assinaturas/assinaturas.module';
import { AlimentosModule } from './alimentos/alimentos.module';
import { RegistrosModule } from './registros/registros.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    NutricionistasModule,
    PacientesModule,
    ProntuariosModule,
    PlanosAlimentaresModule,
    AssinaturasModule,
    AlimentosModule,
    RegistrosModule,
  ],
})
export class AppModule {}
