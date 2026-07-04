// ============================================================================
// Explicit Domain State Machines
// Prevents illegal status transitions in CRM leads, trials, and subscriptions.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. LEAD STATE MACHINE
// ----------------------------------------------------------------------------
export type LeadState =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Interested'
  | 'Trial Booked'
  | 'Trial Completed'
  | 'Negotiation'
  | 'Joined'
  | 'Lost'
  | 'Trial Scheduled' // Legacy compatibility
  | 'Trial Attended'; // Legacy compatibility

export class LeadStateMachine {
  private static readonly transitions: Record<LeadState, LeadState[]> = {
    'New': ['Contacted', 'Qualified', 'Interested', 'Trial Booked', 'Trial Scheduled', 'Lost'],
    'Contacted': ['Qualified', 'Interested', 'Trial Booked', 'Trial Scheduled', 'Lost'],
    'Qualified': ['Interested', 'Trial Booked', 'Trial Scheduled', 'Lost'],
    'Interested': ['Trial Booked', 'Trial Scheduled', 'Negotiation', 'Joined', 'Lost'],
    'Trial Booked': ['Trial Completed', 'Trial Attended', 'Negotiation', 'Joined', 'Lost'],
    'Trial Scheduled': ['Trial Completed', 'Trial Attended', 'Negotiation', 'Joined', 'Lost'],
    'Trial Completed': ['Negotiation', 'Joined', 'Lost'],
    'Trial Attended': ['Negotiation', 'Joined', 'Lost'],
    'Negotiation': ['Joined', 'Lost'],
    'Joined': [], // Terminal success state
    'Lost': ['New', 'Contacted'], // Can be resurrected via win-back
  };

  static canTransition(from: LeadState, to: LeadState): boolean {
    if (from === to) return true;
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static transition(from: LeadState, to: LeadState): LeadState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Illegal Lead State Transition: Cannot transition from [${from}] to [${to}].`);
    }
    return to;
  }
}

// ----------------------------------------------------------------------------
// 2. TRIAL STATE MACHINE
// ----------------------------------------------------------------------------
export type TrialState = 'SCHEDULED' | 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CONVERTED' | 'CANCELLED';

export class TrialStateMachine {
  private static readonly transitions: Record<TrialState, TrialState[]> = {
    'SCHEDULED': ['CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED'],
    'CONFIRMED': ['ATTENDED', 'NO_SHOW', 'CANCELLED'],
    'ATTENDED': ['CONVERTED', 'NO_SHOW'],
    'NO_SHOW': ['SCHEDULED', 'CANCELLED'],
    'CONVERTED': [], // Terminal success state
    'CANCELLED': ['SCHEDULED'],
  };

  static canTransition(from: TrialState, to: TrialState): boolean {
    if (from === to) return true;
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static transition(from: TrialState, to: TrialState): TrialState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Illegal Trial State Transition: Cannot transition from [${from}] to [${to}].`);
    }
    return to;
  }
}

// ----------------------------------------------------------------------------
// 3. SUBSCRIPTION STATE MACHINE
// ----------------------------------------------------------------------------
export type SubscriptionState = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export class SubscriptionStateMachine {
  private static readonly transitions: Record<SubscriptionState, SubscriptionState[]> = {
    'trialing': ['active', 'cancelled'],
    'active': ['past_due', 'suspended', 'cancelled'],
    'past_due': ['active', 'suspended', 'cancelled'],
    'suspended': ['active', 'cancelled'],
    'cancelled': ['active', 'trialing'], // Reactivation
  };

  static canTransition(from: SubscriptionState, to: SubscriptionState): boolean {
    if (from === to) return true;
    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  static transition(from: SubscriptionState, to: SubscriptionState): SubscriptionState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Illegal Subscription State Transition: Cannot transition from [${from}] to [${to}].`);
    }
    return to;
  }
}
