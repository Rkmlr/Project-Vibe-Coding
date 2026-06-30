import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // Folder where API routes are located
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'FamFi API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi interaktif untuk API Pelacak Keuangan Keluarga FamFi.',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
