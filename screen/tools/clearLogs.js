const { exec } = require('child_process');
const { join } = require('path');

const logPath = join(__dirname, '../logs'); // 日志路径

exec(`echo "" > "${logPath}/app-err.log"`);
exec(`echo "" > "${logPath}/app-out.log"`);
