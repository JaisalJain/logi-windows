namespace Loupedeck.DevPilotPlugin
{
    using System;
    using System.Net.Http;

    // ─── Main Plugin Class ────────────────────────────────────────────────────
    public class DevPilotPlugin : Plugin
    {
        public override Boolean UsesApplicationApiOnly => true;
        public override Boolean HasNoApplication => true;

        internal static readonly HttpClient Http = new HttpClient();
        internal const string ElectronUrl = "http://localhost:7734";

        public DevPilotPlugin()
        {
            PluginLog.Init(this.Log);
            PluginResources.Init(this.Assembly);
        }

        public override void Load()
        {
            PluginLog.Info("DevPilot plugin loaded.");
        }

        public override void Unload()
        {
            PluginLog.Info("DevPilot plugin unloaded.");
        }

        // Helper used by all command classes
        internal static void TriggerAction(string action)
        {
            try
            {
                // Fire and forget — don't block the UI thread
                Http.GetAsync($"{ElectronUrl}/{action}");
            }
            catch (Exception ex)
            {
                PluginLog.Error($"DevPilot: Failed to trigger '{action}': {ex.Message}");
            }
        }
    }

    // ─── Improve Code Command ─────────────────────────────────────────────────
    public class ImproveCodeCommand : PluginDynamicCommand
    {
        public ImproveCodeCommand()
            : base("Improve Code", "Select code, then press to improve it with AI", "DevPilot")
        {
        }

        protected override void RunCommand(string actionParameter)
        {
            DevPilotPlugin.TriggerAction("improve");
        }
    }

    // ─── Debug Error Command ──────────────────────────────────────────────────
    public class DebugErrorCommand : PluginDynamicCommand
    {
        public DebugErrorCommand()
            : base("Debug Error", "Select an error or code, then press to debug with AI", "DevPilot")
        {
        }

        protected override void RunCommand(string actionParameter)
        {
            DevPilotPlugin.TriggerAction("debug");
        }
    }

    // ─── Explain Code Command ─────────────────────────────────────────────────
    public class ExplainCodeCommand : PluginDynamicCommand
    {
        public ExplainCodeCommand()
            : base("Explain Code", "Select code, then press to get an AI explanation", "DevPilot")
        {
        }

        protected override void RunCommand(string actionParameter)
        {
            DevPilotPlugin.TriggerAction("explain");
        }
    }
}
