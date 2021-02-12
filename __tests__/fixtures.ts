import faker from 'faker'
import type { Context, Job } from '../src/utils'

const toEventName = () =>
  faker.random.arrayElement(['pull_request', 'push', 'schedule'] as const)
const toName = () =>
  faker.lorem.words(faker.random.number(5)).split(' ').join('_')
const toConclusion = () =>
  faker.random.arrayElement([
    'action_required',
    'cancelled',
    'failure',
    'neutral',
    'success',
    'skipped',
    'stale',
    'timed_out',
  ] as const)
const toId = () => faker.random.number(9999)
const toStatus = () =>
  faker.random.arrayElement(['queued', 'in_progress', 'completed'] as const)

export const toContextFixture = (overrides: Partial<Context> = {}): Context => {
  const owner = faker.internet.userName()
  const repo = faker.random.words(faker.random.number(5))
  return {
    payload: {}, // ?
    action: '', // ?
    eventName: toEventName(),
    workflow: toName(),
    sha: faker.git.commitSha(),
    ref: faker.git.branch(),
    actor: faker.internet.userAgent(),
    job: toName(),
    runNumber: faker.random.number(9999),
    runId: toId(),
    issue: {
      owner,
      repo,
      number: faker.random.number(9999),
    },
    repo: {
      owner,
      repo,
    },
    ...overrides,
  }
}

export const toJobFixture = (overrides: Partial<Job> = {}): Job => ({
  conclusion: toConclusion(),
  id: toId(),
  check_run_url: faker.internet.url(),
  status: toStatus(),
  run_id: toId(),
  run_url: faker.internet.url(),
  node_id: faker.internet.userName(),
  head_sha: faker.git.commitSha(),
  steps: [],
  name: toName(),
  url: faker.internet.url(),
  html_url: faker.internet.url(),
  started_at: '2021-02-11T06:36:05.147Z',
  completed_at: '2021-02-11T06:46:05.147Z',
  ...overrides,
})

export type { Context, Job }
