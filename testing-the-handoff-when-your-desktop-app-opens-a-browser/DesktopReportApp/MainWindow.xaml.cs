using System.Diagnostics;
using System.IO;
using System.Windows;

namespace DesktopReportApp;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    private void ViewReportButton_Click(object sender, RoutedEventArgs e)
    {
        var reportPath = Path.Combine(AppContext.BaseDirectory, "report.html");
        Process.Start(new ProcessStartInfo(reportPath) { UseShellExecute = true });
        StatusText.Text = "Report opened in browser";
    }
}
