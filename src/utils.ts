import type * as github from '@actions/github'
import type metrics from 'datadog-metrics'

type UnwrapPromise<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never

type Octokit = ReturnType<typeof github['getOctokit']>
type WorkflowRun = UnwrapPromise<
  ReturnType<Octokit['actions']['listJobsForWorkflowRun']>
>

type Context = typeof github.context
type Job = WorkflowRun['data']['jobs'][number]
type Step = Job['steps'][number]
type Subject = Job | Step
type Reporter = typeof metrics

const slugify = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '_and_')
    .replace(/[\s\W-]+/g, '_')
    .replace(/_$/, '')

const notNil = (Boolean as any) as <T>(
  nullable: T,
) => nullable is NonNullable<T>

const toMetricKey = (keys: (string | undefined)[]) =>
  keys.filter(notNil).map(slugify).join('.')

const toDuration = (subject: Subject) => {
  const completedAt: any = new Date(subject.completed_at)
  const startedAt: any = new Date(subject.started_at)
  return (completedAt - startedAt) / 1000
}

const toTags = ({ eventName }: Context, { conclusion }: Subject) =>
  [`event_name:${eventName}`, `conclusion:${conclusion}`] as const

const toMetricsHandler = (log: (item: string) => void, report: Reporter) => (
  metricType: 'gauge' | 'histogram',
  {
    conclusion,
    duration,
    namespace,
    tags,
  }: {
    conclusion: string
    duration: number
    namespace: (string | undefined)[]
    tags: string[] | readonly string[]
  },
) => {
  const baseKey = toMetricKey(namespace)
  const keyWithConclusion = toMetricKey([baseKey, conclusion])

  log(`(${metricType}) ${baseKey}: ${duration} [${tags}]`)
  log(`(${metricType}) ${keyWithConclusion}: ${duration} [${tags}]`)

  report[metricType](baseKey, duration, tags as string[])
  report[metricType](keyWithConclusion, duration, tags as string[])
}

export const toMetricsReporter = (
  logger: (item: string) => void,
  reporter: Reporter,
) => (context: Context, job: Job, step?: Step) => {
  const subject = step ?? job
  if (subject.conclusion) {
    const handleMetric = toMetricsHandler(logger, reporter)

    const tags = toTags(context, subject)
    const duration = toDuration(subject)

    handleMetric('gauge', {
      conclusion: subject.conclusion,
      namespace: [context.repo.repo, job.name, step?.name],
      duration,
      tags,
    })

    if (step) {
      handleMetric('histogram', {
        conclusion: subject.conclusion,
        namespace: [context.repo.repo, job.name, 'steps'],
        duration,
        tags,
      })
    }
  }
}
