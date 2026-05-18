export type LaunchStrategyType =
  | 'chd_mount'
  | 'chd_extract'
  | 'zip_extract'
  | 'iso_mount'
  | 'cdi_mount'
  | 'direct';

export type RomFileType = 'chd' | 'zip' | 'iso' | 'cdi' | 'bin' | 'cue' | 'gdi' | 'exe' | 'elf' | 'nrg' | 'mds' | 'mdf' | 'img' | 'iso_frag';

export interface LaunchContext {
  gameId: number;
  gameTitle: string;
  systemName: string;
  romPath: string;
  emulatorId: string;
  workingDirectory?: string;
  commandLineArgs?: string[];
  environmentVars?: Record<string, string>;
  mediaType?: RomFileType;
  metadata?: Record<string, unknown>;
}

export interface LaunchResult {
  success: boolean;
  processId?: number;
  exitCode?: number;
  error?: string;
  strategyUsed: LaunchStrategyType;
  mountInfo?: MountInfo;
}

export interface MountInfo {
  type: 'chd' | 'iso' | 'zip';
  sourcePath: string;
  mountPoint?: string;
  extractedTo?: string;
}

export interface StrategyConfig {
  type: LaunchStrategyType;
  priority: number;
  enabled: boolean;
  requiresExternalTools?: boolean;
  toolPaths?: {
    fusezip?: string;
    chdman?: string;
    daemonTools?: string;
    virtualCloneDrive?: string;
  };
}

export interface StrategyResult {
  canHandle: boolean;
  confidence: number;
  reason?: string;
}

export const STRATEGY_PRIORITIES: Record<LaunchStrategyType, number> = {
  chd_mount: 10,
  chd_extract: 20,
  iso_mount: 15,
  cdi_mount: 25,
  zip_extract: 30,
  direct: 1000,
};

export const ROM_EXTENSIONS: Record<RomFileType, string[]> = {
  chd: ['.chd'],
  zip: ['.zip', '.7z'],
  iso: ['.iso'],
  cdi: ['.cdi'],
  bin: ['.bin'],
  cue: ['.cue'],
  gdi: ['.gdi'],
  exe: ['.exe'],
  elf: ['.elf'],
  nrg: ['.nrg'],
  mds: ['.mds'],
  mdf: ['.mdf'],
  img: ['.img'],
  iso_frag: ['.000', '.001', '.iso.0', '.iso.1'],
};

export function detectRomType(filename: string): RomFileType | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

  for (const [type, extensions] of Object.entries(ROM_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type as RomFileType;
    }
  }

  return null;
}

export function detectMultipleDisks(romPath: string): string[] {
  const baseName = romPath.replace(/\.\d+$/, '').replace(/\.\w+$/, '');
  const dir = romPath.slice(0, romPath.lastIndexOf('\\') + 1) || romPath.slice(0, romPath.lastIndexOf('/') + 1);

  const allFiles: string[] = [];
  try {
    const files = [] as string[];
    const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\d+$`, 'i');
    for (const file of files) {
      if (pattern.test(file)) {
        allFiles.push(dir + file);
      }
    }
  } catch {
    return [romPath];
  }

  return allFiles.length > 0 ? allFiles : [romPath];
}

export const DEFAULT_STRATEGY_CONFIG: Partial<Record<LaunchStrategyType, StrategyConfig>> = {
  chd_mount: {
    type: 'chd_mount',
    priority: 10,
    enabled: true,
    requiresExternalTools: true,
    toolPaths: {
      chdman: 'C:\\Program Files\\MAME\\chdman.exe',
    },
  },
  chd_extract: {
    type: 'chd_extract',
    priority: 20,
    enabled: true,
    requiresExternalTools: true,
    toolPaths: {
      chdman: 'C:\\Program Files\\MAME\\chdman.exe',
    },
  },
  zip_extract: {
    type: 'zip_extract',
    priority: 30,
    enabled: true,
    requiresExternalTools: true,
  },
  iso_mount: {
    type: 'iso_mount',
    priority: 15,
    enabled: true,
    requiresExternalTools: true,
    toolPaths: {
      daemonTools: 'C:\\Program Files\\DAEMON Tools\\daemon.exe',
      virtualCloneDrive: 'C:\\Program Files\\Elaborate Bytes\\VirtualCloneDrive\\vcdmount.exe',
    },
  },
  cdi_mount: {
    type: 'cdi_mount',
    priority: 25,
    enabled: true,
    requiresExternalTools: true,
  },
  direct: {
    type: 'direct',
    priority: 1000,
    enabled: true,
  },
};