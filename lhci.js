const execSync = require('child_process').execSync;
const rimraf = require('rimraf');
const glob = require('glob');
const { readFileSync, writeFileSync } = require('fs');
const argv = require('yargs').argv;

const url = argv.url;
const numberOfRuns = argv.numberOfRuns || 5;

if (!url) {
  throw new Error('Missing url argument');
}

console.log('Cleaning .lighthouseci...');
rimraf.sync('.lighthouseci/');

console.log(`Starting lhci for: ${url} with ${numberOfRuns} numbers of runs.`);

try {
  let options = { stdio: 'pipe' };
  execSync(`npm run lhci -- --collect.numberOfRuns=${numberOfRuns} --collect.url=${url}`, options);
} catch (error) {}

const filterImportantsAudits = (fromFile) => {
  const results = [];
  const metricFilter = [
    'first-contentful-paint',
    'first-meaningful-paint',
    'speed-index',
    'estimated-input-latency',
    'total-blocking-time',
    'max-potential-fid',
    'time-to-first-byte',
    'first-cpu-idle',
    'interactive',
  ];

  for (let auditObj in fromFile['audits']) {
    if (metricFilter.includes(auditObj)) {
      results.push(fromFile['audits'][auditObj]);
    }
  }

  return results;
};

const readJSONFile = (filePath) => JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));

const jsonReports = glob(`.lighthouseci/lhr-*.json`, {
  sync: true,
});

const isInSecond = (displayValue) => displayValue.split(' ')[1] === 's';
const isInMS = (displayValue) => displayValue.split(' ')[1] === 'ms';
const inSeconds = (numericValue) => (numericValue / 1000).toFixed(2);
const inMS = (numericValue) => numericValue.toFixed(2);

const results = jsonReports
  .map((jsonFile) => filterImportantsAudits(readJSONFile(jsonFile)))
  .flat()
  .reduce((arr, current) => {
    const currentAudit = arr.find((audit) => audit.id === current.id);
    if (!currentAudit) {
      const acc = Object.assign({}, current);
      arr.push(acc);
    } else {
      currentAudit.score += current.score;
      currentAudit.numericValue += current.numericValue;
    }

    return arr;
  }, [])
  .map((audit, index) => {
    if (!index) {
      console.log('Calculating media of the runs');
    }
    audit.score = audit.score / numberOfRuns;
    audit.numericValue = audit.numericValue / numberOfRuns;

    if (isInSecond(audit.displayValue)) {
      audit.displayValue = inSeconds(audit.numericValue) + ' s';
    } else if (isInMS(audit.displayValue)) {
      audit.displayValue = inMs(audit.numericValue) + ' ms';
    }

    return audit;
  });

console.log('Writing results at .lighthouseci/results.json');

writeFileSync('.lighthouseci/results.json', JSON.stringify(results, null, 2));
