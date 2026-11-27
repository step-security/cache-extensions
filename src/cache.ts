import {exec} from '@actions/exec';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as spu from 'setup-php/lib/utils.js';
import {existsSync, realpathSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as utils from './utils.js';
import fs from 'fs';
import axios, {isAxiosError} from 'axios';

async function validateSubscription() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let repoPrivate: boolean | undefined;

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    repoPrivate = eventData?.repository?.private;
  }

  const upstream = 'shivammathur/cache-extensions';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false)
    core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body: Record<string, string> = {action: action || ''};
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`
      );
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`
      );
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}

const DEPENDENCY_CACHE_DIR = 'deps';
const DEPENDENCY_CACHE_PLATFORMS = new Set<NodeJS.Platform>([
  'darwin',
  'linux'
]);
const SKIP_DEPENDENCY_CACHE_VERSIONS = /^5\.[3-5]$/;

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeModulePath(path: string): string {
  const resolvedPath = resolve(path);

  return existsSync(resolvedPath) ? realpathSync(resolvedPath) : resolvedPath;
}

export function shouldHandleDependencies(
  version: string,
  platform: NodeJS.Platform = process.platform
): boolean {
  return (
    !SKIP_DEPENDENCY_CACHE_VERSIONS.test(version) &&
    DEPENDENCY_CACHE_PLATFORMS.has(platform)
  );
}

/**
 * Handle dependencies
 *
 * @param extensions
 * @param version
 * @param platform
 */
export async function handleDependencies(
  extensions: string,
  version: string,
  platform: NodeJS.Platform = process.platform
): Promise<void> {
  if (!shouldHandleDependencies(version, platform)) {
    return;
  }

  const cacheKey = `${await utils.getOutput('key')}-deps`;
  const cacheDir = join(
    await spu.readEnv('RUNNER_TOOL_CACHE'),
    DEPENDENCY_CACHE_DIR
  );
  const cacheHit = await cache.restoreCache([cacheDir], cacheKey, [cacheKey]);
  const dependencyScript = utils.scriptCall(
    'dependencies',
    utils.stripExtensionVersions(extensions),
    version
  );

  await exec(dependencyScript.command, dependencyScript.args);

  if (cacheHit || !existsSync(cacheDir)) {
    return;
  }

  try {
    await cache.saveCache([cacheDir], cacheKey);
  } catch {
    await cache.saveCache([cacheDir], `${cacheKey}-take-2`);
  }
}

/**
 * Run the script
 */
export async function run(): Promise<void> {
  await validateSubscription();
  try {
    const version = await spu.parseVersion(await spu.readPHPVersion());
    const extensions = utils.filterExtensions(
      await spu.getInput('extensions', true)
    );
    const key = await spu.getInput('key', true);
    const shareCacheAcrossJobs =
      (await spu.readEnv('share-cache-across-jobs')) === 'true'
        ? 'true'
        : 'false';
    const shareCacheAcrossWorkflows =
      (await spu.readEnv('share-cache-across-workflows')) === 'true'
        ? 'true'
        : 'false';
    const dataScript = utils.scriptCall(
      'data',
      extensions,
      version,
      key,
      shareCacheAcrossJobs,
      shareCacheAcrossWorkflows
    );

    await exec(dataScript.command, dataScript.args);
    await handleDependencies(extensions, version);
  } catch (error) {
    core.setFailed(getErrorMessage(error));
  }
}

export async function main(
  runAction: () => Promise<void> = run
): Promise<void> {
  try {
    await runAction();
  } catch (error) {
    const message = getErrorMessage(error);

    if (error instanceof cache.ValidationError) {
      core.setFailed(message);
      return;
    }

    if (error instanceof cache.ReserveCacheError) {
      core.info(message);
      return;
    }

    core.warning(message);
  }
}

export function isMainModule(
  argv1: string | undefined = process.argv[1],
  moduleUrl: string = import.meta.url
): boolean {
  return (
    !!argv1 &&
    normalizeModulePath(argv1) === normalizeModulePath(fileURLToPath(moduleUrl))
  );
}

export async function bootstrap(
  argv1: string | undefined = process.argv[1],
  moduleUrl: string = import.meta.url,
  runAction: () => Promise<void> = main
): Promise<void> {
  if (isMainModule(argv1, moduleUrl)) {
    await runAction();
  }
}

await bootstrap();
