/* eslint-disable no-console */
import * as azdev from 'azure-devops-node-api';
import * as GitApi from 'azure-devops-node-api/GitApi';
import * as GitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces';
import * as tl from 'azure-pipelines-task-lib/task';

export async function addCommentToPR(
    filePath: string,
    commentText: string
): Promise<number | undefined> {
    const project = tl.getVariable('SYSTEM.TEAMPROJECT')!;
    const repoName = tl.getVariable('Build.Repository.Name')!;
    const prId = parseInt(tl.getVariable('System.PullRequest.PullRequestId')!, 10);

    const webApi = getWebApi();
    const git: GitApi.IGitApi = await webApi.getGitApi();

    const thread: GitInterfaces.GitPullRequestCommentThread = {
        status: 1,
        threadContext: {
            filePath,
        },
        comments: [
            {
                content: commentText,
                commentType: 1,
            },
        ],
    };

    const createdThread = await git.createThread(thread, repoName, prId, project);
    console.log(`Added comment to ${filePath}. Thread ID: ${createdThread.id}`);
    return createdThread.id;
}

export async function deleteExistingComments(): Promise<void> {
    console.log('Start deleting existing comments added by the previous Job ...');

    const project = tl.getVariable('SYSTEM.TEAMPROJECT')!;
    const repoName = tl.getVariable('Build.Repository.Name')!;
    const prId = parseInt(tl.getVariable('System.PullRequest.PullRequestId')!, 10);

    const webApi = getWebApi();
    const git: GitApi.IGitApi = await webApi.getGitApi();

    const threads = await git.getThreads(repoName, prId, project);
    const collectionUri = tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')!;
    const collectionName = getCollectionName(collectionUri);
    const buildServiceName = `${project} Build Service (${collectionName})`;

    for (const thread of threads) {
        if (!thread.threadContext || !thread.id) continue;

        const comments = await git.getComments(repoName, prId, thread.id, project);

        for (const comment of comments) {
            if (comment.author?.displayName === buildServiceName && comment.id != null) {
                await git.deleteComment(repoName, prId, thread.id, comment.id, project);
                console.log(`Deleted comment ID ${comment.id} in thread ${thread.id}`);
            }
        }
    }

    console.log('Existing comments deleted.');
}

function getWebApi(): azdev.WebApi {
    const orgUrl = tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')!;
    const token = tl.getVariable('SYSTEM.ACCESSTOKEN')!;
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    return new azdev.WebApi(orgUrl, authHandler);
}

function getCollectionName(collectionUri: string): string {
    const cleanUri = collectionUri.replace(/^https?:\/\//, '');
    return cleanUri.includes('.visualstudio.')
        ? cleanUri.split('.visualstudio.')[0]
        : cleanUri.split('/')[1];
}
