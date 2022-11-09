import unittest
from PIL import Image


class ImageTesting(unittest.TestCase):

    def test_image_by_data_value(self):
        actual_image = Image.open('../images/original.png')
        expected_image = Image.open('../images/original_copy.png')
        self.assertEqual(
            list(actual_image.getdata()),
            list(expected_image.getdata())
        )

    def test_image_by_data_value_negative(self):
        actual_image = Image.open('../images/original.png')
        expected_image = Image.open('../images/edit.png')
        self.assertEqual(
            list(actual_image.getdata()),
            list(expected_image.getdata())
        )
