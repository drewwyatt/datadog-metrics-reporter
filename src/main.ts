import * as core from '@actions/core'
import * as github from '@actions/github'
import metrics from 'datadog-metrics'
import { DATADOG_API_KEY, GITHUB_TOKEN } from './env'

const slugify = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/-$/, '')

const toMetric = (...keys: string[]) => keys.map(slugify).join('.')

async function run(): Promise<void> {
  try {
    core.debug('Getting octokit with token...')
    const context = github.context
    const octokit = github.getOctokit(GITHUB_TOKEN)

    core.debug('setting up datadog client')
    metrics.init({ apiKey: DATADOG_API_KEY })

    core.debug('listing jobs for workflow run...')
    const currentRun = await octokit.actions.listJobsForWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId
    })

    core.startGroup('metrics')
    for (const job of currentRun.data.jobs) {
      for (const step of job.steps) {
        if (step.conclusion) {
          const completedAt: any = new Date(step.completed_at)
          const startedAt: any = new Date(step.started_at)
          const duration = (completedAt - startedAt) / 1000
          const metric = toMetric(
            context.repo.repo,
            context.workflow,
            job.name,
            step.name,
            step.conclusion
          )

          core.info(`${metric}: ${duration} [${context.eventName}]`)
          metrics.gauge(metric, duration, [context.eventName])
        }
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
