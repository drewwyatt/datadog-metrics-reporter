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

  beforeEach(() => {
    ;(metrics.gauge as jest.Mock).mockReset()
    ;(metrics.histogram as jest.Mock).mockReset()
    ;(logger as jest.Mock).mockReset()
    subject = toMetricsReporter(logger, metrics)
  })

  describe('for jobs', () => {
    const context = toContextFixture()
    const job = toJobFixture()

    beforeEach(() => {
      subject(context, job)
    })

    it('reports gauge metrics without the conclusion', () => {
      const [metricsKey] = getMetricsParams(metrics.gauge, 0)
      expect(metricsKey).not.toContain(job.conclusion)
    })

    it('reports gauge metrics with the conclusion', () => {
      const [metricsKey] = getMetricsParams(metrics.gauge, 1)
      expect(metricsKey).toContain(job.conclusion)
    })

    it('does not report histograms', () => {
      expect(metrics.histogram).not.toHaveBeenCalled()
    })
  })

  describe('for steps', () => {
    const context = toContextFixture()
    const job = toJobFixture()

    job.steps.forEach((step, idx) => {
      describe(`step ${idx}`, () => {
        beforeEach(() => subject(context, job, step))

        it('reports gauge metrics without the conclusion', () => {
          const [metricsKey] = getMetricsParams(metrics.gauge, 0)
          expect(metricsKey).not.toContain(step.conclusion)
        })

        it('reports gauge metrics with the conclusion', () => {
          const [metricsKey] = getMetricsParams(metrics.gauge, 1)
          expect(metricsKey).toContain(step.conclusion)
        })

        it('reports histograms without the conclusion', () => {
          const [metricsKey] = getMetricsParams(metrics.histogram, 0)
          expect(metricsKey).not.toContain(step.conclusion)
        })

        it('reports histograms with the conclusion', () => {
          const [metricsKey] = getMetricsParams(metrics.histogram, 1)
          expect(metricsKey).toContain(step.conclusion)
        })
      })
    })
  })
})
