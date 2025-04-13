import * as tl from 'azure-pipelines-task-lib/task';
import { deleteExistingComments } from './pr';
import { reviewFile } from './review';
import { getTargetBranchName } from './utils';
import { getChangedFiles } from './git';
import https from 'https';

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

        const supportSelfSignedCertificate = tl.getBoolInput('support_self_signed_certificate');
        const apiKey = tl.getInput('api_key', true);
        const azureOpenAiEndpoint = tl.getInput('azure_openai_endpoint');
        const azureOpenAiDeployment = tl.getInput('azure_openai_deployment');

        if (!apiKey) {
            tl.setResult(tl.TaskResult.Failed, 'No Api Key provided!');
            return;
        }

        if (azureOpenAiEndpoint && !azureOpenAiDeployment) {
            throw new Error('Azure OpenAI endpoint is provided but deployment name is missing.');
        }

        const httpsAgent = new https.Agent({
            rejectUnauthorized: !supportSelfSignedCertificate,
        });

        const targetBranch = getTargetBranchName();

        if (!targetBranch) {
            tl.setResult(tl.TaskResult.Failed, 'No target branch found!');
            return;
        }

        const filesNames = await getChangedFiles(targetBranch);

        await deleteExistingComments(httpsAgent);

        for (const fileName of filesNames) {
            await reviewFile(
                targetBranch,
                fileName,
                httpsAgent,
                apiKey,
                azureOpenAiEndpoint,
                azureOpenAiDeployment
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
