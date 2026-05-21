const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);
const escapePath = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

config.resolver.blockList = exclusionList([
  new RegExp(`^${escapePath(path.join(__dirname, 'apps'))}[/\\\\].*`),
  new RegExp(`^${escapePath(path.join(__dirname, 'supabase'))}[/\\\\].*`),
]);

module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
});
