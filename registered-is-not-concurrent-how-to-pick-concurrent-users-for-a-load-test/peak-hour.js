import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const LOAD_FACTOR = Number(__ENV.LOAD_FACTOR || 1);

const SESSIONS_PER_MINUTE = 30; // 1,800 sessions in the peak hour
const REQUESTS_PER_SESSION = 30; // about one every 12 seconds

export const options = {
  scenarios: {
    peak_hour: {
      executor: 'constant-arrival-rate',
      rate: Math.round(SESSIONS_PER_MINUTE * LOAD_FACTOR),
      timeUnit: '1m',
      duration: '20m',
      preAllocatedVUs: Math.ceil(200 * LOAD_FACTOR),
      maxVUs: Math.ceil(400 * LOAD_FACTOR),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    dropped_iterations: ['count==0'],
  },
};

export default function () {
  for (let i = 0; i < REQUESTS_PER_SESSION; i++) {
    const res = http.get(`${BASE_URL}/api/items`);
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(8 + Math.random() * 8); // think time, averages 12 seconds
  }
}
