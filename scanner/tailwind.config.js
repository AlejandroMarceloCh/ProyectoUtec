/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@utec-gym/ui-web/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../packages/ui-web/src/**/*.{ts,tsx}',
  ],
};
