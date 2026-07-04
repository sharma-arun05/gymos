// ============================================================================
// Enterprise Event Bus Singleton
// Decouples domain logic: Usecases emit events -> Listeners execute side-effects.
// ============================================================================

import { DomainEventName, DomainEvent, EventCallback } from './types';
import { supabase } from '../lib/supabase';

class EventBus {
  private listeners: Map<DomainEventName, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to a specific domain event
   */
  subscribe<T extends DomainEvent>(eventName: T['eventName'], callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    const callbacks = this.listeners.get(eventName)!;
    callbacks.add(callback);

    // Return unsubscribe handler
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  /**
   * Emit a domain event asynchronously to all listeners
   */
  async emit(event: DomainEvent): Promise<void> {
    const callbacks = this.listeners.get(event.eventName);
    
    // Log event dispatch to telemetry console for dev observability
    console.info(`[EventBus] Emitting event [${event.eventName}] ID: ${event.id}`, event.payload);

    // Asynchronously log event to system_logs if gymId exists
    if (event.gymId) {
      this.persistEventLog(event).catch((err) =>
        console.error(`[EventBus] Failed to persist event log for [${event.eventName}]:`, err)
      );
    }

    if (!callbacks || callbacks.size === 0) {
      return;
    }

    // Execute all registered listeners concurrently
    const promises = Array.from(callbacks).map(async (cb) => {
      try {
        await cb(event);
      } catch (error) {
        console.error(`[EventBus] Listener error handling event [${event.eventName}]:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Persist event trace to database system logs for auditability
   */
  private async persistEventLog(event: DomainEvent): Promise<void> {
    try {
      await supabase.from('system_logs').insert({
        gym_id: event.gymId,
        level: 'info',
        module: 'EventBus',
        message: `Domain Event Dispatched: ${event.eventName}`,
        metadata: {
          eventId: event.id,
          timestamp: event.timestamp,
          payload: event.payload,
          userId: event.userId,
        },
      });
    } catch (err) {
      // Non-blocking log persistence failure
    }
  }

  /**
   * Clear all subscribers (useful for test tear down)
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
