const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 简单的 multipart 解析
router.post('/', (req, res) => {
  const chunks = [];
  
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const boundary = req.headers['content-type'].split('boundary=')[1];
      const parts = buffer.toString('binary').split('--' + boundary);
      
      for (const part of parts) {
        if (part.includes('filename=')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (!filenameMatch) continue;
          
          const originalName = filenameMatch[1];
          const ext = path.extname(originalName) || '.png';
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          
          // 提取文件内容
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          const fileContent = Buffer.from(part.slice(contentStart, contentEnd), 'binary');
          
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, fileContent);
          
          return res.json({ data: { url: `/uploads/${filename}` } });
        }
      }
      
      res.status(400).json({ error: '未找到上传文件' });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: '上传失败', message: err.message });
    }
  });
});

module.exports = router;
