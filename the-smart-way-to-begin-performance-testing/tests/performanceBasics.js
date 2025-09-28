import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    normal_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

let token;

export function setup() {
  const res = http.post(
    `${__ENV.BASE_URL}/api/login`,
    JSON.stringify({
      username: __ENV.USER,
      password: __ENV.PASS,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const data = res.json();
  token = data.token;
  return { token };
}

export default function (data) {
  // Simulate a traffic mix: 80% search, 15% detail, 5% checkout
  const rnd = Math.random();
  const headers = { Authorization: `Bearer ${data.token}` };

  if (rnd < 0.8) {
    const res = http.get(`${__ENV.BASE_URL}/api/search?q=k6`, { headers });
    check(res, { "search ok": (r) => r.status === 200 });
  } else if (rnd < 0.95) {
    const res = http.get(`${__ENV.BASE_URL}/api/items/1`, { headers });
    check(res, { "detail ok": (r) => r.status === 200 });
  } else {
    const res = http.post(`${__ENV.BASE_URL}/api/checkout`, {}, { headers });
    check(res, { "checkout ok": (r) => r.status === 404 }); // checkout not implemented
  }

  sleep(1);
}
