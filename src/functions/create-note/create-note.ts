import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { MetricUnit, Metrics } from "@aws-lambda-powertools/metrics";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CreateNote } from "../../dto/create-note/create-note";
import { Note } from "../../dto/note/note";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "node:crypto";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { ValidationError } from "../../errors/validation-error";
import { errorHandler } from "../../shared/error-handler/error-handler";
import { logger } from "../../shared/logger/logger";
import { schemaValidator } from "../../shared/schema-validator/schema-validator";
import { schema } from "./create-note-schema";

const tracer = new Tracer();
const metrics = new Metrics({
  serviceName: "leighton-hr",
  namespace: "leighton-hr",
});
const client = new DynamoDBClient();
export const createNoteHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError("No payload body");
    }

    const newNote = JSON.parse(event.body) as CreateNote;
    schemaValidator(schema, newNote);
    const customerId = event.pathParameters?.id;
    if (!customerId) throw new Error("No customer ID supplied");
    const id = randomUUID();
    const currentDate = new Date().toISOString();

    const newItem: Note = {
      ...newNote,
      pk: `CUSTOMER#${customerId}`,
      sk: `NOTE#${currentDate}#${id}`,
      created: currentDate,
      updated: currentDate,
      type: "NOTE",
      customerId: customerId,
      id: id,
    };

    const putCommand = new PutItemCommand({
      TableName: "leighton-crm-table",
      Item: marshall(newItem, {
        removeUndefinedValues: true,
      }),
    });
    await client.send(putCommand);

    return {
      statusCode: 200,
      body: JSON.stringify(newItem),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric("CreateNoteError", MetricUnit.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(createNoteHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
