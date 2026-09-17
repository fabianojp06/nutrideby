import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension } from './field-encryption.extension';

// PrismaService aplica a extensão de cripto de campo (AES-256-GCM) sobre o
// client. O `return this.$extends(...)` no construtor faz a instância injetada
// SER o client estendido — assim TODO acesso a delegate passa pela cripto e
// nenhum serviço consegue, por engano, gravar dado de saúde em texto plano.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    // Substitui a instância pelo client estendido (compliance: sem bypass).
    return this.$extends(fieldEncryptionExtension) as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
