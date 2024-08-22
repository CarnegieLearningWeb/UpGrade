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
            versioning: "calendar",
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
            ]
        ],
        "upgrade":[
            artifactType: 'codeartifact',
            projectDir: 'frontend',
            runInProjectDir: true,
            artifactDir: 'dist/upgrade',
            versioning: 'calendar',
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
                GOOGLE_CLIEND_ID: '@vault(secret/configs/upgrade/${environment}/GOOGLE_CLIEND_ID)',
            ],
        ]
    ]
)
