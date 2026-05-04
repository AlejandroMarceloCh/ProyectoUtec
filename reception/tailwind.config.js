/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@utec-gym/ui-web/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // ruta relativa al monorepo, NUNCA node_modules/ (los symlinks de npm workspaces
    // no son seguros para el JIT en producción).
    '../packages/ui-web/src/**/*.{ts,tsx}',
  ],
};
