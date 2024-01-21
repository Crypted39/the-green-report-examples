# Example 1: Utilizing Resource Files

import json

def load_resource_file(language):
    with open(f'{language}.json') as file:
        return json.load(file)

# Usage
english_content = load_resource_file('en_US')
spanish_content = load_resource_file('es_ES')

print(english_content)
print(spanish_content)