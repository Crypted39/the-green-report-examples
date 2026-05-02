using System.Windows;

namespace TextConverterApp
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        private void ConvertButton_Click(object sender, RoutedEventArgs e)
        {
            outputLabel.Content = inputField.Text.ToLower();
        }
    }
}
