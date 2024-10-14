projectBuilderV5 (
    buildAgent:[
        image: "467155500999.dkr.ecr.us-east-1.amazonaws.com/jenkins-agent:default",
        cpu: 2048,
        memory: 4096
    ],

    projects: [
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
            artifactDir: 'dist/upgrade',
            versioning: 'branch',
            oneArtifactPerEnvironment: true,
            buildScripts: [
                [
                    script: 'npm ci --no-audit',
                    githubCheck: '${projectName} npm ci --no-audit',
                    log: '${projectName}-npm-ci.log'
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
