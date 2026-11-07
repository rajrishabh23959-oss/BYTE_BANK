
import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "ByteBank Digital Asset Management API",
      version: "1.0.0",
      description: "Production-grade PostgreSQL-backed digital asset and transaction management system. Implements ACID transactions, double-entry ledger bookkeeping, rule-based risk screening, idempotent retries, and privacy-aware access logging.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local Development Server" }
    ],
    paths: {
      "/api/auth/login": {
        post: {
          summary: "Authenticate user and issue rotating JWT cookies",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  },
                  required: ["email", "password"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Authentication successful with set-cookie" },
            "401": { description: "Invalid credentials" }
          }
        }
      },
      "/api/customer/transfer/preview": {
        post: {
          summary: "Execute Rule-Based Risk Screening preview before confirming transfer",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recipientAccountNo: { type: "string" },
                    assetId: { type: "integer" },
                    quantity: { type: "number" }
                  },
                  required: ["recipientAccountNo", "assetId", "quantity"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Risk screening assessment with plain-language reasons and auth token" }
          }
        }
      },
      "/api/customer/transfer/confirm": {
        post: {
          summary: "Execute ACID asset transfer with Idempotency-Key guarantee",
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recipientAccountNo: { type: "string" },
                    assetId: { type: "integer" },
                    quantity: { type: "number" },
                    authToken: { type: "string", format: "uuid" }
                  },
                  required: ["recipientAccountNo", "assetId", "quantity"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Transfer completed and posted to double-entry ledger" },
            "409": { description: "Idempotency parameter mismatch or in-flight transfer" }
          }
        }
      },
      "/api/admin/reconciliation": {
        get: {
          summary: "Query holding vs ledger reconciliation status",
          responses: { "200": { description: "Reconciliation status" } }
        },
        post: {
          summary: "Run automated reconciliation procedure",
          responses: { "200": { description: "Reconciliation run stats" } }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec);
}
