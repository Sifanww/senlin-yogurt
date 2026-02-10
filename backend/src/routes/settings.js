const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { adminAuth } = require('../middleware/auth');

// 设置文件路径
const settingsFile = path.join(__dirname, '../../data/settings.json');

// 确保 data 目录存在
const dataDir = path.dirname(settingsFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 读取设置
const getSettings = () => {
  try {
    if (fs.existsSync(settingsFile)) {
      return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    }
  } catch (err) {
    console.error('读取设置失败:', err);
  }
  return {};
};

// 保存设置
const saveSettings = (settings) => {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
};

// 获取所有设置
router.get('/', (req, res) => {
  const settings = getSettings();
  res.json({ data: settings });
});

// 获取收款码
router.get('/pay-qrcode', (req, res) => {
  const settings = getSettings();
  res.json({ data: { url: settings.payQrCode || '' } });
});

// 获取"我的"页面背景图
router.get('/me-bg-image', (req, res) => {
  const settings = getSettings();
  res.json({ data: { url: settings.meBgImage || '' } });
});

// 更新"我的"页面背景图
router.put('/me-bg-image', adminAuth, (req, res) => {
  try {
    const { url } = req.body;
    const settings = getSettings();
    settings.meBgImage = url;
    saveSettings(settings);
    res.json({ data: { url }, message: '背景图更新成功' });
  } catch (err) {
    console.error('更新背景图失败:', err);
    res.status(500).json({ error: '更新失败', message: err.message });
  }
});

// 更新收款码
router.put('/pay-qrcode', adminAuth, (req, res) => {
  try {
    const { url } = req.body;
    const settings = getSettings();
    settings.payQrCode = url;
    saveSettings(settings);
    res.json({ data: { url }, message: '收款码更新成功' });
  } catch (err) {
    console.error('更新收款码失败:', err);
    res.status(500).json({ error: '更新失败', message: err.message });
  }
});

// 更新任意设置
router.put('/', adminAuth, (req, res) => {
  try {
    const newSettings = req.body;
    const settings = { ...getSettings(), ...newSettings };
    saveSettings(settings);
    res.json({ data: settings, message: '设置更新成功' });
  } catch (err) {
    console.error('更新设置失败:', err);
    res.status(500).json({ error: '更新失败', message: err.message });
  }
});

module.exports = router;
