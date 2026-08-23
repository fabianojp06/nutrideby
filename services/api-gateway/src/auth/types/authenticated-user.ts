import { Role } from '../../common/decorators/roles.decorator';

export interface AuthenticatedUser {
  sub: string; // id do nutricionista ou paciente
  email: string;
  role: Role;
  // presente apenas quando role === 'PACIENTE'
  statusConsentimento?: 'PENDENTE' | 'ACEITO' | 'REVOGADO';
}
