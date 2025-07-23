#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

/**
 * PrimeUIX Package Exports Patcher
 * Automatically fixes and enhances exports for all @primeuix packages
 */
class PrimeUIXPatcher {
  constructor() {
    this.packages = [
      '@primeuix/themes',
      '@primeuix/styles',
      '@primeuix/styled',
      '@primeuix/utils'
    ];

    this.nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    this.backupSuffix = '.backup';
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting PrimeUIX Package Exports Patcher...\n');

    try {
      for (const packageName of this.packages) {
        await this.patchPackage(packageName);
      }

      console.log('\n✅ All @primeuix packages processed successfully!');
      console.log('💡 Remember to restart your development server (e.g., ng serve) after patching.');

    } catch (error) {
      console.error('❌ Patching failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Patch a specific package
   */
  async patchPackage(packageName) {
    const packagePath = path.join(this.nodeModulesPath, packageName);
    const packageJsonPath = path.join(packagePath, 'package.json');

    if (!existsSync(packagePath)) {
      console.log(`⚠️  Package ${packageName} not found at ${packagePath}, skipping...`);
      return;
    }

    console.log(`📦 Patching ${packageName}...`);

    // Backup original package.json
    await this.backupFile(packageJsonPath);

    // Read and parse package.json
    const packageJson = await this.readPackageJson(packageJsonPath);

    // Analyze package structure
    const structure = await this.analyzePackageStructure(packagePath);

    // Generate corrected exports
    const correctedExports = this.generateExports(packageName, structure);

    // Update package.json
    packageJson.exports = correctedExports;

    // Write corrected package.json
    await this.writePackageJson(packageJsonPath, packageJson); // FIX: Corrected second argument

    // Special handling for themes package to ensure default exports in theme files
    if (packageName === '@primeuix/themes') {
      await this.patchThemeFiles(packagePath, structure);
    }

    console.log(`✅ ${packageName} package.json updated.`);
  }

  /**
   * Patch theme files to ensure proper default exports
   */
  async patchThemeFiles(packagePath, structure) {
    console.log('🎨 Patching theme files for default exports...');

    const distPath = path.join(packagePath, 'dist');
    if (!existsSync(distPath)) {
      console.log('⚠️  No dist directory found for themes, skipping theme file patching.');
      return;
    }

    const themes = this.findThemes(structure.distStructure);

    if (themes.length === 0) {
      console.log('ℹ️  No known themes found in dist directory.');
      return;
    }

    for (const theme of themes) {
      const themeIndexPath = path.join(distPath, theme, 'index.mjs');
      const themeIndexDtsPath = path.join(distPath, theme, 'index.d.ts'); // Also patch d.ts

      if (existsSync(themeIndexPath)) {
        await this.ensureDefaultExport(themeIndexPath, theme);
      } else {
        console.log(`⚠️  Theme file ${themeIndexPath} not found.`);
      }

      if (existsSync(themeIndexDtsPath)) {
        await this.ensureDefaultExport(themeIndexDtsPath, theme);
      } else {
        console.log(`⚠️  Theme type definition file ${themeIndexDtsPath} not found.`);
      }
    }
  }

  /**
   * Ensure a file has a proper default export, typically for theme index.mjs and index.d.ts
   */
  async ensureDefaultExport(filePath, themeName) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Check if default export already exists
      if (content.includes('export default') || content.includes('export { default }')) {
        console.log(`ℹ️  ${path.basename(filePath)} already has a default export.`);
        return; // Already has default export
      }

      // Attempt 1: Look for a named export matching the themeName and make it default
      // This regex tries to capture `export { ThemeName }` or `export { someOther, ThemeName, another }`
      const namedExportThemeRegex = new RegExp(`export\\s*{\\s*(?:[^}]+?,\\s*)?(${themeName})(?:\\s*,[^}]+?)?\\s*}`, 'i');

      if (namedExportThemeRegex.test(content)) {
        content = content.replace(namedExportThemeRegex, (match, p1) => {
          // If the named export is already 'ThemeName as default', don't re-add
          if (match.includes(`${p1} as default`)) {
            return match;
          }
          // Replace 'ThemeName' with 'ThemeName as default' within the named export list
          return match.replace(new RegExp(`\\b${p1}\\b`, 'g'), `${p1} as default`);
        });
        console.log(`✅ Added default export to ${path.basename(filePath)} by modifying named export.`);
      } else {
        // Attempt 2: Fallback to adding a generic default export at the end
        // This is less ideal but ensures a default export exists.
        content += `\n\n// Auto-generated default export by PrimeUIX Patcher\nexport default {};`;
        console.log(`✅ Added generic default export to ${path.basename(filePath)}.`);
      }

      // Create backup before modifying
      await this.backupFile(filePath);

      // Write modified content
      await fs.writeFile(filePath, content, 'utf-8');

    } catch (error) {
      console.warn(`⚠️  Could not patch ${filePath}: ${error.message}`);
    }
  }

  /**
   * Backup original file
   */
  async backupFile(filePath) {
    const backupPath = filePath + this.backupSuffix;
    if (!existsSync(backupPath)) {
      await fs.copyFile(filePath, backupPath);
      console.log(`💾 Backup created for: ${path.basename(filePath)}`);
    } else {
      console.log(`ℹ️  Backup already exists for: ${path.basename(filePath)}`);
    }
  }

  /**
   * Read and parse package.json
   */
  async readPackageJson(packageJsonPath) {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Write updated package.json
   */
  async writePackageJson(packageJsonPath, packageJson) {
    const content = JSON.stringify(packageJson, null, 2);
    await fs.writeFile(packageJsonPath, content, 'utf-8');
  }

  /**
   * Analyze package directory structure
   */
  async analyzePackageStructure(packagePath) {
    const structure = {
      hasTypes: false,
      hasTokens: false,
      hasDist: false,
      hasUmd: false,
      distStructure: [],
      typesStructure: [],
      tokensStructure: []
    };

    try {
      const distPath = path.join(packagePath, 'dist');
      const typesPath = path.join(packagePath, 'types');
      const tokensPath = path.join(packagePath, 'tokens');
      const umdPath = path.join(packagePath, 'umd');

      structure.hasDist = existsSync(distPath);
      structure.hasTypes = existsSync(typesPath);
      structure.hasTokens = existsSync(tokensPath);
      structure.hasUmd = existsSync(umdPath);

      if (structure.hasDist) {
        structure.distStructure = await this.getDirectoryStructure(distPath);
      }
      if (structure.hasTypes) {
        structure.typesStructure = await this.getDirectoryStructure(typesPath);
      }
      if (structure.hasTokens) {
        structure.tokensStructure = await this.getDirectoryStructure(tokensPath);
      }

    } catch (error) {
      console.warn(`⚠️  Error analyzing structure for ${packagePath}: ${error.message}`);
    }

    return structure;
  }

  /**
   * Get directory structure recursively
   */
  async getDirectoryStructure(dirPath, basePath = '') {
    const structure = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          structure.push({
            type: 'directory',
            name: entry.name,
            path: relativePath,
            children: await this.getDirectoryStructure(fullPath, relativePath)
          });
        } else if (entry.isFile()) {
          structure.push({
            type: 'file',
            name: entry.name,
            path: relativePath,
            ext: path.extname(entry.name)
          });
        }
      }
    } catch (error) {
      // Ignore errors for non-existent directories, as existsSync already checks
      // This catch is more for permission issues or other unexpected errors
      console.warn(`⚠️  Error reading directory ${dirPath}: ${error.message}`);
    }

