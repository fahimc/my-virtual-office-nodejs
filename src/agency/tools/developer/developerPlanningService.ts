import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { Project } from '../../schemas/project.schema.js';
import type { DesignHandoff } from '../../schemas/designHandoff.schema.js';
import type { ImplementationPlan, UiSystemInspection, WebsiteTemplate } from '../../schemas/implementationPlan.schema.js';
import type { TaskBoardService } from '../taskboard/taskBoardService.js';
import type { DeveloperTaskType } from '../taskboard/taskBoardTypes.js';

export class DeveloperPlanningService {
  constructor(
    private readonly store: MemoryStore,
    private readonly taskBoard: TaskBoardService,
    private readonly workspaceRoot: string
  ) {}

  async inspectUiSystem(): Promise<UiSystemInspection> {
    const packageJson = await this.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>('package.json');
    const dependencies = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
    const has = (name: string) => Boolean(dependencies[name]);
    const paths = await this.pathPresence([
      'src/design-system',
      'src/components',
      'src/components/ui',
      'src/components/sections',
      'src/templates',
      'components.json',
      'tailwind.config.ts',
      'tailwind.config.js',
      '.storybook',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock'
    ]);
    const componentLibraries = [
      has('@radix-ui/react-dialog') || has('@radix-ui/react-slot') ? 'Radix UI' : '',
      has('@mui/material') ? 'MUI' : '',
      has('@chakra-ui/react') ? 'Chakra UI' : '',
      has('@mantine/core') ? 'Mantine' : '',
      has('daisyui') ? 'DaisyUI' : '',
      has('flowbite') || has('flowbite-react') ? 'Flowbite' : '',
      paths['components.json'] ? 'shadcn/ui config' : ''
    ].filter(Boolean);
    const styling = has('tailwindcss') || paths['tailwind.config.ts'] || paths['tailwind.config.js']
      ? 'Tailwind CSS'
      : paths['src/design-system']
        ? 'internal design system'
        : 'plain CSS';
    const reusableComponents = [
      paths['src/components/ui'] ? 'src/components/ui' : '',
      paths['src/components/sections'] ? 'src/components/sections' : '',
      paths['src/templates'] ? 'src/templates' : '',
      paths['src/design-system'] ? 'src/design-system' : '',
      'public/agency.css virtual office panels',
      'public/styles.css canvas office UI'
    ].filter(Boolean);
    return {
      designSystemDetected: paths['src/design-system'] ? 'internal agency design system' : 'none detected',
      componentLibraryDetected: componentLibraries.length ? componentLibraries : ['none detected'],
      stylingSystemDetected: styling,
      reusableComponentsFound: reusableComponents,
      internalTemplatesFound: paths['src/templates'] ? ['src/templates'] : [],
      reusableSectionsFound: paths['src/components/sections'] ? ['src/components/sections'] : [],
      previousApprovedDesignsFound: [],
      storybookAvailable: paths['.storybook'] || has('@storybook/react') || has('storybook'),
      packageManagersDetected: [
        paths['package-lock.json'] ? 'npm' : '',
        paths['pnpm-lock.yaml'] ? 'pnpm' : '',
        paths['yarn.lock'] ? 'yarn' : ''
      ].filter(Boolean),
      inspectionNotes: [
        'The current app is an Express/static HTML/CSS office UI with Tailwind CSS and DaisyUI available for generated client previews.',
        'Generated client sites should use DaisyUI primitives, the internal design-system tokens, and reusable section/template definitions before custom CSS.',
        'Designer Agent handoff and design tokens remain the source of truth for website implementation.'
      ]
    };
  }

