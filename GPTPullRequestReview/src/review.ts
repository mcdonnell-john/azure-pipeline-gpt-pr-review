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
    console.log(`Start reviewing ${fileName} ...`);

    const defaultOpenAIModel = 'gpt-4o';
    const patch = await git.diff([targetBranch, '--', fileName]);

    const defaultSystemPrompt = `Act as a code reviewer of a Pull Request, providing feedback on possible bugs and clean code issues.
        You are provided with the Pull Request changes in a patch format.
        Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.

        As a code reviewer, your task is:
                - Review only added, edited or deleted lines.
                - If there's no bugs and the changes are correct, write only 'No feedback.'
                - If there's bug or uncorrect code changes, don't write 'No feedback.'`;

    try {
        const systemPrompt = tl.getInput('systemPrompt') || defaultSystemPrompt;
        const model = tl.getInput('model') || defaultOpenAIModel;

        const client = createOpenAIClient(
            apiKey,
            azureOpenAiEndpoint,
            azureOpenAiDeployment,
            azureOpenAiApiVersion
        );

        const params: ChatCompletionCreateParamsNonStreaming = {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: patch },
            ],
            max_tokens: 500,
            model: azureOpenAiEndpoint ? (azureOpenAiDeployment as string) : (model as string),
        };
        console.log(`Message to send: ${JSON.stringify(params)}`);

        const response = await client.chat.completions.create(params);

        const choices = response.choices;

        if (choices && choices.length > 0) {
            const review = choices[0].message?.content as string;

            if (review.trim() !== 'No feedback.') {
                await addCommentToPR(fileName, review);
            }
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
