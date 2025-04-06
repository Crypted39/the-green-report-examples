# Stage 1: Build dependencies
FROM python:3.11 AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

# Stage 2: Chrome and driver preparation
FROM debian:bullseye-slim AS chrome

# Install Chrome and required dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    unzip \
    --no-install-recommends && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-linux-signing-key.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-key.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Download Chrome Driver
RUN CHROME_DRIVER_VERSION=$(wget -qO- https://chromedriver.storage.googleapis.com/LATEST_RELEASE) \
    && wget -q --no-verbose -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/$CHROME_DRIVER_VERSION/chromedriver_linux64.zip \
    && unzip /tmp/chromedriver.zip -d /usr/bin/ \
    && rm /tmp/chromedriver.zip \
    && chmod +x /usr/bin/chromedriver

# Stage 3: Final slim test image
FROM python:3.11-slim

WORKDIR /app

# Copy only the Chrome binary and Chrome Driver from chrome stage
COPY --from=chrome /opt/google/chrome /opt/google/chrome
COPY --from=chrome /usr/bin/chromedriver /usr/bin/chromedriver
COPY --from=chrome /usr/bin/google-chrome-stable /usr/bin/google-chrome-stable

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder stage
COPY --from=builder /build/wheels /wheels
COPY requirements.txt .

# Install the Python packages with no build dependencies needed
RUN pip install --no-cache /wheels/* \
    && rm -rf /wheels \
    && rm requirements.txt

# Copy only test files, not the entire project
COPY tests/ /app/tests/
COPY conftest.py /app/

# Set Chrome to run in headless mode by default
ENV CHROME_OPTIONS="--headless --no-sandbox --disable-dev-shm-usage"

# Command to run the tests
CMD ["pytest", "tests/", "-v"]