  async createImplementationPlan(project: Project, handoff?: DesignHandoff, workflowRunId?: string): Promise<ImplementationPlan> {
    const inspection = await this.inspectUiSystem();
    const latest = await this.store.read();
    const customer = latest.customers.find(item => item.id === project.customerId);
    const templateSelected = this.selectTemplate(customer?.businessType || project.structuredBrief?.businessSummary || project.title);
    const tokenNames = handoff?.designTokens
      ? [
        ...Object.keys(handoff.designTokens.colours || {}),
        ...Object.keys(handoff.designTokens.typography || {}),
        ...Object.keys(handoff.designTokens.spacing || {})
      ]
      : project.structuredBrief?.stylePreferences || [];
    const noClientComponentSystem = inspection.designSystemDetected === 'none detected' && inspection.componentLibraryDetected.includes('none detected');
    const plan: ImplementationPlan = {
      id: createId('implementation-plan'),
      projectId: project.id,
      workflowRunId,
      createdByAgentId: 'builder',
      buildStrategy: noClientComponentSystem ? 'approved_template' : 'existing_components',
      designSystemDetected: inspection.designSystemDetected,
      componentLibraryDetected: inspection.componentLibraryDetected,
      stylingSystemDetected: inspection.stylingSystemDetected,
      templateSelected,
      templateReason: this.templateReason(templateSelected, customer?.businessType || '', project.structuredBrief?.businessSummary || ''),
      reusableComponentsFound: inspection.reusableComponentsFound,
      componentsToCreate: ['Button', 'Card', 'Input', 'Textarea', 'Badge', 'Container', 'Section'],
      componentsToModify: inspection.reusableComponentsFound.filter(item => item.startsWith('src/')),
      sectionsToCreate: this.sectionsFromHandoff(handoff),
      designTokensToApply: tokenNames.length ? tokenNames : ['palette', 'typography', 'spacing', 'radius', 'responsive breakpoints'],
      storybookAvailable: inspection.storybookAvailable,
      accessibilityStrategy: 'Use semantic landmarks, keyboard-friendly controls, visible focus states, readable type scale, and contrast checks from design tokens.',
      responsiveStrategy: 'Build mobile-first reusable sections, then validate tablet and desktop screenshots before preview approval.',
      filesToModify: [
        'src/design-system/* when the generated client project supports TypeScript modules',
        'src/components/ui/* reusable primitives',
        'src/components/sections/* reusable page sections',
        'src/templates/* selected template adapter',
        'client website page entry files'
      ],
      filesToAvoid: ['server.js unless routing is required', 'data/agency-store.json', 'node_modules', 'dist', 'production deployment files without approval'],
      risks: [
        'This virtual office repo is still an Express/static renderer, so DaisyUI components are applied as HTML classes rather than React components.',
        'A raw template must be adapted with approved design tokens, copy, and conversion goals.',
        'Do not introduce a second UI library unless explicitly approved.'
      ],
      validationCommands: ['npm run check'],
      codexTaskRules: [
        'State the Codex task mode before implementation.',
        'Inspect existing components and sections before creating new ones.',
        'Do not create duplicate components when a suitable one exists.',
        'Use DaisyUI as the selected component library and do not mix UI libraries without approval.',
        'Apply Designer Agent design tokens and handoff decisions.',
        'Prefer reusable primitives and sections over a single large page file.'
      ],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    await this.savePlan(plan);
    await this.createDeveloperTasks(plan, inspection);
    return plan;
  }

  async latest(projectId?: string): Promise<ImplementationPlan | undefined> {
    const data = await this.store.read();
    return data.implementationPlans.filter(item => !projectId || item.projectId === projectId).at(-1);
  }

  private async savePlan(plan: ImplementationPlan) {
    await this.store.update(data => {
      data.implementationPlans = data.implementationPlans.filter(item => item.projectId !== plan.projectId);
      data.implementationPlans.push(plan);
      const artifactPath = 'project/developer/implementation-plan.json';
      const existing = data.artifacts
        .filter(item => item.projectId === plan.projectId && item.type === 'implementation_plan' && item.path === artifactPath)
        .at(-1);
      data.artifacts = data.artifacts.filter(item => !(item.projectId === plan.projectId && item.type === 'implementation_plan' && item.path === artifactPath));
      data.artifacts.push({
        id: existing?.id || createId('artifact'),
        projectId: plan.projectId,
        type: 'implementation_plan',
        title: 'Developer implementation plan',
        path: artifactPath,
        metadata: plan as unknown as Record<string, unknown>,
        createdByAgentId: 'builder',
        createdAt: existing?.createdAt || nowIso()
      });
    });
  }

  private async createDeveloperTasks(plan: ImplementationPlan, inspection: UiSystemInspection) {
    const existing = await this.taskBoard.listTasks(plan.projectId);
    if (existing.some(task => task.type === 'design_system_inspection')) return;
    const tasks: Array<{ type: DeveloperTaskType; title: string; agent: string; output?: Record<string, unknown> }> = [
      { type: 'design_system_inspection', title: 'Inspect design system', agent: 'builder', output: { designSystemDetected: inspection.designSystemDetected } },
      { type: 'component_library_inspection', title: 'Inspect component library', agent: 'builder', output: { componentLibraryDetected: inspection.componentLibraryDetected } },
      { type: 'template_selection', title: `Select ${plan.templateSelected}`, agent: 'planner', output: { templateSelected: plan.templateSelected, templateReason: plan.templateReason } },
      { type: 'design_token_mapping', title: 'Map design tokens to implementation', agent: 'builder', output: { designTokensToApply: plan.designTokensToApply } },
      { type: 'component_creation', title: 'Create missing reusable UI primitives', agent: 'builder' },
      { type: 'component_adaptation', title: 'Adapt reusable components to design tokens', agent: 'builder' },
      { type: 'section_template_creation', title: 'Create reusable website sections', agent: 'builder' },
      { type: 'template_customisation', title: 'Customize selected template', agent: 'builder' },
      { type: 'storybook_update', title: 'Update Storybook if available', agent: 'builder', output: { storybookAvailable: plan.storybookAvailable } },
      { type: 'accessibility_component_pass', title: 'Run component accessibility pass', agent: 'qa' },
      { type: 'responsive_component_pass', title: 'Run responsive component pass', agent: 'qa' }
    ];
    for (const task of tasks) {
      const created = await this.taskBoard.createTask({
        projectId: plan.projectId,
        title: task.title,
        description: `${task.title} for the Developer Agent implementation plan.`,
        type: task.type,
        priority: task.type === 'template_selection' || task.type === 'design_token_mapping' ? 'high' : 'normal',
        assignedAgentId: task.agent,
        createdByAgentId: 'builder',
        input: { implementationPlanId: plan.id },
        approvalRequired: false
      });
      if (task.output) await this.taskBoard.updateTask(created.id, { status: 'completed', output: task.output });
    }
  }

  private selectTemplate(text: string): WebsiteTemplate {
    const value = text.toLowerCase();
    if (/(plumber|electrician|builder|cleaner|salon|restaurant|clinic|dentist|roofer|local|repair|trades?)/.test(value)) return 'localBusinessTemplate';
    if (/(software|saas|subscription|platform|b2b|app|product)/.test(value)) return 'saasTemplate';
    if (/(shop|store|ecommerce|e-commerce|catalogue|catalog|product range)/.test(value)) return 'ecommerceTemplate';
    if (/(creator|photographer|designer|artist|portfolio|consultant|coach)/.test(value)) return 'portfolioTemplate';
    if (/(campaign|lead generation|single offer|landing)/.test(value)) return 'landingPageTemplate';
    if (/(agency|marketing|consultancy|professional service|service)/.test(value)) return 'agencyTemplate';
    return 'agencyTemplate';
  }

  private templateReason(template: WebsiteTemplate, businessType: string, summary: string): string {
    const context = [businessType, summary].filter(Boolean).join(' ');
    return `${template} selected from the customer business context: ${context.slice(0, 180) || 'professional service website'}. The template must be adapted with the approved handoff, copy, tokens, and conversion goals.`;
  }

  private sectionsFromHandoff(handoff?: DesignHandoff): string[] {
    const sections = handoff?.componentSpec.sections?.map(section => section.name) || [];
    return sections.length ? sections : ['HeaderSection', 'HeroSection', 'ServicesSection', 'TestimonialsSection', 'CtaSection', 'ContactSection', 'FooterSection'];
  }

  private async readJson<T>(relativePath: string): Promise<T | undefined> {
    try {
      return JSON.parse(await fs.readFile(path.join(this.workspaceRoot, relativePath), 'utf8')) as T;
    } catch {
      return undefined;
    }
  }

  private async pathPresence(paths: string[]) {
    const result: Record<string, boolean> = {};
    for (const item of paths) {
      try {
        await fs.access(path.join(this.workspaceRoot, item));
        result[item] = true;
      } catch {
        result[item] = false;
      }
    }
    return result;
  }
}
