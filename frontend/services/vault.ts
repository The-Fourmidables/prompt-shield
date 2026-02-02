
import { DetectedEntity } from '../types';

/**
 * Ephemeral Vault
 * Stateless by design: mappings only exist during the request cycle.
 * This class simulates a memory-safe, non-persisted store.
 */
export class EphemeralVault {
  private static instance: EphemeralVault;
  private mappings: Map<string, string> = new Map();
  private isActive: boolean = false;

  private constructor() {}

  public static getInstance(): EphemeralVault {
    if (!EphemeralVault.instance) {
      EphemeralVault.instance = new EphemeralVault();
    }
    return EphemeralVault.instance;
  }

  public initialize(entities: DetectedEntity[]) {
    this.clear();
    entities.forEach(entity => {
      this.mappings.set(entity.placeholder, entity.value);
    });
    this.isActive = true;
    console.log(`[VAULT] Initialized with ${entities.length} sensitive mappings.`);
  }

  public rehydrate(text: string): string {
    if (!this.isActive) return text;
    
    let rehydrated = text;
    this.mappings.forEach((value, placeholder) => {
      // Use split/join to replace all occurrences efficiently
      rehydrated = rehydrated.split(placeholder).join(value);
    });
    return rehydrated;
  }

  public clear() {
    this.mappings.clear();
    this.isActive = false;
    console.log(`[VAULT] Mappings destroyed. Memory cleared.`);
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      mappingCount: this.mappings.size
    };
  }
}

export const vault = EphemeralVault.getInstance();
