import * as core from '@actions/core'
import * as github from '@actions/github'
import metrics from 'datadog-metrics'
import { DATADOG_API_KEY, GITHUB_TOKEN } from './env'

const slugify = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '_and_')
    .replace(/[\s\W-]+/g, '_')
    .replace(/_$/, '')

const toMetric = (keys: string[]) => keys.filter(Boolean).map(slugify).join('.')

const reportMetrics = (context: any, job: any, step?: any) => {
  const subject = step ?? job
  if (subject.conclusion) {
    const tags = [
      `event_name:${context.eventName}`,
      `conclusion:${subject.conclusion}`
    ]
    const completedAt: any = new Date(subject.completed_at)
    const startedAt: any = new Date(subject.started_at)
    const duration = (completedAt - startedAt) / 1000

    const namespace = [context.repo.repo, job.name, step?.name]

    core.info(`${toMetric(namespace)}: ${tags}]`)
    core.info(`${toMetric([...namespace, subject.conclusion])}: ${tags}`)

    // TODO: get rid of this
    if (step) {
      metrics.gauge(toMetric(namespace), duration, tags)
      metrics.gauge(
        toMetric([...namespace, subject.conclusion]),
        duration,
        tags
      )
    } else {
      metrics.histogram(toMetric(namespace), duration, tags)
      metrics.histogram(
        toMetric([...namespace, subject.conclusion]),
        duration,
        tags
      )
    }
  }
}

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
      reportMetrics(context, job)

      for (const step of job.steps) {
        reportMetrics(context, job, step)
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
