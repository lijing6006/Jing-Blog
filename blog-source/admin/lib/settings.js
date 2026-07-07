const fs = require('fs');
const path = require('path');
const {
  IMG_DIR,
  CONFIG_FILE,
  THEME_CONFIG_FILE,
} = require('./utils');

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

function replaceTopLevel(text, key, value) {
  const escaped = String(value || '').replaceAll('\n', ' ');
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  return text.replace(pattern, `${key}: ${escaped}`);
}

function readLineValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function readThemeValue(pattern, text) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function socialText(value, fallback = '未设置') {
  return String(value || fallback)
    .replaceAll('|', '')
    .replaceAll('\n', ' ')
    .trim();
}

function setThemeSettings(theme, values) {
  const socialLines = ['social:'];
  const githubLink = values.github || 'javascript:void(0)';
  const giteeLink = values.gitee || 'javascript:void(0)';
  socialLines.push(
    `  fab fa-github: ${githubLink} || GitHub || '#24292e'`,
  );
  if (values.email) {
    socialLines.push(
      `  fas fa-envelope: mailto:${values.email} || Email || '#4a7dbe'`,
    );
  }
  if (values.qq) {
    socialLines.push(
      `  fab fa-qq: javascript:void(0) || QQ账号 ${socialText(values.qq, '')} || '#12B7F5'`,
    );
  }
  if (values.wechat) {
    socialLines.push(
      `  fab fa-weixin: javascript:void(0) || 微信账号 ${socialText(values.wechat, '')} || '#07C160'`,
    );
  }
  socialLines.push(
    `  fab fa-git-alt: ${giteeLink} || Gitee || '#C71D23'`,
  );
  if (values.linuxdo) {
    socialLines.push(
      `  icon-linuxdo: ${values.linuxdo} || Linux.do || '#3f4752'`,
    );
  }
  theme = theme.replace(
    /social:\r?\n[\s\S]*?\r?\n# --------------------------------------\r?\n# Image Settings/,
    `${socialLines.join('\n')}\n\n# --------------------------------------\n# Image Settings`,
  );

  if (values.avatar) {
    theme = theme.replace(
      /avatar:\r?\n\s+img:.*\r?\n/,
      `avatar:\n  img: ${values.avatar}\n`,
    );
  }

  theme = theme.replace(
    /(card_author:\r?\n\s+enable: true\r?\n\s+description:).*/,
    `$1 ${values.authorDescription || ''}`,
  );
  theme = theme.replace(
    /(card_author:[\s\S]*?button:[\s\S]*?link:).*/,
    `$1 ${githubLink}`,
  );
  theme = theme.replace(
    /(card_announcement:\r?\n\s+enable: true\r?\n\s+content:).*/,
    `$1 ${values.announcement || ''}`,
  );
  return theme;
}

function readSettings() {
  const config = readText(CONFIG_FILE);
  const theme = readText(THEME_CONFIG_FILE);
  return {
    title: readLineValue(config, 'title'),
    subtitle: readLineValue(config, 'subtitle'),
    description: readLineValue(config, 'description'),
    author: readLineValue(config, 'author'),
    email: readThemeValue(/fas fa-envelope:\s*mailto:([^|]+)\|\|/, theme),
    github: readThemeValue(/fab fa-github:\s*([^|]+)\|\|/, theme),
    qq:
      readThemeValue(
        /fab fa-qq:\s*javascript:void\(0\)\s*\|\|\s*QQ账号\s*([^|]*)\|\|/,
        theme,
      ) || readThemeValue(/fab fa-qq:\s*([^|]+)\|\|/, theme),
    wechat:
      readThemeValue(
        /fab fa-weixin:\s*javascript:void\(0\)\s*\|\|\s*微信账号\s*([^|]*)\|\|/,
        theme,
      ) || readThemeValue(/fab fa-weixin:\s*([^|]+)\|\|/, theme),
    linuxdo:
      readThemeValue(/icon-linuxdo:\s*([^|]+)\|\|/, theme) ||
      readThemeValue(/fab fa-linux:\s*([^|]+)\|\|/, theme),
    gitee: readThemeValue(/fab fa-git-alt:\s*([^|]+)\|\|/, theme),
    avatar: readThemeValue(/avatar:\r?\n\s+img:\s*(.*)/, theme),
    authorDescription: readThemeValue(
      /card_author:\r?\n\s+enable: true\r?\n\s+description:\s*(.*)/,
      theme,
    ),
    announcement: readThemeValue(
      /card_announcement:\r?\n\s+enable: true\r?\n\s+content:\s*(.*)/,
      theme,
    ),
  };
}

function writeSettings(body, file) {
  let avatar = readSettings().avatar;
  if (file) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
      fs.unlinkSync(file.path);
      throw new Error('头像只支持 jpg、png、webp、svg');
    }
    avatar = `/img/avatar${ext}`;
    fs.copyFileSync(file.path, path.join(IMG_DIR, `avatar${ext}`));
    fs.unlinkSync(file.path);
  }

  let config = readText(CONFIG_FILE);
  config = replaceTopLevel(config, 'title', body.title);
  config = replaceTopLevel(config, 'subtitle', body.subtitle);
  config = replaceTopLevel(config, 'description', body.description);
  config = replaceTopLevel(config, 'author', body.author);
  writeText(CONFIG_FILE, config);

  const theme = setThemeSettings(readText(THEME_CONFIG_FILE), {
    email: body.email,
    github: body.github,
    qq: body.qq,
    wechat: body.wechat,
    linuxdo: body.linuxdo,
    gitee: body.gitee,
    avatar,
    authorDescription: body.authorDescription,
    announcement: body.announcement,
  });
  writeText(THEME_CONFIG_FILE, theme);
}

module.exports = { readSettings, writeSettings };
