projectBuilderV5 (
    buildAgent:[
        image: "467155500999.dkr.ecr.us-east-1.amazonaws.com/jenkins-agent:default",
        cpu: 2048,
        memory: 4096
    ],
    initScripts: [[
        script: 'npm ci --no-audit',
        githubCheck: 'npm ci --no-audit',
        log: 'npm-ci.log'
    ]],
    projects: [
        "upgrade-service":[
            artifactType: "ecr",
            projectDir: "backend",
            versioning: "calendar",
            appInfrastructure: [
                [file: "cloudformation/backend/app-infrastructure.yml"]
            ],
            s3Context: [
                glob: "backend/**/*"
            ],
            fileFilter: [
                include: ["backend/.*"]
            ],
            dockerConfig: [
                dockerFile: "backend/Dockerfile",
                requiresCodeArtifactToken: true
            ]
        ],
        "upgrade-frontend":[
            artifactType: 'codeartifact',
            projectDir: 'frontend',
            artifactPrefix: 'upgrade',
            artifactDir: 'dist/upgrade',
            versioning: 'calendar',
            oneArtifactPerEnvironment: false,
            buildScripts: [
                [
                    script: 'npm run build:prod',
                    log: '${projectName}-build.log',
                    githubCheck: '${projectName}-build'
                ]
            ]
        ]
        
    ]
)