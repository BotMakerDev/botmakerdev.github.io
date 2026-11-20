for (const w of workspace.windowList()) {
  if (w.caption === "Screens") w.minimized = true;
  if (w.caption.startsWith("BotMaker Blocks") || w.caption === "BotMaker") {
    w.setMaximize(false, false);
    w.frameGeometry = {x: 1423 + 120, y: 20, width: 1680, height: 1000};
    workspace.activeWindow = w;
  }
}
