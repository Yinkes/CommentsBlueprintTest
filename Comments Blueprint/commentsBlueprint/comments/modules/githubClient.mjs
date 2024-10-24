

    // githubClient.mjs
    import { Octokit } from '@octokit/rest';

    const GITHUB_TOKEN = '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';

    // Initialize GitHub Octokit
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    export default octokit;
