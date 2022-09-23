export const ExcludeIfReachedSpecDetails = [
    {
        id: "SINGLE_IND_IND",
        experiment: {
            id: "SINGLE_IND_IND",
            assignmentUnit: "individual",
            consistencyRule: "individual",
            conditions: [
                {
                    conditionCode: "control",
                },
                {
                    conditionCode: "variant",
                },
            ],
            decisionPoints: [
                {
                    site: "SelectSections",
                    target: "SINGLE_IND_IND_A",
                    excludeIfReached: true,
                },
            ],
        },
    },
];
