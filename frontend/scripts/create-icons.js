const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../src/assets/icons');

// 简单的 48x48 PNG 图标（使用 Canvas 绘制简笔画风格）
// 这里用预生成的 base64 数据

// 首页图标 - 房子形状 (灰色 #999999)
const homeIcon = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQklEQVR4nO2ZwQ6CMBCG/3c0HjTxoL6/j+DBgwdNfAQTL3pwdWFJCGVLd7pT+JJJSNjZ/jvdlhYQQgghhBBCCCGEEEIIIYQQQgghxP+gAHAGcANwB1AC2Pu+qQDgCOAC4ArgAaAGsPV5QwXgBOAM4ALgCuAOoAaw8XVDAeAI4AzgAuAK4A6gBrD2cUMB4ATgDOAC4ArgDqAGsPJxQwHgCOAM4ALgCuAOoAaw9