// ============================================================================
// Enterprise Event Bus — Domain Event Types Specification
// Enforces event-driven decoupling across all 5 bounded contexts.
// ============================================================================

export type DomainEventName =
  | 'LeadCreated'
  | 'LeadQualified'
  | 'TrialBooked'
  | 'TrialCompleted'
  | 'MemberJoined'
  | 'SubscriptionCreated'
  | 'PaymentFailed'
  | 'RenewalDue'
  | 'AutomationTriggered'
  | 'WorkflowCompleted';

export interface BaseDomainEvent {
  id: string;
  eventName: DomainEventName;
  gymId: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LeadCreatedEvent extends BaseDomainEvent {
  eventName: 'LeadCreated';
  payload: {
    leadId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    goal?: string | null;
    source: string;
  };
}

export interface LeadQualifiedEvent extends BaseDomainEvent {
  eventName: 'LeadQualified';
  payload: {
    leadId: string;
    leadScore: number;
    tier: 'Hot' | 'Warm' | 'Cold';
  };
}

export interface TrialBookedEvent extends BaseDomainEvent {
  eventName: 'TrialBooked';
  payload: {
    trialId: string;
    leadId: string;
    scheduledTime: string;
    trainerId?: string;
  };
}

export interface TrialCompletedEvent extends BaseDomainEvent {
  eventName: 'TrialCompleted';
  payload: {
    trialId: string;
    leadId: string;
    rating?: number;
    interestLevel?: string;
  };
}

export interface MemberJoinedEvent extends BaseDomainEvent {
  eventName: 'MemberJoined';
  payload: {
    conversionId: string;
    leadId: string;
    planSold: string;
    revenueAmount: number;
  };
}

export interface SubscriptionCreatedEvent extends BaseDomainEvent {
  eventName: 'SubscriptionCreated';
  payload: {
    subscriptionId: string;
    plan: string;
    razorpaySubscriptionId?: string;
  };
}

export interface PaymentFailedEvent extends BaseDomainEvent {
  eventName: 'PaymentFailed';
  payload: {
    paymentId?: string;
    amount: number;
    reason?: string;
  };
}

export interface RenewalDueEvent extends BaseDomainEvent {
  eventName: 'RenewalDue';
  payload: {
    memberId: string;
    expiryDate: string;
  };
}

export interface AutomationTriggeredEvent extends BaseDomainEvent {
  eventName: 'AutomationTriggered';
  payload: {
    jobId: string;
    jobType: string;
    targetId?: string;
  };
}

export interface WorkflowCompletedEvent extends BaseDomainEvent {
  eventName: 'WorkflowCompleted';
  payload: {
    executionId: string;
    workflowVersionId: string;
    leadId?: string;
    status: 'completed' | 'failed';
  };
}

export type DomainEvent =
  | LeadCreatedEvent
  | LeadQualifiedEvent
  | TrialBookedEvent
  | TrialCompletedEvent
  | MemberJoinedEvent
  | SubscriptionCreatedEvent
  | PaymentFailedEvent
  | RenewalDueEvent
  | AutomationTriggeredEvent
  | WorkflowCompletedEvent;

export type EventCallback<T extends DomainEvent> = (event: T) => Promise<void> | void;
