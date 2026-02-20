namespace Loupedeck.ExamplePlugin
{
    using System;
    using System.Diagnostics;

    public class OpenMenuCommand : PluginDynamicCommand
    {
        public OpenMenuCommand()
            : base("Open Menu", "Select text, then press to open the DevPilot menu", "DevPilot")
        { }
        protected override void RunCommand(String actionParameter)
        {
            Process.Start(new ProcessStartInfo {
                FileName = "curl",
                Arguments = "-s http://localhost:7734/menu",
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }
    }

    public class ImproveCodeCommand : PluginDynamicCommand
    {
        public ImproveCodeCommand()
            : base("Improve Code", "Select code then press to improve with AI", "DevPilot")
        { }
        protected override void RunCommand(String actionParameter)
        {
            Process.Start(new ProcessStartInfo {
                FileName = "curl",
                Arguments = "-s http://localhost:7734/improve",
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }
    }

    public class DebugErrorCommand : PluginDynamicCommand
    {
        public DebugErrorCommand()
            : base("Debug Error", "Select error then press to debug with AI", "DevPilot")
        { }
        protected override void RunCommand(String actionParameter)
        {
            Process.Start(new ProcessStartInfo {
                FileName = "curl",
                Arguments = "-s http://localhost:7734/debug",
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }
    }

    public class ExplainCodeCommand : PluginDynamicCommand
    {
        public ExplainCodeCommand()
            : base("Explain Code", "Select code then press to explain with AI", "DevPilot")
        { }
        protected override void RunCommand(String actionParameter)
        {
            Process.Start(new ProcessStartInfo {
                FileName = "curl",
                Arguments = "-s http://localhost:7734/explain",
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }
    }
}