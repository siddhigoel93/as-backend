const swaggerJsdoc = require("swagger-jsdoc");

const servers = [];
if (process.env.BASE_URL) {
  servers.push({
    url: process.env.BASE_URL,
    description: "Deployed Server (Render)",
  });
}
servers.push({
  url: `http://localhost:${process.env.PORT || 3000}`,
  description: "Local Development Server",
});

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ERP Backend API",
      version: "1.0.0",
      description: "ERP Management System Backend APIs",
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in the format 'Bearer <token>'",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.js", "./src/app.js"], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