    return structure;
  }

  /**
   * Generate corrected exports based on package analysis
   */
  generateExports(packageName, structure) {
    const exports = {};

    // Base export (always required)
    exports['.'] = this.generateMainExport(structure);

    // Package-specific exports
    switch (packageName) {
      case '@primeuix/themes':
        Object.assign(exports, this.generateThemesExports(structure));
        break;
      case '@primeuix/styles':
        Object.assign(exports, this.generateStylesExports(structure));
        break;
      case '@primeuix/styled':
        Object.assign(exports, this.generateStyledExports(structure));
        break;
      case '@primeuix/utils':
        Object.assign(exports, this.generateUtilsExports(structure));
        break;
    }

    // Generic wildcard exports (last resort, often needed for sub-paths)
    // This should cover cases like '@primeuix/utils/dom'
    exports['./*'] = {
      types: './dist/*/index.d.ts',
      import: './dist/*/index.mjs',
      require: './dist/*/index.cjs',
      default: './dist/*/index.mjs'
    };

    return exports;
  }

  /**
   * Generate main export entry
   */
  generateMainExport(structure) {
    const mainExport = {};

    // Prioritize root index files if they exist, otherwise fallback to dist
    if (existsSync(path.join(this.nodeModulesPath, this.packages.find(p => p.includes('primeuix')), 'index.d.ts'))) {
        mainExport.types = './index.d.ts';
    } else if (structure.hasDist) {
        mainExport.types = './dist/index.d.ts';
    }

    if (existsSync(path.join(this.nodeModulesPath, this.packages.find(p => p.includes('primeuix')), 'index.mjs'))) {
        mainExport.import = './index.mjs';
        mainExport.default = './index.mjs';
    } else if (structure.hasDist) {
        mainExport.import = './dist/index.mjs';
        mainExport.default = './dist/index.mjs';
    }

    if (existsSync(path.join(this.nodeModulesPath, this.packages.find(p => p.includes('primeuix')), 'index.cjs'))) {
        mainExport.require = './index.cjs';
    } else if (structure.hasDist) {
        mainExport.require = './dist/index.cjs';
    }

    // Ensure a default fallback if no specific main entry points are found
    if (Object.keys(mainExport).length === 0 && structure.hasDist) {
        mainExport.default = './dist/index.mjs'; // Best guess fallback
    }

    return mainExport;
  }

  /**
   * Generate @primeuix/themes specific exports
   */
  generateThemesExports(structure) {
    const exports = {};

    // Types exports (e.g., @primeuix/themes/types)
    if (structure.hasTypes) {
      exports['./types'] = {
        types: './types/index.d.ts'
      };
      exports['./types/*'] = {
        types: './types/*/index.d.ts'
      };
    }

    // Tokens exports (e.g., @primeuix/themes/tokens)
    if (structure.hasTokens) {
      exports['./tokens'] = {
        types: './tokens/index.d.ts',
        import: './tokens/index.mjs',
        require: './tokens/index.cjs',
        default: './tokens/index.mjs'
      };
    }

    // Theme-specific exports (Aura, Material, etc.)
    const themes = this.findThemes(structure.distStructure);
    for (const theme of themes) {
      // Main theme export with proper default export
      exports[`./${theme}`] = {
        types: `./dist/${theme}/index.d.ts`,
        import: `./dist/${theme}/index.mjs`,
        require: `./dist/${theme}/index.cjs`,
        default: `./dist/${theme}/index.mjs`
      };

      // Add common theme sub-paths (base, components, semantic, etc.)
      const commonSubPaths = ['base', 'components', 'semantic', 'variables']; // Added 'variables'
      for (const subPath of commonSubPaths) {
        const subPathMjs = `./dist/${theme}/${subPath}/index.mjs`;
        const subPathCjs = `./dist/${theme}/${subPath}/index.cjs`;
        const subPathDts = `./dist/${theme}/${subPath}/index.d.ts`;

        if (
            existsSync(path.join(this.nodeModulesPath, '@primeuix/themes', subPathMjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/themes', subPathCjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/themes', subPathDts))
        ) {
            exports[`./${theme}/${subPath}`] = {
                types: subPathDts,
                import: subPathMjs,
                require: subPathCjs,
                default: subPathMjs
            };
        }
      }
    }

    return exports;
  }

  /**
   * Generate @primeuix/styles specific exports
   */
  generateStylesExports(structure) {
    const exports = {};

    // Common style exports
    const commonExports = ['base', 'components', 'utilities', 'themes'];

    for (const exportName of commonExports) {
        const exportMjs = `./dist/${exportName}/index.mjs`;
        const exportCjs = `./dist/${exportName}/index.cjs`;
        const exportDts = `./dist/${exportName}/index.d.ts`;

        if (
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styles', exportMjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styles', exportCjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styles', exportDts))
        ) {
            exports[`./${exportName}`] = {
                types: exportDts,
                import: exportMjs,
                require: exportCjs,
                default: exportMjs
            };
        }
    }

    return exports;
  }

  /**
   * Generate @primeuix/styled specific exports
   */
  generateStyledExports(structure) {
    const exports = {};

    // Common styled exports
    const commonExports = ['system', 'components', 'base'];

    for (const exportName of commonExports) {
        const exportMjs = `./dist/${exportName}/index.mjs`;
        const exportCjs = `./dist/${exportName}/index.cjs`;
        const exportDts = `./dist/${exportName}/index.d.ts`;

        if (
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styled', exportMjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styled', exportCjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/styled', exportDts))
        ) {
            exports[`./${exportName}`] = {
                types: exportDts,
                import: exportMjs,
                require: exportCjs,
                default: exportMjs
            };
        }
    }

    return exports;
  }

  /**
   * Generate @primeuix/utils specific exports
   */
  generateUtilsExports(structure) {
    const exports = {};

    // Common utility exports
    const commonExports = ['object', 'dom', 'event', 'helper', 'uuid', 'zindex', 'classnames', 'mergeprops']; // Added more common utils

    for (const exportName of commonExports) {
        const exportMjs = `./dist/${exportName}/index.mjs`;
        const exportCjs = `./dist/${exportName}/index.cjs`;
        const exportDts = `./dist/${exportName}/index.d.ts`;

        if (
            existsSync(path.join(this.nodeModulesPath, '@primeuix/utils', exportMjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/utils', exportCjs)) ||
            existsSync(path.join(this.nodeModulesPath, '@primeuix/utils', exportDts))
        ) {
            exports[`./${exportName}`] = {
                types: exportDts,
                import: exportMjs,
                require: exportCjs,
                default: exportMjs
            };
        }
    }

    return exports;
  }

  /**
   * Find available themes in the distribution
   */
  findThemes(distStructure) {
    // These are common top-level theme directories.
    // We look for directories that might contain 'index.mjs' inside.
    const knownThemePrefixes = ['aura', 'material', 'lara', 'nova', 'bootstrap', 'fluent', 'md', 'mdc', 'saga', 'vela', 'rhea', 'luna'];
    const foundThemes = [];

    function searchThemes(structure, currentPath = '') {
      for (const item of structure) {
        if (item.type === 'directory') {
          // Check if the directory name matches a known theme prefix
          const isKnownTheme = knownThemePrefixes.some(prefix => item.name.toLowerCase().startsWith(prefix));
          // And if it contains an index.mjs (or similar) indicating it's a theme entry point
          const hasIndexMjs = item.children && item.children.some(child => child.name === 'index.mjs');

          if (isKnownTheme && hasIndexMjs) {
            foundThemes.push(item.name);
          }
          // Recursively search in subdirectories, especially for nested themes like 'md-light-indigo'
          searchThemes(item.children, path.join(currentPath, item.name));
        }
      }
    }

    searchThemes(distStructure);
    return [...new Set(foundThemes)]; // Remove duplicates
  }

  /**
   * Restore backups (cleanup function)
   */
  async restoreBackups() {
    console.log('🔄 Restoring backups...');

    for (const packageName of this.packages) {
      const packagePath = path.join(this.nodeModulesPath, packageName);
      const packageJsonPath = path.join(packagePath, 'package.json');
      const backupPath = packageJsonPath + this.backupSuffix;

      if (existsSync(backupPath)) {
        await fs.copyFile(backupPath, packageJsonPath);
        await fs.unlink(backupPath);
        console.log(`✅ Restored ${packageName}`);
      } else {
        console.log(`ℹ️  No backup found for ${packageName}, skipping restore.`);
      }

      // Also try to restore theme files if they were patched
      if (packageName === '@primeuix/themes') {
        const distPath = path.join(packagePath, 'dist');
        if (existsSync(distPath)) {
          const themes = this.findThemes((await this.analyzePackageStructure(packagePath)).distStructure);
          for (const theme of themes) {
            const themeIndexPath = path.join(distPath, theme, 'index.mjs');
            const themeIndexDtsPath = path.join(distPath, theme, 'index.d.ts');

            if (existsSync(themeIndexPath + this.backupSuffix)) {
              await fs.copyFile(themeIndexPath + this.backupSuffix, themeIndexPath);
              await fs.unlink(themeIndexPath + this.backupSuffix);
              console.log(`✅ Restored ${path.basename(themeIndexPath)}`);
            }
            if (existsSync(themeIndexDtsPath + this.backupSuffix)) {
              await fs.copyFile(themeIndexDtsPath + this.backupSuffix, themeIndexDtsPath);
              await fs.unlink(themeIndexDtsPath + this.backupSuffix);
              console.log(`✅ Restored ${path.basename(themeIndexDtsPath)}`);
            }
          }
        }
      }
    }
    console('\n✅ All available backups restored.');
  }
}

// CLI execution
async function main() {
  const patcher = new PrimeUIXPatcher();

  const args = process.argv.slice(2);

  if (args.includes('--restore')) {
    await patcher.restoreBackups();
    return;
  }

  if (args.includes('--help')) {
    console.log(`
PrimeUIX Package Exports Patcher

Usage:
  node patch-primeuix.js          # Patch all packages
  node patch-primeuix.js --restore # Restore original packages
  node patch-primeuix.js --help    # Show this help

This script automatically fixes export configurations in all @primeuix packages
to ensure proper TypeScript imports and module resolution, especially for themes.
    `);
    return;
  }

  await patcher.run();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PrimeUIXPatcher;
