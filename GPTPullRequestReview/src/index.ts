import * as tl from 'azure-pipelines-task-lib/task';
import { deleteExistingComments } from './pr';
import { reviewFile } from './review';
import { getTargetBranchName } from './utils';
import { getChangedFiles } from './git';

const SUCCESS_MESSAGE = 'Pull Request reviewed.';

async function run() {
    try {
        if (tl.getVariable('Build.Reason') !== 'PullRequest') {
            tl.setResult(
                tl.TaskResult.Skipped,
                'This task should be run only when the build is triggered from a Pull Request.'
            );
            return;
        }

        const apiKey = tl.getInput('api_key', true);
        const azureOpenAiEndpoint = tl.getInput('azure_openai_endpoint');
        const azureOpenAiDeployment = tl.getInput('azure_openai_deployment');
        const azureOpenAiApiVersion = tl.getInput('azure_openai_api_version');

        if (!apiKey) {
            tl.setResult(tl.TaskResult.Failed, 'No Api Key provided!');
            return;
        }

        if (azureOpenAiEndpoint && !(azureOpenAiDeployment || azureOpenAiApiVersion)) {
            throw new Error(
                'Azure OpenAI endpoint is provided but deployment name and/or api version is missing.'
            );
        }

        const targetBranch = getTargetBranchName();

        if (!targetBranch) {
            tl.setResult(tl.TaskResult.Failed, 'No target branch found!');
            return;
        }

        const filesNames = await getChangedFiles(targetBranch);

        await deleteExistingComments();

        for (const fileName of filesNames) {
            await reviewFile(
                targetBranch,
                fileName,
                apiKey,
                azureOpenAiEndpoint,
                azureOpenAiDeployment,
                azureOpenAiApiVersion
            );
        }

        tl.setResult(tl.TaskResult.Succeeded, SUCCESS_MESSAGE);
    } catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

if (require.main === module) {
    run();
}
