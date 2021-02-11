import type { Context, Job } from '../src/utils'

export const toContextFixture = (
  overrides: Partial<Context> = {},
): Context => ({
  payload: {},
  eventName: 'pull_request',
  workflow: 'build_test',
  sha: '123abc',
  ref: 'main',
  action: '',
  actor: 'drewwyatt',
  job: '',
  runNumber: 123,
  runId: 321,
  issue: {
    owner: 'drewwyatt',
    repo: 'datadog_metrics_reporter',
    number: 42,
  },
  repo: {
    owner: 'drewwyatt',
    repo: 'datadog_metrics_reporter',
  },
  ...overrides,
})

export const toJobFixture = (overrides: Partial<Job> = {}): Job => ({
  conclusion: 'completed',
  id: 123,
  check_run_url: 'https://check_run_url.fixture',
  status: 'completed',
  run_id: 321,
  run_url: 'https://run_url.fixture',
  node_id: 'some-node-id',
  head_sha: '123abc',
  steps: [],
  name: 'some-job-fixture',
  url: 'https://url.fixture',
  html_url: 'https://html_url.fixture',
  started_at: '2021-02-11T06:36:05.147Z',
  completed_at: '2021-02-11T06:46:05.147Z',
  ...overrides,
})
