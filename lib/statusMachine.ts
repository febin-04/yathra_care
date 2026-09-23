export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ESCALATED';

export const VALID_STATUSES: ComplaintStatus[] = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'ESCALATED',
];

/**
  * State Machine Transition Graph:
  * Submitted -> Acknowledged -> In Progress -> Resolved / Rejected
  * Escalated branch is reachable from any non-resolved/non-rejected state.
  */
export const TRANSITION_MAP: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ESCALATED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ESCALATED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED', 'ESCALATED'],
  ESCALATED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  RESOLVED: [], // Terminal
  REJECTED: [], // Terminal
};

export function normalizeStatus(rawStatus: string): ComplaintStatus {
  const upper = (rawStatus || '').toUpperCase().trim();
  if (upper === 'PENDING') return 'SUBMITTED';
  if (VALID_STATUSES.includes(upper as ComplaintStatus)) {
    return upper as ComplaintStatus;
  }
  return 'SUBMITTED';
}

export function isValidStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return VALID_STATUSES.includes(normalized);
}

export function getNextPossibleStates(currentStatus: string): ComplaintStatus[] {
  const normalized = normalizeStatus(currentStatus);
  return TRANSITION_MAP[normalized] || [];
}

export function validateTransition(
  fromStatus: string,
  toStatus: string
): { valid: boolean; error?: string } {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);

  if (from === to) {
    return { valid: true };
  }

  const allowed = TRANSITION_MAP[from] || [];
  if (!allowed.includes(to)) {
    if (from === 'RESOLVED' || from === 'REJECTED') {
      return {
        valid: false,
        error: `Cannot transition from terminal status '${from}' to '${to}'.`,
      };
    }
    return {
      valid: false,
      error: `Invalid transition from '${from}' to '${to}'. Allowed next states are: ${allowed.join(', ') || 'None (Terminal)'}`,
    };
  }

  return { valid: true };
}
