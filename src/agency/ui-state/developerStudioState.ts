import type { AgencyStoreData } from '../memory/memoryStore.js';

export function buildDeveloperStudioState(data: AgencyStoreData, projectId?: string) {
  const plans = data.implementationPlans.filter(plan => !projectId || plan.projectId === projectId);
  const plan = plans.at(-1);
  const developerTasks = data.companyTasks.filter(task =>
    (!projectId || task.projectId === projectId) &&
    [
      'design_system_inspection',
      'component_library_inspection',
      'template_selection',
      'design_token_mapping',
      'component_creation',
      'component_adaptation',
      'section_template_creation',
      'template_customisation',
      'storybook_update',
      'accessibility_component_pass',
      'responsive_component_pass'
    ].includes(task.type)
  );
  return {
    phase: plan ? 'implementation_planned' : 'not_started',
    plan,
    taskCount: developerTasks.length,
    completedTaskCount: developerTasks.filter(task => task.status === 'done' || task.status === 'completed').length,
    activeTasks: developerTasks.filter(task => task.status !== 'done' && task.status !== 'completed').slice(0, 5)
  };
}
