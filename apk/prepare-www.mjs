// Copies the web app into www/ for the Android build:
// fonts are bundled locally (works offline from the first launch) and the service worker is dropped.
import fs from 'fs';
import path from 'path';

const root = path.resolve('..');
const www = path.resolve('www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const f of ['manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(www, f));
fs.cpSync(path.join(root, 'icons'), path.join(www, 'icons'), { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Local fonts from Fontsource, if the packages installed; otherwise keep Google Fonts.
const fonts = [['golos-text', ['400', '500', '600']], ['unbounded', ['500', '600']]];
const links = [];
for (const [pkg, weights] of fonts) {
  const src = path.resolve('node_modules/@fontsource', pkg);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(www, 'fonts', pkg), { recursive: true });
  for (const w of weights) if (fs.existsSync(path.join(src, `${w}.css`))) links.push(`<link rel="stylesheet" href="fonts/${pkg}/${w}.css">`);
}
if (links.length) {
  html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '')
             .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, links.join('\n'));
  console.log('fonts bundled:', links.length);
} else console.log('fonts: using Google Fonts');

// No service worker inside the app: updates come with a new APK.
html = html.replace(/<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>\n?/, '');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
fs.writeFileSync(path.join(www, 'index.html'), html);
console.log('www ready');
