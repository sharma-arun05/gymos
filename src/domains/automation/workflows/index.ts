// ============================================================================
// Workflow Versioning Engine (Bounded Context: automation/workflows)
// Repository -> Service -> UseCase for non-destructive workflow editing.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { eventBus } from '../../../events/EventBus';
import { MeteringService } from '../../platform/metering';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'wait' | 'send_whatsapp' | 'send_email' | 'condition' | 'branch' | 'delay' | 'assign' | 'tag' | 'notify' | 'score' | 'end';
  label: string;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  conditionLabel?: string;
}

export interface WorkflowDefinition {
  id: string;
  gym_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version_number: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  is_published: boolean;
  created_at: string;
}

/**
 * WorkflowRepository: Encapsulates database access for workflow versioning
 */
export class WorkflowRepository {
  static async getDefinitions(gymId: string): Promise<WorkflowDefinition[]> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch workflow definitions: ${error.message}`);
    return data || [];
  }

  static async getActivePublishedVersion(gymId: string, triggerType: string): Promise<{ def: WorkflowDefinition; ver: WorkflowVersion } | null> {
    const { data: defs, error: defError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('gym_id', gymId)
      .eq('trigger_type', triggerType)
      .eq('is_active', true)
      .limit(1);

    if (defError || !defs || defs.length === 0) return null;
    const def = defs[0];

    const { data: vers, error: verError } = await supabase
      .from('workflow_versions')
      .select('*')
      .eq('workflow_id', def.id)
      .eq('is_published', true)
      .order('version_number', { ascending: false })
      .limit(1);

    if (verError || !vers || vers.length === 0) return null;
    return { def, ver: vers[0] as unknown as WorkflowVersion };
  }

  static async createDefinition(gymId: string, name: string, triggerType: string, description?: string): Promise<WorkflowDefinition> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({ gym_id: gymId, name, trigger_type: triggerType, description, is_active: true })
      .select()
      .single();

    if (error) throw new Error(`Failed to create workflow definition: ${error.message}`);
    return data;
  }

  static async createVersion(workflowId: string, versionNumber: number, nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<WorkflowVersion> {
    const { data, error } = await supabase
      .from('workflow_versions')
      .insert({
        workflow_id: workflowId,
        version_number: versionNumber,
        nodes: nodes as any,
        edges: edges as any,
        is_published: false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create workflow version: ${error.message}`);
    return data as unknown as WorkflowVersion;
  }

  static async publishVersion(workflowId: string, versionId: string): Promise<void> {
    // Unpublish all existing versions for this workflow
    await supabase
      .from('workflow_versions')
      .update({ is_published: false })
      .eq('workflow_id', workflowId);

    // Publish target version
    const { error } = await supabase
      .from('workflow_versions')
      .update({ is_published: true })
      .eq('id', versionId);

    if (error) throw new Error(`Failed to publish workflow version: ${error.message}`);
  }
}

/**
 * TriggerWorkflowUseCase: Executes when an event occurs (e.g. LeadCreated)
 */
export class TriggerWorkflowUseCase {
  static async execute(gymId: string, triggerType: string, leadId?: string, contextData: Record<string, any> = {}): Promise<void> {
    // 1. Verify automation quota
    await MeteringService.recordUsage(gymId, 'automations', 1);

    // 2. Resolve published version
    const activeWorkflow = await WorkflowRepository.getActivePublishedVersion(gymId, triggerType);
    if (!activeWorkflow) {
      console.info(`[TriggerWorkflowUseCase] No active published workflow found for trigger [${triggerType}] in gym [${gymId}].`);
      return;
    }

    const { def, ver } = activeWorkflow;

    // 3. Create execution trace record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        gym_id: gymId,
        workflow_version_id: ver.id,
        lead_id: leadId || null,
        status: 'running',
        current_node_id: ver.nodes.length > 0 ? ver.nodes[0].id : null,
        context_data: { ...contextData, workflowName: def.name, version: ver.version_number },
      })
      .select()
      .single();

    if (execError || !execution) {
      throw new Error(`Failed to initiate workflow execution trace: ${execError?.message}`);
    }

    // 4. Emit event bus notification
    await eventBus.emit({
      id: crypto.randomUUID(),
      eventName: 'AutomationTriggered',
      gymId,
      timestamp: new Date().toISOString(),
      payload: {
        jobId: execution.id,
        jobType: `workflow_${triggerType}`,
        targetId: leadId,
      },
    });
  }
}
