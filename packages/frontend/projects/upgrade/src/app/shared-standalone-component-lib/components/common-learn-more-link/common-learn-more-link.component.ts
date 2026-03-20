import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { LEARN_MORE_LINKS, LearnMoreLinkKey } from '../../../shared/constants/learn-more-links.constants';

/**
 * Common Learn More Link Component
 *
 * Displays a standardized "Learn more" link to documentation pages.
 *
 * @example
 * <app-common-learn-more-link learnMoreLinkKey="glossary.context"></app-common-learn-more-link>
 */
@Component({
  selector: 'app-common-learn-more-link',
  imports: [],
  templateUrl: './common-learn-more-link.component.html',
  styleUrls: ['./common-learn-more-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonLearnMoreLinkComponent {
  @Input() learnMoreLinkKey!: LearnMoreLinkKey;

  protected readonly learnMoreLinks = LEARN_MORE_LINKS;
}
