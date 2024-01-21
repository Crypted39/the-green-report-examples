# Example 2: Implementing Localization Libraries

# Python 'gettext' library for localization
import gettext

def load_translations(language):
    translation = gettext.translation('your_app', localedir='locales', languages=[language])
    translation.install()

# Usage
load_translations('en_US')