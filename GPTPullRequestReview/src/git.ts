/* eslint-disable no-console */
import { SimpleGitOptions, SimpleGit, simpleGit } from 'simple-git';
import * as tl from 'azure-pipelines-task-lib/task';
import binaryExtensions from 'binary-extensions';
import { getFileExtension } from './utils';

const gitOptions: Partial<SimpleGitOptions> = {
    baseDir: `${tl.getVariable('System.DefaultWorkingDirectory')}`,
    binary: 'git',
};

export const git: SimpleGit = simpleGit(gitOptions);

export async function getChangedFiles(targetBranch: string) {
    await git.addConfig('core.pager', 'cat');
    await git.addConfig('core.quotepath', 'false');
    try {
        await git.fetch();
    } catch (err: any) {
        const hint = `
Git fetch failed — this might be because 'persistCredentials: true' is not set in your pipeline.

Make sure your YAML includes:
  - checkout: self
    persistCredentials: true
        `.trim();

        throw new Error(`${err.message}\n\n${hint}`);
    }

    const diffs = await git.diff([targetBranch, '--name-only', '--diff-filter=AM']);
    const files = diffs.split('\n').filter((line) => line.trim().length > 0);

    const relativePaths = files.map((file) => file.trim());

    const nonBinaryFiles = relativePaths.filter(
        (file) => !binaryExtensions.includes(getFileExtension(file))
    );

    console.log(`Changed Files (excluding binary files) : \n ${nonBinaryFiles.join('\n')}`);

    return nonBinaryFiles;
}
