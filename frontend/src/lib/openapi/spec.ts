const errorSchema = {
  type: "object",
  required: ["error"],
  properties: { error: { type: "string" } },
} as const;

const tokenPairSchema = {
  type: "object",
  required: ["access_token", "refresh_token"],
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
} as const;

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Job Search Tracker Extension API",
    version: "1.0.0",
    description: "API consumed by the Job Search Tracker browser extension.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      ErrorResponse: errorSchema,
      DuplicateResponse: {
        type: "object",
        required: ["error", "application_id"],
        properties: {
          error: { type: "string" },
          application_id: { type: "string", format: "uuid" },
        },
      },
      SigninRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
      SigninResponse: tokenPairSchema,
      RefreshRequest: {
        type: "object",
        required: ["refresh_token"],
        properties: { refresh_token: { type: "string", minLength: 1 } },
      },
      RefreshResponse: tokenPairSchema,
      TrackRequest: {
        type: "object",
        required: ["company_name", "position", "url"],
        properties: {
          company_name: { type: "string", minLength: 1 },
          position: { type: "string", minLength: 1 },
          url: { type: "string", format: "uri" },
        },
      },
      TrackResponse: {
        type: "object",
        required: ["application_id", "company_id"],
        properties: {
          application_id: { type: "string", format: "uuid" },
          company_id: { type: "string", format: "uuid" },
        },
      },
    },
  },
  paths: {
    "/extension/signin": {
      post: {
        operationId: "signinExtension",
        summary: "Sign in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SigninRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authentication tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SigninResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/extension/refresh": {
      post: {
        operationId: "refreshExtension",
        summary: "Refresh access token using a refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "New authentication tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshResponse" },
              },
            },
          },
          "400": {
            description: "Missing refresh_token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/extension/track": {
      post: {
        operationId: "trackApplication",
        summary: "Track a job application",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TrackRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Application tracked successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TrackResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid Bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Application already tracked within 24 hours",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DuplicateResponse" },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;
