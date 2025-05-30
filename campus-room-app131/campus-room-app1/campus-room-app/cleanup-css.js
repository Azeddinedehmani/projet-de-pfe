// Script de nettoyage CSS avec auto-détection
// Placez ce fichier n'importe où et il trouvera vos CSS automatiquement
// Usage: node cleanup-css-auto.js

const fs = require('fs');
const path = require('path');

// Fonction pour trouver automatiquement le dossier CSS
function findStylesDirectory() {
  const possiblePaths = [
    './styles',
    './src/styles', 
    './assets/styles',
    './public/styles',
    './css',
    './src/css',
    './assets/css',
    './public/css'
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      console.log(`📁 Dossier CSS trouvé: ${testPath}`);
      return testPath;
    }
  }
  
  console.error('❌ Aucun dossier CSS trouvé. Chemins testés:');
  possiblePaths.forEach(p => console.log(`  - ${p}`));
  return null;
}

// Fonction pour lister automatiquement tous les fichiers CSS
function findCSSFiles(stylesDir) {
  try {
    const files = fs.readdirSync(stylesDir)
      .filter(file => file.endsWith('.css'))
      .filter(file => !file.includes('.backup'));
    
    console.log(`📋 ${files.length} fichiers CSS trouvés:`);
    files.forEach(file => console.log(`  - ${file}`));
    return files;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du dossier:', error.message);
    return [];
  }
}

// Fonction de nettoyage améliorée
function cleanCSSFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalSize = content.length;
    
    // Sauvegarder l'original
    fs.writeFileSync(filePath + '.backup', content);
    
    // Regex plus robuste pour les variables CSS
    const patterns = [
      // Blocs :root avec commentaires précédents
      /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/\s*:root\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs,
      // Blocs :root simples
      /:root\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs,
      // Commentaires de variables
      /\/\*\s*Variables.*?\*\/\s*/gs,
      /\/\*\s*Variables héritées.*?\*\/\s*/gs,
      /\/\*\s*=+\s*VARIABLES.*?\*\/\s*/gs,
    ];
    
    let cleaned = false;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        cleaned = true;
      }
    });
    
    if (cleaned) {
      // Nettoyer les espaces excessifs
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      content = content.replace(/^\s*\n/, ''); // Supprimer ligne vide au début
      
      fs.writeFileSync(filePath, content);
      
      const newSize = content.length;
      const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      
      console.log(`✅ ${path.basename(filePath)}: ${originalSize} → ${newSize} bytes (-${reduction}%)`);
    } else {
      console.log(`⚪ ${path.basename(filePath)}: Aucune variable trouvée`);
      // Supprimer le backup inutile
      fs.unlinkSync(filePath + '.backup');
    }
    
  } catch (error) {
    console.error(`❌ Erreur avec ${path.basename(filePath)}:`, error.message);
  }
}

// Fonction principale automatique
function autoCleanup() {
  console.log('🧹 Nettoyage CSS Automatique\n');
  
  // 1. Trouver le dossier CSS
  const stylesDir = findStylesDirectory();
  if (!stylesDir) {
    console.log('\n💡 Solutions:');
    console.log('1. Créez un dossier "styles" ou "css"');
    console.log('2. Déplacez ce script vers le bon dossier');
    console.log('3. Modifiez la liste possiblePaths dans le script');
    return;
  }
  
  // 2. Trouver tous les fichiers CSS
  const cssFiles = findCSSFiles(stylesDir);
  if (cssFiles.length === 0) {
    console.log('❌ Aucun fichier CSS trouvé');
    return;
  }
  
  console.log('\n🧹 Nettoyage en cours...\n');
  
  // 3. Nettoyer chaque fichier
  let totalCleaned = 0;
  cssFiles.forEach(fileName => {
    const filePath = path.join(stylesDir, fileName);
    cleanCSSFile(filePath);
    totalCleaned++;
  });
  
  // 4. Créer le nouveau main.css
  createOptimizedMainCSS(stylesDir, cssFiles);
  
  console.log(`\n🎉 Nettoyage terminé ! ${totalCleaned} fichiers traités`);
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Testez votre site web');
  console.log('2. Si problème: node cleanup-css-auto.js restore');
  console.log('3. Si OK: supprimez les fichiers .backup');
}

// Fonction pour créer un main.css optimisé
function createOptimizedMainCSS(stylesDir, cssFiles) {
  const imports = cssFiles
    .filter(file => file !== 'main.css')
    .map(file => `@import './${file}';`)
    .join('\n');
  
  const mainContent = `/* =================================
   MAIN.CSS - Généré automatiquement
   ================================= */

${imports}
`;
  
  const mainPath = path.join(stylesDir, 'main.css');
  
  // Sauvegarder l'ancien main.css s'il existe
  if (fs.existsSync(mainPath)) {
    fs.writeFileSync(mainPath + '.backup', fs.readFileSync(mainPath, 'utf8'));
  }
  
  fs.writeFileSync(mainPath, mainContent);
  console.log('✅ main.css optimisé créé');
}

// Fonction de restauration
function restore() {
  console.log('🔄 Restauration automatique...\n');
  
  const stylesDir = findStylesDirectory();
  if (!stylesDir) return;
  
  const backupFiles = fs.readdirSync(stylesDir)
    .filter(file => file.endsWith('.backup'));
  
  if (backupFiles.length === 0) {
    console.log('❌ Aucun fichier de sauvegarde trouvé');
    return;
  }
  
  backupFiles.forEach(backupFile => {
    const originalFile = backupFile.replace('.backup', '');
    const backupPath = path.join(stylesDir, backupFile);
    const originalPath = path.join(stylesDir, originalFile);
    
    fs.copyFileSync(backupPath, originalPath);
    console.log(`✅ ${originalFile} restauré`);
  });
  
  console.log('\n🎉 Restauration terminée');
}

// Fonction pour supprimer les backups
function cleanBackups() {
  console.log('🗑️ Suppression des fichiers de sauvegarde...\n');
  
  const stylesDir = findStylesDirectory();
  if (!stylesDir) return;
  
  const backupFiles = fs.readdirSync(stylesDir)
    .filter(file => file.endsWith('.backup'));
  
  backupFiles.forEach(backupFile => {
    const backupPath = path.join(stylesDir, backupFile);
    fs.unlinkSync(backupPath);
    console.log(`🗑️ ${backupFile} supprimé`);
  });
  
  console.log(`\n✅ ${backupFiles.length} fichiers de sauvegarde supprimés`);
}

// Interface utilisateur
const command = process.argv[2];

console.log('🎨 Nettoyeur CSS Automatique v2.0\n');

switch (command) {
  case 'clean':
    autoCleanup();
    break;
  case 'restore':
    restore();
    break;
  case 'remove-backups':
    cleanBackups();
    break;
  default:
    console.log('📖 Utilisation:');
    console.log('  node cleanup-css-auto.js clean          - Nettoyer automatiquement');
    console.log('  node cleanup-css-auto.js restore        - Restaurer les originaux');
    console.log('  node cleanup-css-auto.js remove-backups - Supprimer les sauvegardes');
    console.log('\n💡 Le script trouve automatiquement vos fichiers CSS !');
}