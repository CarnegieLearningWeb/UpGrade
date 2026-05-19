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
import { DATE_RANGE } from '../../../../../../../../core/experiments/store/experiments.model';
import { FeatureFlag, IExposureStatByDate } from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import {
  CommonChartHelpersService,
  DateFilterOption,
  SINCE_DATE_FORMATTER,
} from '../../../../../../../../shared/services/common-chart-helpers.service';

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

  dateFilterOptions: DateFilterOption[];

  selectedDateFilter: DATE_RANGE = DATE_RANGE.TOTAL;
  effectiveDateFilter: DATE_RANGE;
  graphData: { name: string; series: { name: string; value: number }[] }[] = [];
  yScaleMax: number | undefined;

  colorScheme = { domain: ['#31e8dd'] };

  isGraphLoading$ = this.featureFlagsService.isFeatureFlagGraphLoading$;
  totalExposures$ = this.featureFlagsService.featureFlagTotalExposures$;
  periodTotal = 0;

  private graphInfoSub: Subscription;

  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly commonChartHelpersService: CommonChartHelpersService
  ) {
    this.dateFilterOptions = this.commonChartHelpersService.getDateFilterOptions();
    this.formatXAxisLabel = this.formatXAxisLabel.bind(this);
    this.formatYAxisLabel = this.formatYAxisLabel.bind(this);
  }

  ngOnInit(): void {
    this.setTotalDateLabel();

    this.graphInfoSub = this.featureFlagsService.featureFlagGraphInfo$
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
    return this.commonChartHelpersService.formatXAxisLabel(this.effectiveDateFilter, value);
  }

  formatYAxisLabel(value: number): string | number {
    return this.commonChartHelpersService.formatYAxisLabel(value);
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
    const label = createdAt ? `Total (Since ${SINCE_DATE_FORMATTER.format(new Date(createdAt))})` : 'Total';

    if (totalOption.viewValue !== label) {
      totalOption.viewValue = label;
    }
  }

  private getDynamicTotalRange(): DATE_RANGE {
    const createdAt = this.featureFlag?.createdAt;
    return this.commonChartHelpersService.getDynamicTotalRange(createdAt ? new Date(createdAt) : null);
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
