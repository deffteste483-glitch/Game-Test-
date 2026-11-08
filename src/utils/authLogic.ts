export type AuthMode =
  | 'login'
  | 'register'
  | 'recover'
  | 'confirmed'
  | 'character_creator'
  | 'tavern_hall';

export type MusicalAffinity =
  | 'Rock Clássico & Progressivo'
  | 'Jazz, Blues & Soul'
  | 'MPB & Folk Acústico'
  | 'Metal Sinfônico & Épico'
  | 'Pop, Indie & Alternativo';

export interface TravelerAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  recoveryHint: string;
  affinity: MusicalAffinity;
  title: string;
  entryNumber: number;
  createdAt: string;
  isVisitor?: boolean;
}

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  field?: 'username' | 'email' | 'password' | 'general';
}

export interface AudioMixerState {
  masterMuted: boolean;
  masterVolume: number; // 0 to 100 (Volume Geral)
  music: number; // 0 to 100 (Música Instrumental)
  sfx: number; // 0 to 100 (Efeitos Sonoros: passos, canecas, páginas, objetos)
  ambience: number; // 0 to 100 (Ambiente: taverna, lareira, chuva)
  fireplace: number; // 0 to 100
  rain: number; // 0 to 100
  pages: number; // 0 to 100
}

export const DEFAULT_AUDIO_MIXER: AudioMixerState = {
  masterMuted: false,
  masterVolume: 85,
  music: 65,
  sfx: 80,
  ambience: 75,
  fireplace: 75,
  rain: 55,
  pages: 85,
};

export const INITIAL_TRAVELERS: TravelerAccount[] = [
  {
    id: 'bard-01',
    username: 'Aldous_Vane',
    email: 'aldous@tavernamusical.com',
    passwordHash: 'alaude16',
    recoveryHint: 'Instrumento de 6 ordens + século 16 (alaude16)',
    affinity: 'Rock Clássico & Progressivo',
    title: 'Cronista das Seis Cordas',
    entryNumber: 142,
    createdAt: 'Noite de Outono · Registro CXLII',
  },
  {
    id: 'bard-02',
    username: 'Helena_Lyra',
    email: 'helena@tavernamusical.com',
    passwordHash: 'noturno7',
    recoveryHint: 'Canção da noite + 7 notas (noturno7)',
    affinity: 'MPB & Folk Acústico',
    title: 'Guardiã dos Pergaminhos Melódicos',
    entryNumber: 143,
    createdAt: 'Noite de Chuva · Registro CXLIII',
  },
];

export function validateLoginInput(identifier: string, password: string): AuthValidationResult {
  const cleanId = identifier.trim();
  const cleanPass = password.trim();

  if (!cleanId) {
    return {
      valid: false,
      field: 'username',
      error: 'Por favor, inscreva seu nome de viajante ou correio nas linhas do pergaminho.',
    };
  }
  if (!cleanPass) {
    return {
      valid: false,
      field: 'password',
      error: 'A palavra-passe é necessária para validar o selo de entrada.',
    };
  }
  if (cleanPass.length < 4) {
    return {
      valid: false,
      field: 'password',
      error: 'A palavra-passe deve conter ao menos 4 caracteres.',
    };
  }

  return { valid: true };
}

export function authenticateTraveler(
  accounts: TravelerAccount[],
  identifier: string,
  password: string
): { success: boolean; account?: TravelerAccount; error?: string } {
  const validation = validateLoginInput(identifier, password);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const normalized = identifier.trim().toLowerCase();
  const found = accounts.find(
    (acc) =>
      acc.username.toLowerCase() === normalized ||
      acc.email.toLowerCase() === normalized
  );

  if (!found) {
    return {
      success: false,
      error:
        'Viajante não encontrado nos registros da taverna. Verifique a grafia ou crie um novo registro.',
    };
  }

  if (found.passwordHash !== password.trim()) {
    return {
      success: false,
      error: 'Palavra-passe incorreta para este viajante. Consulte a recuperação de selo se necessário.',
    };
  }

  return { success: true, account: found };
}

