/**
 * Centralized configuration for all "Learn more" documentation links
 * used throughout the UpGrade application.
 */

export interface LearnMoreLink {
  url: string;
  description: string;
}

/**
 * Record of all learn-more links used in the application.
 * To add a new link, simply add it to this object - the LearnMoreLinkKey type is automatically derived.
 */
export const LEARN_MORE_LINKS = {
  'glossary.context': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/glossary#app-context',
    description: 'Glossary definition of app context',
  },
  'glossary.condition': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/glossary#condition',
    description: 'Glossary definition of condition',
  },
  'glossary.decisionPoint': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/glossary#decision-point',
    description: 'Glossary definition of decision points',
  },
  'glossary.excludeIfReached': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/glossary#exclude-if-reached',
    description: 'Glossary definition of exclude if reached',
  },
  'glossary.payload': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/glossary#payload',
    description: 'Glossary definition of payloads',
  },
  'guide.add-lists': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/working-with-segments#add-lists',
    description: 'Add list section of the segments guide',
  },
  'guide.metrics': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/developer-guide/reference/metrics',
    description: 'Developer guide for metrics configuration',
  },
  'guide.featureFlag': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/creating-a-feature-flag#step-2-define-the-feature-flag-properties',
    description: 'Feature flag properties setup guide',
  },
  'guide.importing-entities': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/importing-and-exporting-items',
    description: 'Importing entities section of the segments guide',
  },
  'guide.thompsonSamplingConfigurable': {
    url: 'https://upgrade-platform.gitbook.io/upgrade-documentation/creating-an-adaptive-experiment/thompson-sampling-configurable',
    description: 'Thompson sampling configuration guide',
  },
} as const;

export type LearnMoreLinkKey = keyof typeof LEARN_MORE_LINKS;
