import metrics from 'datadog-metrics'
import { toMetricsReporter } from '../src/utils'
import { Context, Job, toContextFixture, toJobFixture } from './fixtures'

jest.mock('datadog-metrics', () => ({
  gauge: jest.fn(),
  histogram: jest.fn(),
}))

const getMetricsParams = (
  metricsFn: typeof metrics['gauge'] | typeof metrics['histogram'],
  callIdx: 0 | 1,
): [key: string, value: number, tags: string[]] =>
  (metricsFn as jest.Mock).mock.calls[callIdx]

describe('toMetricsReporter', () => {
  const logger = jest.fn()
  let subject: ReturnType<typeof toMetricsReporter>
  let context: Context
  let job: Job

  beforeEach(() => {
    context = toContextFixture()
    job = toJobFixture()
    ;(metrics.gauge as jest.Mock).mockReset()
    ;(metrics.histogram as jest.Mock).mockReset()
    ;(logger as jest.Mock).mockReset()
    subject = toMetricsReporter(logger, metrics)
  })

  describe('for jobs', () => {
    beforeEach(() => subject(context, job))

    it('reports gauge metrics with the conclusion', () => {
      const [metricsKey] = getMetricsParams(metrics.gauge, 0)
      expect(metricsKey).not.toContain(job.conclusion)
    })

    it('reports gauge metrics without the conclusion', () => {
      const [metricsKey] = getMetricsParams(metrics.gauge, 1)
      expect(metricsKey).toContain(job.conclusion)
    })

    it('does not report histograms', () => {
      expect(metrics.histogram).not.toHaveBeenCalled()
    })
  })
})
