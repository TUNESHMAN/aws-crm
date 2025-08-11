import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Note } from "../../dto/note/note";
import { unmarshall } from "@aws-sdk/util-dynamodb";
const client = new DynamoDBClient();
export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.pathParameters || !event.pathParameters.id) {
            throw new Error("No noteId provided");
        }

        const noteId = event.pathParameters.id;
        const getCommand = new GetItemCommand({
            TableName: "leighton-crm-table",
            Key: {
                pk: { S: `NOTE#${noteId}` },
                sk: { S: `NOTE#${noteId}` },
            },
        });

        const response = await client.send(getCommand);
        if (!response.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Note not found" }),
            };
        }

        const note = unmarshall(response.Item) as Note;

        return {
            statusCode: 200,
            body: JSON.stringify(note),
        };
    } catch (error) {
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}