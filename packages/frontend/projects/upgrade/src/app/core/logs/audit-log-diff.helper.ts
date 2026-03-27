import { Injectable } from '@angular/core';

/**
 * A single row in a side-by-side diff display.
 *
 * Each row represents either a paired change (one removed line alongside one added line),
 * a context line shared by both sides, or a padding row on one side when the block sizes
 * don't match.
 */
export interface DiffRow {
  leftLineNum?: number;
  rightLineNum?: number;
  leftContent?: string;
  rightContent?: string;
  /** `'removed'` for a deleted line, `'context'` for unchanged, `'empty'` for padding. */
  leftType?: 'removed' | 'context' | 'empty';
  /** `'added'` for a new line, `'context'` for unchanged, `'empty'` for padding. */
  rightType?: 'added' | 'context' | 'empty';
}

interface DiffLineBuffer {
  removed: { lineNum: number; content: string }[];
  added: { lineNum: number; content: string }[];
}

/**
 * Provides pure utility methods for parsing and extracting audit log diffs.
 *
 * The backend generates diffs using `json-diff`'s `diffString()`, which produces
 * a unified diff format with ANSI color codes:
 * - Lines prefixed with `-` are removed lines
 * - Lines prefixed with `+` are added lines
 * - Lines prefixed with a space (or no special prefix) are context lines
 *
 * No hunk headers (`@@`) are produced by `diffString`, so this service does not
 * need to handle them.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogDiffHelperService {
  /**
   * Returns `true` if the given audit log data payload contains a diff string.
   *
   * Handles both top-level diffs (`logData.diff`) and list-scoped diffs
   * (`logData.list.diff`), as produced by feature flag segment updates.
   */
  hasDiff(logData: unknown): boolean {
    const data = logData as Record<string, any>;
    return !!(data?.['diff'] || data?.['list']?.['diff']);
  }

  /**
   * Extracts the raw diff string from an audit log data payload.
   *
   * List-scoped diffs (`logData.list.diff`) take precedence over top-level diffs
   * (`logData.diff`) to match how feature flag segment list changes are stored.
   * Returns an empty string if no diff is present.
   */
  getDiffContent(logData: unknown): string {
    const data = logData as Record<string, any>;
    return data?.['list']?.['diff'] || data?.['diff'] || '';
  }

  /**
   * Converts a raw unified diff string into structured {@link DiffRow} objects
   * for side-by-side display.
   *
   * ANSI color codes are stripped before parsing. Consecutive blocks of removed
   * and added lines are paired together so they align horizontally. When a block
   * has more removed lines than added lines (or vice versa), the shorter side is
   * padded with empty cells.
   *
   * @param raw - A raw diff string as produced by `json-diff`'s `diffString()`.
   * @returns An ordered array of `DiffRow` objects ready for rendering.
   */
  parseDiff(raw: string): DiffRow[] {
    const lines = this.stripAnsi(raw).split('\n');
    const rows: DiffRow[] = [];
    let leftNum = 1;
    let rightNum = 1;
    let buffer: DiffLineBuffer = { removed: [], added: [] };

    for (const line of lines) {
      if (line.startsWith('-')) {
        buffer.removed.push({ lineNum: leftNum++, content: line.slice(1) });
      } else if (line.startsWith('+')) {
        buffer.added.push({ lineNum: rightNum++, content: line.slice(1) });
      } else {
        rows.push(...this.flushBuffer(buffer));
        buffer = { removed: [], added: [] };

        const content = line.startsWith(' ') ? line.slice(1) : line;
        if (content !== '') {
          rows.push({
            leftLineNum: leftNum++,
            rightLineNum: rightNum++,
            leftContent: content,
            rightContent: content,
            leftType: 'context',
            rightType: 'context',
          });
        }
      }
    }

    rows.push(...this.flushBuffer(buffer));
    return rows;
  }

  /**
   * Pairs buffered removed and added lines into aligned {@link DiffRow} objects.
   *
   * Lines are matched by position within their respective block. If one side has
   * more lines than the other, the shorter side is padded with `'empty'` rows.
   */
  private flushBuffer(buffer: DiffLineBuffer): DiffRow[] {
    const maxLen = Math.max(buffer.removed.length, buffer.added.length);
    const rows: DiffRow[] = [];

    for (let i = 0; i < maxLen; i++) {
      const removed = buffer.removed[i];
      const added = buffer.added[i];
      rows.push({
        leftLineNum: removed?.lineNum,
        rightLineNum: added?.lineNum,
        leftContent: removed?.content ?? '',
        rightContent: added?.content ?? '',
        leftType: removed ? 'removed' : 'empty',
        rightType: added ? 'added' : 'empty',
      });
    }

    return rows;
  }

  /** Strips ANSI terminal color/style escape codes from a string. */
  private stripAnsi(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }
}
