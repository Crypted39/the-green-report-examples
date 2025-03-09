from locust import HttpUser, task, between


class APIUser(HttpUser):
    # Wait between 1 and 5 seconds between tasks
    wait_time = between(1, 5)

    # Base URL will be prepended to all request URLs
    host = "https://jsonplaceholder.typicode.com"

    @task(3)
    def get_posts(self):
        # GET request to fetch posts
        with self.client.get("/posts", name="Get all posts") as response:
            if response.status_code != 200:
                print(f"Failed to get posts: {response.status_code}")

    @task(1)
    def create_post(self):
        # POST request to create a new post
        payload = {
            "title": "Locust Test Post",
            "body": "This is a test post created during load testing",
            "userId": 1
        }

        with self.client.post("/posts", json=payload, name="Create post") as response:
            if response.status_code != 201:
                print(f"Failed to create post: {response.status_code}")

    @task(2)
    def get_single_post(self):
        # GET request to fetch a single post
        post_id = 1
        with self.client.get(f"/posts/{post_id}", name="Get single post") as response:
            if response.status_code != 200:
                print(f"Failed to get post {post_id}: {response.status_code}")
