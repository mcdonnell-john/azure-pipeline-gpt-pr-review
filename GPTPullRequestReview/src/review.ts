/* eslint-disable no-console */
import { git } from './git';
import { addCommentToPR } from './pr';
import * as tl from 'azure-pipelines-task-lib/task';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { createOpenAIClient } from './openaiClient';

export async function reviewFile(
    targetBranch: string,
    fileName: string,
    apiKey: string,
    azureOpenAiEndpoint: string | undefined,
    azureOpenAiDeployment: string | undefined,
    azureOpenAiApiVersion: string | undefined
) {
    console.log(`Start reviewing1 ${fileName} ...`);

    const defaultOpenAIModel = 'gpt-4o';
    const patch = await git.diff([targetBranch, '--', fileName]);

    const defaultSystemPrompt = `Act as a code reviewer of a Pull Request, providing feedback on possible bugs and clean code issues.
        You are provided with the Pull Request changes in a patch format.
        Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.

        As a code reviewer, your task is:
                - Review only added, edited or deleted lines.
                - If there's no bugs and the changes are correct, write only 'No feedback.'
                - If there's bug or uncorrect code changes, don't write 'No feedback.'`;

    const systemPrompt = tl.getInput('systemPrompt') || defaultSystemPrompt;

    const conversationHistory = [{ role: 'system', content: systemPrompt }];

    try {
        const model = tl.getInput('model') || defaultOpenAIModel;

        const client = createOpenAIClient(
            apiKey,
            azureOpenAiEndpoint,
            azureOpenAiDeployment,
            azureOpenAiApiVersion
        );

        console.log(`Using patch: ${patch}`);

        const diffLines = parseDiff(patch);

        for (const { lineNumber, diffChunk } of diffLines) {
            conversationHistory.push({ role: 'user', content: diffChunk });

            console.log(`Reviewing lines ${lineNumber} in ${fileName}...`);
            console.log(`Diff chunk: ${diffChunk}`);
            console.log(`Conversation history: ${JSON.stringify(conversationHistory)}`);

            const feedback = await getOpenAIFeedback(conversationHistory, client, model);

            console.log(`Feedback: ${feedback}`);

            if (feedback.trim() !== 'No feedback.') {
                await addCommentToPR(fileName, feedback, lineNumber);
            }

            conversationHistory.push({ role: 'assistant', content: feedback });
        }

        console.log(`Review of ${fileName} completed.`);
    } catch (error: any) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
}

// Function to parse the diff and extract line numbers and diff chunks
function parseDiff(diff: string): { lineNumber: number; diffChunk: string }[] {
    const diffLines = diff.split('\n');
    const parsedChunks: { lineNumber: number; diffChunk: string }[] = [];

    // Regular expression to match the diff lines with `@@ -start, length +start, length @@`
    const diffRegex = /^@@ -(\d+),\d+ \+(\d+),\d+ @@/;

    let currentDiff: string | undefined;
    let startLineNumber: number | undefined;

    diffLines.forEach((line) => {
        const match = line.match(diffRegex);
        if (match) {
            if (currentDiff) {
                parsedChunks.push({ lineNumber: startLineNumber!, diffChunk: currentDiff });
            }

            // Start of a new diff chunk, get the line number
            startLineNumber = parseInt(match[2], 10); // Start line in the new version
            currentDiff = ''; // Reset the current diff text
        } else if (line.startsWith('+') || line.startsWith('-')) {
            // Collect only the lines that are modified (added or deleted)
            currentDiff += line + '\n';
        }
    });

    if (currentDiff) {
        parsedChunks.push({ lineNumber: startLineNumber!, diffChunk: currentDiff });
    }

    console.log(`Parsed diff chunks: ${JSON.stringify(parsedChunks)}`);

    return parsedChunks;
}

async function getOpenAIFeedback(
    conversationHistory: any[],
    client: any,
    model: string
): Promise<string> {
    const params: ChatCompletionCreateParamsNonStreaming = {
        messages: conversationHistory,
        max_tokens: 500,
        model: model,
    };

    const response = await client.chat.completions.create(params);
    const choices = response.choices;

    if (choices && choices.length > 0) {
        return choices[0].message?.content as string;
    }

    return 'No feedback';
}
