export interface ListenerSubscription {
  /** Stops future calls. Idempotent. */
  remove: () => void
}
