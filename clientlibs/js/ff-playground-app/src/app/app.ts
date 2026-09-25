import { Component, computed, effect, signal } from '@angular/core';
import { FeatureFlagPlaygroundService, GroupType, SCHOOL_CIRCLE_FLAG, SQUARE_COLOR_FLAG } from './feature-flag-playground.service';

interface GroupRow {
  type: GroupType;
  valuesText: string;
}

interface StoredForm {
  userId: string;
  rows: GroupRow[];
}

const GROUP_TYPES: GroupType[] = ['classId', 'schoolId', 'districtId', 'instructorId'];
const FORM_STORAGE_KEY = 'ff-playground-form';

// Remembers the last-entered userId + group rows across refreshes, purely as a form-fill
// convenience — it does not restore the logged-in session itself.
function loadStoredForm(): StoredForm {
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      userId: typeof parsed?.userId === 'string' ? parsed.userId : '',
      rows: Array.isArray(parsed?.rows) ? parsed.rows : [],
    };
  } catch {
    return { userId: '', rows: [] };
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <main>
      <h1>Feature Flag Playground</h1>
      <p class="subtitle">
        Exercises the recipes from <code>feature-flags-guide.md</code> against a real UpGrade
        backend. See <code>feature-flag-playground.service.ts</code> to change which recipe runs.
      </p>

      @if (!ff.loggedIn()) {
        <section class="card">
          <h2>Log in</h2>

          <label>
            User id
            <div class="row">
              <input [value]="userIdInput()" (input)="userIdInput.set(input($event))" placeholder="leave blank to generate a UUID" />
              <button type="button" (click)="userIdInput.set(generateUUID())">Generate UUID</button>
            </div>
          </label>

          <h3>Groups</h3>
          @for (row of rows(); track $index) {
            <div class="row">
              <select [value]="row.type" (change)="setRowType($index, input($event))">
                @for (t of groupTypes; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
              <input
                [value]="row.valuesText"
                (input)="setRowValues($index, input($event))"
                placeholder="comma-separated values, e.g. school-1, school-2"
              />
              <button type="button" [attr.aria-label]="'Remove ' + row.type + ' group'" (click)="removeRow($index)">✕</button>
            </div>
          }
          <button type="button" (click)="addRow()">+ Add group</button>

          <div class="actions">
            <button type="button" class="primary" [disabled]="ff.loading()" (click)="login()">
              {{ ff.loading() ? 'Logging in…' : 'Log in' }}
            </button>
          </div>

          @if (ff.error()) {
            <p class="error">{{ ff.error() }}</p>
          }
        </section>
      } @else {
        <section class="card">
          <h2>Session</h2>
          <p><strong>userId:</strong> {{ ff.userId() }}</p>
          <p><strong>useGroups:</strong> <code>{{ groupsJson() }}</code></p>
          <button type="button" (click)="logout()">Log out</button>
        </section>

        <section class="card">
          <h2>{{ squareFlagKey }}</h2>
          <div class="square" [class.on]="ff.squareEnabled()" [class.off]="!ff.squareEnabled()">
            {{ ff.squareEnabled() ? 'ON' : 'OFF' }}
          </div>
        </section>

        <section class="card">
          <h2>{{ circleFlagKey }} (by schoolId)</h2>
          @if (ff.schoolIds().length === 0) {
            <p>User has no schoolIds associated.</p>
          } @else {
            <div class="circles">
              @for (schoolId of ff.schoolIds(); track schoolId) {
                <div class="circle-wrap">
                  <div class="circle" [class.on]="ff.schoolCircleStates()[schoolId]" [class.off]="!ff.schoolCircleStates()[schoolId]">
                    {{ ff.schoolCircleStates()[schoolId] ? 'ON' : 'OFF' }}
                  </div>
                  <span>{{ schoolId }}</span>
                </div>
              }
            </div>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      main {
        max-width: 640px;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: system-ui, sans-serif;
      }
      .subtitle {
        color: #666;
        font-size: 0.9rem;
      }
      .card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
      }
      .row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin: 0.5rem 0;
      }
      label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      input,
      select {
        padding: 0.4rem;
        font-size: 1rem;
      }
      input[type='text'],
      input:not([type]) {
        flex: 1;
      }
      button {
        padding: 0.4rem 0.8rem;
        cursor: pointer;
      }
      button.primary {
        background: #2b6cb0;
        color: white;
        border: none;
        border-radius: 4px;
      }
      .actions {
        margin-top: 1rem;
      }
      .error {
        color: #c0392b;
      }
      .square {
        width: 140px;
        height: 140px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
      .square.on {
        background: #2ecc71;
      }
      .square.off {
        background: #e74c3c;
      }
      .circles {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .circle-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }
      .circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 0.65rem;
      }
      .circle.on {
        background: #2ecc71;
      }
      .circle.off {
        background: #e74c3c;
      }
    `,
  ],
})
export class App {
  readonly squareFlagKey = SQUARE_COLOR_FLAG;
  readonly circleFlagKey = SCHOOL_CIRCLE_FLAG;
  readonly groupTypes = GROUP_TYPES;

  readonly userIdInput = signal(loadStoredForm().userId);
  readonly rows = signal<GroupRow[]>(loadStoredForm().rows);

  constructor(public ff: FeatureFlagPlaygroundService) {
    effect(() => {
      const form: StoredForm = { userId: this.userIdInput(), rows: this.rows() };
      try {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // localStorage unavailable (private browsing, etc.) — nothing to persist, ignore.
      }
    });
  }

  generateUUID = generateUUID;
  readonly groupsJson = computed(() => JSON.stringify(this.ff.allGroups()));

  input(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  addRow(): void {
    this.rows.update((rows) => [...rows, { type: 'schoolId', valuesText: '' }]);
  }

  removeRow(index: number): void {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
  }

  setRowType(index: number, type: string): void {
    this.rows.update((rows) => rows.map((row, i) => (i === index ? { ...row, type: type as GroupType } : row)));
  }

  setRowValues(index: number, valuesText: string): void {
    this.rows.update((rows) => rows.map((row, i) => (i === index ? { ...row, valuesText } : row)));
  }

  async login(): Promise<void> {
    const userId = this.userIdInput().trim() || generateUUID();
    const groups = this.rows().map((row) => ({
      type: row.type,
      values: row.valuesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    }));

    await this.ff.login(userId, groups);
  }

  logout(): void {
    this.ff.logout();
    this.userIdInput.set('');
    this.rows.set([]);
  }
}
