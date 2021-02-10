import * as core from '@actions/core'
import * as github from '@actions/github'
import metrics from 'datadog-metrics'
import { DATADOG_API_KEY, GITHUB_TOKEN } from './env'
import { toMetricsReporter } from './utils'

async function run(): Promise<void> {
  try {
    core.debug('getting octokit with token...')
    const context = github.context
    const octokit = github.getOctokit(GITHUB_TOKEN)

    core.debug('setting up datadog client...')
    metrics.init({ apiKey: DATADOG_API_KEY })

    core.debug('listing jobs for workflow run...')
    const currentRun = await octokit.actions.listJobsForWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId,
    })

    core.debug('creating metrics reporter...')
    const report = toMetricsReporter(core.info, metrics)

    core.startGroup('metrics')
    for (const job of currentRun.data.jobs) {
      report(context, job)
      for (const step of job.steps) {
        report(context, job, step)
      }
    }
    core.endGroup()

    core.debug('flushing...')
    await new Promise<void>(metrics.flush)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
