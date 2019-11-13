import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import * as swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { env } from '../env';

export const swaggerLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    if (settings && env.swagger.enabled) {
        const expressApp = settings.getData('express_app');
        const swaggerOptions = {
            swaggerDefinition: {
                components: {},
                basePath: `${env.app.routePrefix}`,
                info: {
                    title: env.app.name,
                    description: env.app.description,
                    servers: [{
                        url: `${env.app.schema}://${env.app.host}:${env.app.port}${env.app.routePrefix}`,
                    }],
                },
            },
            explorer: true,
            apis: ['**/controllers/*.ts'],
        };
        const swaggerDocs = swaggerJSDoc(swaggerOptions);
        expressApp.use(env.swagger.route, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    }
};
