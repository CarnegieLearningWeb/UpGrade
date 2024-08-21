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
            fileFilter: [
                include: ['settings.env.js','set_build_variables.js']
            ],
            buildScripts: [[
                    script: 'cd ./frontend &&npm ci --no-audit',
                    githubCheck: '${projectName} npm ci --no-audit',
                    log: '${projectName}-npm-ci.log'
                ],
                [
                    script: 'ls -al',
                    log: '${projectName}-ls-ci.log'
                ]
                // [
                //     script: 'npm run build:project',
                //     log: '${projectName}-build.log',
                //     githubCheck: '${projectName}-build'
                // ]
            ]
        ]
        
    ]
)