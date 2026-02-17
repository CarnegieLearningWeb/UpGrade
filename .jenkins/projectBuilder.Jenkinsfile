projectBuilderV5 (
    buildAgent:[
        taskDefinitionOverride: "upgrade-ci"
    ],
    initScripts: [
        [
            script: 'npx yarn',
            log: 'yarn-install.log'
        ]
    ],
    projects: [
        "upgrade-service":[
            artifactType: "ecr",
            projectDir: ".",
            runInProjectDir: true,
            versioning: "branch",
            fileFilter: [
                include: ["packages/backend/.*"]
            ],
            appInfrastructure: [
                [file: "cloudformation/backend/app-infrastructure.yml"]
            ],
            s3Context: [
                glob: "packages/backend/**/*,packages/types/**/*,packages/frontend/package.json,*.json,yarn.lock,.yarn*",
            ],
            dockerConfig: [
                dockerFile: "packages/backend/cl.Dockerfile",
                requiresCodeArtifactToken: true,
            ],
            automatedBranchBuilds: [
                "dev",
                "release/.*"
            ]
        ],
        "upgrade":[
            artifactType: 'codeartifact',
            projectDir: '.',
            runInProjectDir: true,
            artifactDir: 'packages/frontend/dist/upgrade/browser',
            artifactPrefix: "upgrade",
            versioning: 'branch',
            oneArtifactPerEnvironment: true,
            buildScripts: [
                [
                    script: 'npx yarn workspace ab-testing test',
                    githubCheck: "upgrade-frontend-test",
                    log: "upgrade-frontend-test.log"
                ],
                [
                    script: 'npx yarn workspace ab-testing prebuild:project',
                    log: 'env-pre-build.log',
                ],
                [
                    script: 'npx yarn workspace ab-testing build:project',
                    log: '${projectName}-build.log',
                    githubCheck: '${projectName}-build'
                ]
            ],
            envVars: [
                API_BASE_URL: '@vault(secret/configs/upgrade/${environment}/API_BASE_URL)',
                BASE_HREF_PREFIX: '@vault(secret/configs/upgrade/${environment}/BASE_HREF_PREFIX)',
                GOOGLE_CLIENT_ID: '@vault(secret/configs/upgrade/${environment}/GOOGLE_CLIENT_ID)',
                GOOGLE_SERVICE_ACCOUNT_ID: '@vault(secret/configs/upgrade/${environment}/GOOGLE_SERVICE_ACCOUNT_ID)',
            ],
            automatedBranchBuilds: [
                "dev",
                "release/.*"
            ]
        ],
        "upgrade-backend-tests": [
            artifactType: "codeartifact",
            versioning: "none",
            projectDir: ".",
            runInProjectDir: true,
            skipArtifactUpload: true,
            fileFilter: [
                include: ["packages/backend/.*"]
            ],
            buildScripts: [
                [
                    script: 'npx yarn workspace ab_testing_backend test',
                    githubCheck: '${projectName} test',
                    log: '${projectName}-test.log'
                ]
            ]
        ],
    ],
    deployments: [
        UpgradeService: [
            projects: ["upgrade-service"],
            automated: [
                [
                    type: "defaultBranch",
                    environment: "qa"
                ],
                [
                    branchRegex: "release/.*",
                    environment: "staging"
                ]

            ],
            jobs: [
                [
                    job: "Upgrade-Service-Deploy",
                    type: "bluegreen"
                ]
            ]
        ],
        Upgrade: [
            projects: ["upgrade"],
            automated: [
                [
                    type: "defaultBranch",
                    environment: "qa"
                ],
                [
                    branchRegex: "release/.*",
                    environment: "staging"
                ]
            ],
            jobs: [
                [
                    job: "Upgrade-Frontend-Deploy"
                ]
            ]
        ],
    ],
    prChecks: [
        "checks": [
           "lint": [
             buildScripts: [
               [
                 script: 'npx yarn lint',
                 githubCheck: 'lint',
                 log: 'lint.log'
               ]
             ]
           ]
        ]
    ]
)
