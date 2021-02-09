import * as core from '@actions/core'
import * as github from '@actions/github'

const slugify = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/-$/, '')

async function run(): Promise<void> {
  try {
    core.debug('Getting token')
    const token = core.getInput('github-token...', { required: true })
    core.debug('Getting octokit with token...')
    const octokit = github.getOctokit(token)

    const context = github.context

    core.debug('listing jobs for workflow run...')
    const currentRun = await octokit.actions.listJobsForWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId
    })

    core.debug('looping jobs...')
    for (const job of currentRun.data.jobs) {
      for (const step of job.steps) {
        const completedAt: any = new Date(step.completed_at)
        const startedAt: any = new Date(step.started_at)
        const duration = (completedAt - startedAt) / 1000
        core.debug(
          `${slugify(job.name)}.${slugify(step.name)}.${
            step.conclusion
          }: ${duration}s`
        )
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
