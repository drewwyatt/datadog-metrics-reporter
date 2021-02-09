import { getInput } from '@actions/core'
import { config } from 'dotenv'
config()

export const DATADOG_API_KEY = getInput('datadog-api-key', { required: true })
export const GITHUB_TOKEN = getInput('github-token', { required: true })
