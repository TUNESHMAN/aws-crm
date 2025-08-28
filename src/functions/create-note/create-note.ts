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
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand,
  ConverseCommandInput,
  ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

const BUCKET_NAME = "leighton-crm-bucket-babs";
const bedrockClient = new BedrockRuntimeClient({});
const tracer = new Tracer();
const metrics = new Metrics({
  serviceName: "leighton-hr",
  namespace: "leighton-hr",
});
const s3 = new S3Client();
const client = new DynamoDBClient();
export const createNoteHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError("No payload body");
    }

    const newNote = JSON.parse(event.body) as CreateNote;

    const customerId = event.pathParameters?.id;
    if (!customerId) throw new Error("No customer ID supplied");
    schemaValidator(schema, newNote);
    let attachmentKey: string | undefined;
    let uploadUrl: string | undefined;
    const id = randomUUID();
    const currentDate = new Date().toISOString();

    // if a filename property exists, we know the consumer wants to upload a file
    if (newNote.filename) {
      attachmentKey = `notes/${customerId}/attachments/${id}/${newNote.filename}`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: attachmentKey,
        ContentType: "application/octet-stream",
      });

      // we allow the upload URL to be used for 5 minutes
      uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    }
    // we generate an AI summary of the notes using a user prompt
    const input: ConverseCommandInput = {
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: [
        {
          role: ConversationRole.USER,
          content: [
            {
              text: `Summarise the following text with around 5-8 concise key non-technical bullet points, that need to be known for a CRM solution: ${newNote.content}`,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.9,
        topP: 0.9,
      },
    };
    const command = new ConverseCommand(input);
    const response: ConverseCommandOutput = await bedrockClient.send(command);

    const summary = (response.output?.message?.content as any[])[0]?.text || "";
    const newItem: Note = {
      ...newNote,
      pk: `CUSTOMER#${customerId}`,
      sk: `NOTE#${currentDate}#${id}`,
      created: currentDate,
      updated: currentDate,
      type: "NOTE",
      customerId,
      id,
      attachmentKey,
      summary,
    };

    const putCommand = new PutItemCommand({
      TableName: "leighton-crm-table",
      Item: marshall(newItem, {
        removeUndefinedValues: true,
      }),
    });
    await client.send(putCommand);
    logger.info(`Note ${id} created for customer ${customerId}.`);

    metrics.addMetric("SuccessfulCreateNote", MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify({ ...newNote, id, uploadUrl, summary }),
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