export function validateRegistrationInput(
  username: string,
  email: string,
  password: string
): AuthValidationResult {
  const cleanName = username.trim();
  const cleanEmail = email.trim();
  const cleanPass = password.trim();

  if (!cleanName || cleanName.length < 3) {
    return {
      valid: false,
      field: 'username',
      error: 'O nome de viajante deve possuir pelo menos 3 caracteres.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return {
      valid: false,
      field: 'email',
      error: 'Informe um endereço de correio válido (ex.: bardo@reino.com).',
    };
  }

  if (!cleanPass || cleanPass.length < 5) {
    return {
      valid: false,
      field: 'password',
      error: 'Escolha uma palavra-passe com pelo menos 5 caracteres.',
    };
  }

  return { valid: true };
}

export function registerNewTraveler(
  accounts: TravelerAccount[],
  username: string,
  email: string,
  password: string,
  affinity: MusicalAffinity
): { success: boolean; account?: TravelerAccount; updatedAccounts?: TravelerAccount[]; error?: string } {
  const validation = validateRegistrationInput(username, email, password);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const normalizedName = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const exists = accounts.some(
    (acc) =>
      acc.username.toLowerCase() === normalizedName ||
      acc.email.toLowerCase() === normalizedEmail
  );

  if (exists) {
    return {
      success: false,
      error: 'Já existe um viajante registrado com este nome ou correio no Livro de Visitantes.',
    };
  }

  const nextEntryNumber =
    accounts.reduce((max, a) => Math.max(max, a.entryNumber), 140) + 1;

  const titlesByAffinity: Record<MusicalAffinity, string> = {
    'Rock Clássico & Progressivo': 'Trovador das Cordas Elétricas',
    'Jazz, Blues & Soul': 'Mestre do Improviso Noturno',
    'MPB & Folk Acústico': 'Poeta das Canções de Lareira',
    'Metal Sinfônico & Épico': 'Arauto das Sinfonias de Aço',
    'Pop, Indie & Alternativo': 'Viajante dos Novos Acordes',
  };

  const newAccount: TravelerAccount = {
    id: `bard-${Date.now()}`,
    username: username.trim(),
    email: email.trim(),
    passwordHash: password.trim(),
    recoveryHint: `Selo pessoal iniciado por "${password.trim().slice(0, 2)}***"`,
    affinity,
    title: titlesByAffinity[affinity],
    entryNumber: nextEntryNumber,
    createdAt: `Registro Nº ${nextEntryNumber} · Inscrição Recente`,
  };

  return {
    success: true,
    account: newAccount,
    updatedAccounts: [...accounts, newAccount],
  };
}

export function recoverTravelerPassword(
  accounts: TravelerAccount[],
  identifier: string
): { success: boolean; message: string; hint?: string; recoveredUsername?: string } {
  const clean = identifier.trim().toLowerCase();
  if (!clean) {
    return {
      success: false,
      message: 'Informe seu nome de viajante ou endereço de correio para buscarmos nos arquivos.',
    };
  }

  const found = accounts.find(
    (acc) =>
      acc.username.toLowerCase() === clean || acc.email.toLowerCase() === clean
  );

  if (!found) {
    return {
      success: false,
      message: 'Nenhum registro encontrado sob essa alcunha ou correio nas páginas do livro.',
    };
  }

  return {
    success: true,
    recoveredUsername: found.username,
    hint: found.recoveryHint,
    message: `Registro localizado para ${found.username}! Um mensageiro enviou o lembrete do selo ao correio ${found.email}.`,
  };
}

export function createVisitorSession(existingCount: number): TravelerAccount {
  const entryNumber = 140 + existingCount + 1;
  return {
    id: 'visitor-session',
    username: 'Viajante_Noturno',
    email: 'visitante@tavernamusical.com',
    passwordHash: '',
    recoveryHint: '',
    affinity: 'MPB & Folk Acústico',
    title: 'Hóspede da Noite Chuvosa',
    entryNumber,
    createdAt: `Passe de Visitante · Registro #${entryNumber}`,
    isVisitor: true,
  };
}

export function clampVolume(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
