import type { AgencyStoreData } from '../memory/memoryStore.js';

export function designDirectionView(data: AgencyStoreData, projectId: string): Record<string, unknown> {
  const selected = data.design.selectedDirections.find(item => item.projectId === projectId);
  const directions = data.design.creativeDirections.filter(item => item.projectId === projectId);
  const direction = directions.find(item => item.id === selected?.selectedDirectionId) || directions[0];
  const tokens = data.design.tokens.find(item => item.projectId === projectId);
  const prototype = data.design.prototypes.find(item => item.projectId === projectId);
  const handoff = data.design.handoffs.find(item => item.projectId === projectId);
  const artifacts = data.artifacts.filter(item => item.projectId === projectId && ['prototype', 'design_handoff', 'brand_guidelines', 'brand_guidelines_pdf'].includes(item.type));
  return {
    selected,
    direction,
    directions,
    tokens,
    prototype,
    handoffStatus: handoff ? 'handoff ready' : 'not handed off',
    artifacts,
    screenshots: prototype?.screenshots || {}
  };
}
