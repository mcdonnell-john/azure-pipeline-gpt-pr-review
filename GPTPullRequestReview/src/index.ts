import * as tl from 'azure-pipelines-task-lib/task';
import { ClientOptions, OpenAI } from 'openai';
import { deleteExistingComments } from './pr';
import { reviewFile } from './review';
import { getTargetBranchName } from './utils';
import { getChangedFiles } from './git';
import https from 'https';

async function run() {
  try {
    if (tl.getVariable('Build.Reason') !== 'PullRequest') {
      tl.setResult(
        tl.TaskResult.Skipped,
        'This task should be run only when the build is triggered from a Pull Request.'
      );
      return;
    }

    let openai: OpenAI | undefined;
    const supportSelfSignedCertificate = tl.getBoolInput('support_self_signed_certificate');
    const apiKey = tl.getInput('api_key', true);
    const aoiEndpoint = tl.getInput('aoi_endpoint');

    if (apiKey == undefined) {
      tl.setResult(tl.TaskResult.Failed, 'No Api Key provided!');
      return;
    }

    if (aoiEndpoint == undefined) {
      const openAiConfiguration: ClientOptions = {
        apiKey: apiKey,
      };

      openai = new OpenAI(openAiConfiguration);
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
      await reviewFile(targetBranch, fileName, httpsAgent, apiKey, openai, aoiEndpoint);
    }

    tl.setResult(tl.TaskResult.Succeeded, 'Pull Request reviewed.');
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
