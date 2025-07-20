import asyncio
import aiohttp
import time
from collections import defaultdict


class RateLimitStressTester:
    def __init__(self, base_url, endpoint="/api/data"):
        self.base_url = base_url
        self.endpoint = endpoint
        self.results = []

    async def send_concurrent_requests(self, client_id, num_requests=20,
                                       concurrent_batch_size=10):
        """
        Send requests in highly concurrent batches to maximize race condition chances
        """
        print(f"Sending {num_requests} requests for {client_id} in batches of {concurrent_batch_size}")

        async with aiohttp.ClientSession() as session:
            # Send requests in tight concurrent batches
            for batch_start in range(0, num_requests, concurrent_batch_size):
                batch_size = min(concurrent_batch_size,
                                 num_requests - batch_start)

                print(f"  Sending batch {batch_start // concurrent_batch_size + 1}: {batch_size} concurrent requests")

                # Create all requests simultaneously
                tasks = []
                for i in range(batch_size):
                    task = self.make_request(session, client_id,
                                             batch_start + i)
                    tasks.append(task)

                # Execute them all at once
                batch_results = await asyncio.gather(*tasks)
                self.results.extend(batch_results)

                # Small delay between batches to ensure they're distinct
                await asyncio.sleep(0.05)

    async def make_request(self, session, client_id, request_num):
        headers = {"X-Client-ID": client_id}
        start_time = time.time()

        try:
            async with session.get(f"{self.base_url}{self.endpoint}",
                                   headers=headers) as response:
                end_time = time.time()
                return {
                    "request_num": request_num,
                    "client_id": client_id,
                    "status_code": response.status,
                    "response_time": end_time - start_time,
                    "timestamp": start_time
                }
        except Exception as e:
            return {
                "request_num": request_num,
                "client_id": client_id,
                "status_code": "ERROR",
                "error": str(e),
                "response_time": time.time() - start_time,
                "timestamp": start_time
            }

    def analyze_rate_limit_behavior(self, expected_limit=10, window_seconds=60):
        """
        Analyze results to detect rate limiting failures
        """
        print(f"\nAnalyzing rate limit behavior...")
        print(f"Expected limit: {expected_limit} requests per {window_seconds} seconds")

        # Group by client and sort by timestamp
        clients = defaultdict(list)
        for result in self.results:
            clients[result["client_id"]].append(result)

        violations = []

        for client_id, requests in clients.items():
            requests.sort(key=lambda x: x["timestamp"])
            successful_requests = [r for r in requests if r["status_code"] == 200]

            print(f"\nClient {client_id}:")
            print(f"  Total requests: {len(requests)}")
            print(f"  Successful (200): {len(successful_requests)}")
            print(f"  Rate limited (429): {len([r for r in requests if r['status_code'] == 429])}")

            if successful_requests:
                # Check if we exceeded the limit in any 60-second window
                max_in_window = 0
                violation_found = False

                for i, request in enumerate(successful_requests):
                    window_start = request["timestamp"]
                    window_end = window_start + window_seconds

                    # Count requests in this window
                    window_requests = [
                        r for r in successful_requests
                        if window_start <= r["timestamp"] < window_end
                    ]

                    current_window_count = len(window_requests)
                    max_in_window = max(max_in_window, current_window_count)

                    # Only report one violation per client (the worst one)
                    if current_window_count > expected_limit and not violation_found:
                        violations.append({
                            "client_id": client_id,
                            "window_start": window_start,
                            "expected_limit": expected_limit,
                            "actual_count": current_window_count,
                            "violation_amount": current_window_count - expected_limit
                        })
                        violation_found = True

                print(f"  Max requests in any {window_seconds}s window: {max_in_window}")
                if max_in_window > expected_limit:
                    print(f"VIOLATION: Exceeded limit by {max_in_window - expected_limit}")
                else:
                    print(f"No violations detected")

        return violations

    def run_test(self, client_ids=["client1", "client2"], requests_per_client=15):
        """
        Execute the stress test and return analysis
        """
        print("=" * 60)
        print("RATE LIMIT RACE CONDITION STRESS TEST")
        print("=" * 60)
        print(f"Target: {self.base_url}{self.endpoint}")
        print(f"Clients: {client_ids}")
        print(f"Requests per client: {requests_per_client}")
        print(f"Expected rate limit: 10 requests/minute per client")
        print("-" * 60)

        async def run_all_clients():
            tasks = []
            for client_id in client_ids:
                task = self.send_concurrent_requests(client_id, requests_per_client,
                                                     concurrent_batch_size=8)
                tasks.append(task)
            await asyncio.gather(*tasks)

        # Run the test
        start_time = time.time()
        asyncio.run(run_all_clients())
        total_time = time.time() - start_time

        print(f"\nTest completed in {total_time:.2f} seconds")

        # Analyze results
        violations = self.analyze_rate_limit_behavior()

        # Print final summary
        successful_responses = len([r for r in self.results if r["status_code"] == 200])
        rate_limited_responses = len([r for r in self.results if r["status_code"] == 429])

        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        print(f"Total requests sent: {len(self.results)}")
        print(f"Successful responses (200): {successful_responses}")
        print(f"Rate limited responses (429): {rate_limited_responses}")
        print(f"Test duration: {total_time:.2f} seconds")
        print(f"Rate limit violations: {len(violations)}")

        if violations:
            print("\nRACE CONDITION DETECTED!")
            print("The following violations indicate race conditions in the rate limiter:")
            for violation in violations:
                print(f"  - Client {violation['client_id']}: "
                      f"{violation['actual_count']} requests allowed "
                      f"(expected max: {violation['expected_limit']}, "
                      f"excess: {violation['violation_amount']})")
            print("\nThis means multiple requests bypassed the rate limit due to concurrent access!")
        else:
            print("\nNo rate limit violations detected.")
            print("The rate limiter appears to be working correctly under concurrent load.")

        return {
            "total_requests": len(self.results),
            "successful_requests": successful_responses,
            "rate_limited_requests": rate_limited_responses,
            "violations": violations,
            "test_duration": total_time
        }


if __name__ == "__main__":
    # Test configuration
    tester = RateLimitStressTester("http://localhost:8000")

    # Run the test
    results = tester.run_test(
        client_ids=["test_client_1", "test_client_2"],
        requests_per_client=15
    )

    # Check for CI/CD - uncomment this line to fail the test if violations are found
    # assert len(results["violations"]) == 0, f"Rate limit violations detected: {results['violations']}"

    print(f"\nTest complete! Check the results above.")
