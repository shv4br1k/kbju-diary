// Runs after `npx cap add android && npx cap sync android`.
// Adds what Health Connect (steps) and reminders need to the generated Android project.
import { readFileSync, writeFileSync } from 'node:fs';

const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
const STRINGS = 'android/app/src/main/res/values/strings.xml';
const VARS = 'android/variables.gradle';

// Health Connect needs Android 8 (API 26) or newer.
let vars = readFileSync(VARS, 'utf8');
vars = vars.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26');
writeFileSync(VARS, vars);

let m = readFileSync(MANIFEST, 'utf8');
if (!m.includes('xmlns:tools')) m = m.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');

// Only steps are read. The health plugin also declares other health permissions; drop them.
const drop = ['READ_EXERCISE', 'READ_DISTANCE', 'READ_ACTIVE_CALORIES_BURNED', 'READ_TOTAL_CALORIES_BURNED', 'READ_HEART_RATE', 'READ_EXERCISE_ROUTE']
  .map(p => `    <uses-permission android:name="android.permission.health.${p}" tools:node="remove" />`).join('\n');
const rootAdd = `
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
${drop}
    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
`;
m = m.replace(/(<\/application>)/, `$1\n${rootAdd}`);

// Health Connect shows the app's "privacy policy" from these entries; without them it refuses to grant access.
const appAdd = `
        <activity
            android:name="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
            </intent-filter>
        </activity>
        <activity-alias
            android:name="ViewPermissionUsageActivity"
            android:exported="true"
            android:targetActivity="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>
`;
m = m.replace(/(\s*<\/application>)/, `${appAdd}$1`);
writeFileSync(MANIFEST, m);

let s = readFileSync(STRINGS, 'utf8');
if (!s.includes('privacy_policy_url')) {
  s = s.replace('</resources>', '    <string name="privacy_policy_url">https://github.com/shv4br1k/kbju-diary#readme</string>\n</resources>');
  writeFileSync(STRINGS, s);
}
console.log('Android project patched');
