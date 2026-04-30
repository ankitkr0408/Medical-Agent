// Audit logging — records every AI call for compliance, debugging, and cost tracking
// Stored in MongoDB `audit_logs` collection — queryable by admin
import { getDb } from './mongodb'

export type AuditAction =
  | 'image_analysis'
  | 'specialist_opinion'
  | 'multidisciplinary_summary'
  | 'qa_answer'
  | 'report_generated'
  | 'login'
  | 'register'

export interface AuditLog {
  user_id: string
  action: AuditAction
  route: string
  model?: string
  input_summary?: string     // e.g. filename, question snippet — NO PHI in the log itself
  severity?: string
  success: boolean
  error?: string
  duration_ms?: number
  timestamp: string
}

export async function auditLog(entry: AuditLog): Promise<void> {
  try {
    const db = await getDb()
    await db.collection<AuditLog>('audit_logs').insertOne({
      ...entry,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    })
  } catch {
    // Audit logging must never crash the main request
  }
}

// Helper to wrap an async operation with timing + audit
export async function withAudit<T>(
  entry: Omit<AuditLog, 'success' | 'duration_ms' | 'timestamp'>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    await auditLog({ ...entry, success: true, duration_ms: Date.now() - start, timestamp: new Date().toISOString() })
    return result
  } catch (err: any) {
    await auditLog({
      ...entry,
      success: false,
      error: err?.message ?? String(err),
      duration_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
    throw err
  }
}
