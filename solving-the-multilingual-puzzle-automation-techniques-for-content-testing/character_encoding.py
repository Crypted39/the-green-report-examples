# Example using the built-in codecs module
utf8_string = 'Some UTF-8 encoded string'

# Convert UTF-8 to ASCII
ascii_string = utf8_string.encode('utf-8').decode('ascii', 'ignore')

# Note: 'ignore' parameter is used to handle characters that cannot be decoded in ASCII