import metrics from 'datadog-metrics'
import { toMetricsReporter } from '../src/utils'
import { toContextFixture, toJobFixture } from './fixtures'

jest.mock('datadog-metrics', () => ({
  gauge: jest.fn(),
  histogram: jest.fn(),
}))

describe('toMetricsReporter', () => {
  const logger = jest.fn()
  let subject: ReturnType<typeof toMetricsReporter>

  beforeEach(() => {
    ;(metrics.gauge as jest.Mock).mockReset()
    ;(metrics.histogram as jest.Mock).mockReset()
    ;(logger as jest.Mock).mockReset()
    subject = toMetricsReporter(logger, metrics)
  })

  it('calls logger', () => {
    subject(toContextFixture(), toJobFixture())
    expect(logger).toHaveBeenCalled()
  })
})
