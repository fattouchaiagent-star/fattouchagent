export const jobSources = [
  { id: 'jobs-for-lebanon', name: 'Jobs for Lebanon', url: 'https://www.jobsforlebanon.com/', coverage: 'لبنان والعمل عن بعد', priority: 1 },
  { id: 'hirelebanese', name: 'Hire Lebanese', url: 'https://www.hirelebanese.com/', coverage: 'لبنان واللبنانيون حول العالم', priority: 2 },
  { id: 'bayt-lebanon', name: 'Bayt Lebanon', url: 'https://www.bayt.com/en/lebanon/jobs/', coverage: 'لبنان', priority: 3 },
  { id: 'tanqeeb-lebanon', name: 'Tanqeeb Lebanon', url: 'https://lebanon.tanqeeb.com/', coverage: 'لبنان', priority: 4 },
  { id: 'jobslebanon', name: 'JobsLebanon', url: 'https://jobslebanon.com/', coverage: 'لبنان', priority: 5 },
  { id: 'mustakbil-lebanon', name: 'Mustakbil Lebanon', url: 'https://lb.mustakbil.com/', coverage: 'لبنان والعمل عن بعد', priority: 6 },
];

export function searchJobSources(query = '') {
  return jobSources.map(source => ({ ...source, query, status: 'ready_for_fetch' }));
}
