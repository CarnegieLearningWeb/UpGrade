import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import {
  DATE_RANGE,
  ExperimentDateFilterOptions,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { FeatureFlag, IExposureStatByDate } from '../../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-feature-flag-exposures-data',
  templateUrl: './feature-flag-exposures-data.component.html',
  styleUrl: './feature-flag-exposures-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslateModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxChartsModule,
    FormsModule,
  ],
})
export class FeatureFlagExposuresDataComponent implements OnInit, OnDestroy {
  @Input() featureFlag: FeatureFlag;

  dateFilterOptions: ExperimentDateFilterOptions[] = [
    { value: DATE_RANGE.TOTAL, viewValue: 'Total' },
    { value: DATE_RANGE.LAST_SEVEN_DAYS, viewValue: 'Last 7 days' },
    { value: DATE_RANGE.LAST_TWO_WEEKS, viewValue: 'Last 2 weeks' },
    { value: DATE_RANGE.LAST_ONE_MONTH, viewValue: 'Last 1 month' },
    { value: DATE_RANGE.LAST_THREE_MONTHS, viewValue: 'Last 3 months' },
    { value: DATE_RANGE.LAST_SIX_MONTHS, viewValue: 'Last 6 months' },
    { value: DATE_RANGE.LAST_TWELVE_MONTHS, viewValue: 'Last 12 months' },
  ];

  selectedDateFilter: DATE_RANGE = DATE_RANGE.TOTAL;
  effectiveDateFilter: DATE_RANGE;
  graphData: { name: string; series: { name: string; value: number }[] }[] = [];
  yScaleMax: number | undefined;

  colorScheme = { domain: ['#31e8dd'] };

  isGraphLoading$ = this.featureFlagsService.isFeatureFlagGraphLoading$;
  totalExposures$ = this.featureFlagsService.featureFlagTotalExposures$;
  periodTotal = 0;

  private graphInfoSub: Subscription;
  private readonly sinceDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  constructor(private readonly featureFlagsService: FeatureFlagsService, private readonly cdr: ChangeDetectorRef) {
    this.formatXAxisLabel = this.formatXAxisLabel.bind(this);
  }

  ngOnInit(): void {
    this.setTotalDateLabel();

    this.graphInfoSub = this.featureFlagsService.selectFeatureFlagGraphInfo$
      .pipe(filter((info) => !!info))
      .subscribe((graphInfo: IExposureStatByDate[]) => {
        this.populateGraphData(graphInfo);
        this.cdr.markForCheck();
      });

    this.setEffectiveDateFilter();
    this.featureFlagsService.setGraphRange(
      this.effectiveDateFilter,
      this.featureFlag.id,
      -new Date().getTimezoneOffset()
    );
    this.featureFlagsService.fetchTotalExposures(this.featureFlag.id, -new Date().getTimezoneOffset());
  }

  formatXAxisLabel(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    if (
      this.effectiveDateFilter === DATE_RANGE.LAST_SEVEN_DAYS ||
      this.effectiveDateFilter === DATE_RANGE.LAST_TWO_WEEKS ||
      this.effectiveDateFilter === DATE_RANGE.LAST_ONE_MONTH
    ) {
      return value.substring(0, 5);
    } else if (this.effectiveDateFilter === DATE_RANGE.TOTAL) {
      return value.substring(0, 4);
    }
    return value.substring(0, 3);
  }

  formatYAxisLabel(value: number): string | number {
    return value % 1 !== 0 ? '' : value;
  }

  applyDateFilter(): void {
    this.setEffectiveDateFilter();
    this.featureFlagsService.setGraphRange(
      this.effectiveDateFilter,
      this.featureFlag.id,
      -new Date().getTimezoneOffset()
    );
  }

  private setEffectiveDateFilter(): void {
    if (this.selectedDateFilter === DATE_RANGE.TOTAL) {
      this.effectiveDateFilter = this.getDynamicTotalRange();
      return;
    }
    this.effectiveDateFilter = this.selectedDateFilter;
  }

  private setTotalDateLabel(): void {
    const totalOption = this.dateFilterOptions.find((option) => option.value === DATE_RANGE.TOTAL);
    if (!totalOption) return;

    const createdAt = this.featureFlag?.createdAt;
    const label = createdAt ? `Total (Since ${this.sinceDateFormatter.format(new Date(createdAt))})` : 'Total';

    if (totalOption.viewValue !== label) {
      totalOption.viewValue = label;
    }
  }

  private getDynamicTotalRange(): DATE_RANGE {
    const createdAt = this.featureFlag?.createdAt;
    if (!createdAt) {
      return DATE_RANGE.LAST_SEVEN_DAYS;
    }

    const startDate = new Date(createdAt);
    const now = new Date();

    const rangeBoundaries = [
      { range: DATE_RANGE.LAST_SEVEN_DAYS, cutoff: this.subtractDays(now, 7) },
      { range: DATE_RANGE.LAST_TWO_WEEKS, cutoff: this.subtractDays(now, 14) },
      { range: DATE_RANGE.LAST_ONE_MONTH, cutoff: this.subtractMonths(now, 1) },
      { range: DATE_RANGE.LAST_THREE_MONTHS, cutoff: this.subtractMonths(now, 3) },
      { range: DATE_RANGE.LAST_SIX_MONTHS, cutoff: this.subtractMonths(now, 6) },
      { range: DATE_RANGE.LAST_TWELVE_MONTHS, cutoff: this.subtractMonths(now, 12) },
    ];

    const matchedWindow = rangeBoundaries.find(({ cutoff }) => startDate >= cutoff);
    return matchedWindow ? matchedWindow.range : DATE_RANGE.TOTAL;
  }

  private subtractDays(baseDate: Date, days: number): Date {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - days);
    return date;
  }

  private subtractMonths(baseDate: Date, months: number): Date {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - months);
    return date;
  }

  private populateGraphData(graphInfo: IExposureStatByDate[]): void {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.periodTotal = graphInfo.reduce((sum, d) => sum + d.count, 0);

    this.graphData = graphInfo.map((d) => {
      const date = new Date(d.date);
      let name: string;
      if (
        this.effectiveDateFilter === DATE_RANGE.LAST_SEVEN_DAYS ||
        this.effectiveDateFilter === DATE_RANGE.LAST_TWO_WEEKS ||
        this.effectiveDateFilter === DATE_RANGE.LAST_ONE_MONTH
      ) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = date.getFullYear();
        const day = days[date.getDay()].substring(0, 3);
        name = `${mm}/${dd}/${yy}-${day}`;
      } else if (this.effectiveDateFilter === DATE_RANGE.TOTAL) {
        name = date.getFullYear().toString();
      } else {
        name = months[date.getMonth()];
      }
      return { name, series: [{ name: 'Exposed', value: d.count }] };
    });

    this.yScaleMax = this.periodTotal === 0 ? 1 : undefined;
  }

  ngOnDestroy(): void {
    this.featureFlagsService.setGraphRange(null, this.featureFlag.id, -new Date().getTimezoneOffset());
    this.featureFlagsService.clearTotalExposures();
    this.graphInfoSub?.unsubscribe();
  }
}
