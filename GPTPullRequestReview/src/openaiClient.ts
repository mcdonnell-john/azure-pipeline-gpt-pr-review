import { OpenAI, AzureOpenAI } from 'openai';
export function createOpenAIClient(
    apiKey: string,
    azureOpenAiEndpoint?: string,
    azureOpenAiDeployment?: string
) {
    if (azureOpenAiEndpoint) {
        if (!azureOpenAiDeployment) {
            throw new Error('Azure OpenAI endpoint provided but deployment name missing.');
        }
        return new AzureOpenAI({
            apiKey,
            endpoint: azureOpenAiEndpoint,
            deployment: azureOpenAiDeployment,
        });
    } else {
        return new OpenAI({ apiKey });
    }
}
