import { createAgencySystem, type AgencySystem, type CreateAgencySystemOptions } from '../createAgencySystem.js';

let sharedSystem: AgencySystem | undefined;

export function getAgencySystem(options: CreateAgencySystemOptions): AgencySystem {
  sharedSystem = sharedSystem ?? createAgencySystem(options);
  return sharedSystem;
}
