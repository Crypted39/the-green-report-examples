import hashlib
import requests

# URL of the file to download
file_url = 'http://example.com/software/update.zip'
# Expected SHA-256 checksum of the file
expected_checksum = '5d41402abc4b2a76b9719d911017c592'


def download_file(url, local_filename):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_filename


def calculate_checksum(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b''):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def verify_file_integrity(url, expected_checksum):
    local_filename = 'update.zip'
    download_file(url, local_filename)
    actual_checksum = calculate_checksum(local_filename)
    assert actual_checksum == expected_checksum, "File integrity verification failed. Checksums do not match."
    print("File integrity verified. Checksums match.")


verify_file_integrity(file_url, expected_checksum)
