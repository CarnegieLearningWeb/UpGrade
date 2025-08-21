projectBuilderV5 (
    buildAgent:[
        image: "467155500999.dkr.ecr.us-east-1.amazonaws.com/jenkins-agent:default",
        cpu: 2048,
        memory: 4096
    ],

    projects: [
        "types": [
            artifactType: "codeartifact",
            projectDir: "types",
            runInProjectDir: true,
            skipArtifactUpload: true,
            fileFilter: [
                include: ["types/.*"]
            ],
            buildScripts: [
                [
                    script: 'npm ci --no-audit',
                    githubCheck: 'types npm ci --no-audit',
                    log: 'types-npm-ci.log'
                ]
            ]
        ],
        "upgrade-backend-test": [
            artifactType: "codeartifact",
            projectDir: "backend/packages/Upgrade",
            runInProjectDir: true,
            skipArtifactUpload: true,
            dependencies: ["types"],
            buildScripts: [
                [
                    script: 'npm ci --no-audit',
                    log: '${projectName}-npm-ci.log'
                ],
                [
                    script: 'npm run test:ci',
                    githubCheck: '${projectName}',
                    log: '${projectName}.log'
                ]
            ]
        ],
        "upgrade-service":[
            artifactType: "ecr",
            projectDir: "backend",
            runInProjectDir: true,
            versioning: "branch",
            appInfrastructure: [
                [file: "cloudformation/backend/app-infrastructure.yml"]
            ],
            s3Context: [
                glob: "backend/**/*,types/**/*,*.json"
            ],
            fileFilter: [
                include: ["types/.*","cloudformation/backend/app-infrastructure.yml"]
            ],
            dockerConfig: [
                dockerFile: "backend/cl.Dockerfile",
                requiresCodeArtifactToken: true,
            ],
            automatedBranchBuilds: [
                "dev",
                "release/.*"
            ]
        ],
        "upgrade":[
            artifactType: 'codeartifact',
            projectDir: 'frontend',
            runInProjectDir: true,
            artifactDir: 'dist/upgrade/browser',
            artifactPrefix: "upgrade",
            versioning: 'branch',
            oneArtifactPerEnvironment: true,
            dependencies: ["types"],
            buildScripts: [
                [
                    script: 'npm ci --no-audit',
                    githubCheck: '${projectName} npm ci --no-audit',
                    log: '${projectName}-npm-ci.log'
                ],
                [
                    script: 'npm run prebuild:project',
                    log: 'env-pre-build.log',
                ],
                [
                    script: 'npm run prebuild',
                    githubCheck: '${projectName}-frontend-test',
                    log: 'env-pre-build-test.log',
                ],
                [
                    script: 'npm run build:project',
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
         "scheduler-lambda": [
            artifactType: "s3",
            versioning: "calendar",
            projectDir: "backend/packages/Scheduler",
            artifactDir: "dist",
            runInProjectDir: true,
            s3Config: [
                file: "scheduler-lambda.zip",
                path: "scheduler-lambda/"
            ],
            buildScripts: [
                [
                    script: 'npm ci --no-audit',
                    githubCheck: '${projectName} npm ci --no-audit',
                    log: '${projectName}-npm-ci.log'
                ],
                [
                    script: 'npm run build:prod',
                    log: '${projectName}-build.log',
                    githubCheck: '${projectName}-build'
                ],
                [
                    script: 'npm run postbuild',
                    log: '${projectName}-post-build.log'
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
        "Scheduler-Lambda": [
            projects: ["scheduler-lambda"],
            automated: [
                [
                    type: "defaultBranch",
                    environment: "qa"
                ]
            ],
            jobs: [
                [
                    job: "Upgrade-Scheduler-Lambda-Deploy"
                ]
            ]
        ],
    ]
)
