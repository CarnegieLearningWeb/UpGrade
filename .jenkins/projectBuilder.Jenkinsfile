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
            versioning: "calendar",
            appInfrastructure: [
                [file: "cloudformation/backend/app-infrastructure.yml"]
            ],
            s3Context: [
                glob: "backend/**/*"
            ],
            dockerConfig: [
                dockerFile: "backend/Dockerfile",
                requiresCodeArtifactToken: true
            ]
        ],
        "upgrade-frontend":[
            artifactType: 'codeartifact',
            projectDir: 'frontend',
            artifactDir: 'dist/upgrade',
            versioning: 'calendar',
            oneArtifactPerEnvironment: false,
            buildScripts: [
                [
                    script: 'npm ci --no-audit --strict-peer-deps',
                    log: '${projectName}-npm-ci.log',
                    githubCheck: '${projectName}-npm-ci'
                ],
                [
                    script: 'npm run build:prod',
                    log: '${projectName}-build.log',
                    githubCheck: '${projectName}-build'
                ]
            ]
        ]
        
    ]
)