export interface AppContextSupportedGroupType {
    name: string; // or id?
    description?: string | null; // no description needed for grouptype?
}

export interface AppContextDecisionPointSite {
    name: string; // or id?
    description?: string | null;
}

export interface AppContextDecisionPointTargetCondition {
    name: string; // or id?
    description?: string | null;
}

export interface AppContextDecisionPointTarget {
    id: string,
    description?: string,
    conditions: AppContextDecisionPointTargetCondition[]
    unsupportedGroupTypes: string[]
}

export interface AppContextDecisionPoint {
    site: AppContextDecisionPointSite,
    targets: AppContextDecisionPointTarget[]
}

export interface AppContext {
    name: string;
    version: string,
    description?: string | null;
    supportedGroupTypes: AppContextSupportedGroupType[],
    decisionPoints: AppContextDecisionPoint[]
}