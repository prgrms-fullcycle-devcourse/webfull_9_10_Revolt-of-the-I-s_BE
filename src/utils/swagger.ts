import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { Application } from 'express';

const swaggerSpec = YAML.load(path.join(__dirname, '../config/swagger.yaml'));

export const setupSwagger = (app: Application): void => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true, 
      customSiteTitle: "i-Station API Docs", 
    })
  );

  console.log('📖 API 명세서가 http://localhost:8080/api-docs 에 로드되었습니다.');
};