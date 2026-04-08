#!/usr/bin/env node

/**
 * Package Verification Script
 * Checks all critical dependencies and their versions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Medical Platform - Package Verification\n');
console.log('='.repeat(50));
console.log('');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
let warnings = 0;

function checkPackage(packageName, minVersion = null) {
  try {
    const packagePath = path.join(__dirname, 'node_modules', packageName, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      console.log(`${colors.red}❌ MISSING${colors.reset}: ${packageName}`);
      failed++;
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const version = packageJson.version;

    if (minVersion) {
      const installedMajor = parseInt(version.split('.')[0]);
      const requiredMajor = parseInt(minVersion.split('.')[0]);

      if (installedMajor < requiredMajor) {
        console.log(`${colors.yellow}⚠️  WARNING${colors.reset}: ${packageName} v${version} (recommended: v${minVersion}+)`);
        warnings++;
        return true;
      }
    }

    console.log(`${colors.green}✅ INSTALLED${colors.reset}: ${packageName} v${version}`);
    passed++;
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset}: ${packageName} - ${error.message}`);
    failed++;
    return false;
  }
}

function checkSharpBinary() {
  console.log('\n' + '='.repeat(50));
  console.log('Checking Sharp Binary...\n');

  try {
    const sharp = require('sharp');
    console.log(`${colors.green}✅ Sharp binary loaded successfully${colors.reset}`);
    
    // Get Sharp version and platform info
    const sharpVersion = sharp.versions;
    console.log(`   Sharp version: ${sharpVersion.sharp}`);
    console.log(`   libvips version: ${sharpVersion.vips}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    
    passed++;
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Sharp binary failed to load${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   ${colors.yellow}Fix: npm rebuild sharp${colors.reset}`);
    failed++;
    return false;
  }
}

function checkPrismaClient() {
  console.log('\n' + '='.repeat(50));
  console.log('Checking Prisma Client...\n');

  try {
    const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
    
    if (!fs.existsSync(prismaClientPath)) {
      console.log(`${colors.red}❌ Prisma Client not generated${colors.reset}`);
      console.log(`   ${colors.yellow}Fix: npx prisma generate${colors.reset}`);
      failed++;
      return false;
    }

    console.log(`${colors.green}✅ Prisma Client generated${colors.reset}`);
    
    // Try to require it
    const { PrismaClient } = require('@prisma/client');
    console.log(`${colors.green}✅ Prisma Client can be imported${colors.reset}`);
    
    passed += 2;
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Prisma Client error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   ${colors.yellow}Fix: npx prisma generate${colors.reset}`);
    failed++;
    return false;
  }
}

function checkOpenAI() {
  console.log('\n' + '='.repeat(50));
  console.log('Checking OpenAI SDK...\n');

  try {
    const OpenAI = require('openai');
    console.log(`${colors.green}✅ OpenAI SDK can be imported${colors.reset}`);
    
    // Check if API key is in environment
    if (process.env.OPENAI_API_KEY) {
      console.log(`${colors.green}✅ OPENAI_API_KEY environment variable is set${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  WARNING: OPENAI_API_KEY not set in environment${colors.reset}`);
      warnings++;
    }
    
    passed++;
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ OpenAI SDK error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    failed++;
    return false;
  }
}

function checkEnvironmentFile() {
  console.log('\n' + '='.repeat(50));
  console.log('Checking Environment Configuration...\n');

  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}❌ .env file not found${colors.reset}`);
    console.log(`   ${colors.yellow}Fix: cp .env.example .env${colors.reset}`);
    failed++;
    return false;
  }

  console.log(`${colors.green}✅ .env file exists${colors.reset}`);

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENAI_API_KEY',
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const value = envContent.match(new RegExp(`${varName}=(.*)`))?.[1]?.trim();
      if (value && value !== '' && !value.startsWith('your-') && !value.startsWith('sk-...')) {
        console.log(`${colors.green}✅ ${varName} is configured${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️  WARNING: ${varName} appears to be a placeholder${colors.reset}`);
        warnings++;
      }
    } else {
      console.log(`${colors.red}❌ ${varName} is missing${colors.reset}`);
      allPresent = false;
      failed++;
    }
  });

  if (allPresent) {
    passed++;
  }

  return allPresent;
}

function checkProjectStructure() {
  console.log('\n' + '='.repeat(50));
  console.log('Checking Project Structure...\n');

  const requiredDirs = [
    'app',
    'components',
    'lib',
    'prisma',
    'types',
  ];

  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.mjs',
    'tailwind.config.ts',
    'prisma/schema.prisma',
  ];

  let allPresent = true;

  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`${colors.green}✅ Directory exists: ${dir}/${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Directory missing: ${dir}/${colors.reset}`);
      allPresent = false;
      failed++;
    }
  });

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✅ File exists: ${file}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ File missing: ${file}${colors.reset}`);
      allPresent = false;
      failed++;
    }
  });

  if (allPresent) {
    passed++;
  }

  return allPresent;
}

// Main execution
console.log('Checking Core Dependencies...\n');

// Check critical packages
const criticalPackages = [
  ['next', '14.0.0'],
  ['react', '18.0.0'],
  ['typescript', '5.0.0'],
  ['@prisma/client', '5.0.0'],
  ['prisma', '5.0.0'],
  ['next-auth', '5.0.0'],
  ['openai', '4.0.0'],
  ['sharp', '0.33.0'],
  ['jspdf', '2.0.0'],
  ['bcryptjs', '2.4.0'],
  ['tailwindcss', '3.0.0'],
];

criticalPackages.forEach(([pkg, minVersion]) => {
  checkPackage(pkg, minVersion);
});

// Additional checks
checkSharpBinary();
checkPrismaClient();
checkOpenAI();
checkEnvironmentFile();
checkProjectStructure();

// Summary
console.log('\n' + '='.repeat(50));
console.log('Summary:\n');
console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
console.log(`Total Checks: ${passed + warnings + failed}`);
console.log('');

if (failed === 0 && warnings === 0) {
  console.log(`${colors.green}🎉 All checks passed! Your environment is ready.${colors.reset}`);
  process.exit(0);
} else if (failed === 0) {
  console.log(`${colors.yellow}⚠️  All critical checks passed, but there are warnings.${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some checks failed. Please fix the issues above.${colors.reset}`);
  console.log('');
  console.log('Common fixes:');
  console.log('  - npm install (install missing packages)');
  console.log('  - npm rebuild sharp (rebuild Sharp binary)');
  console.log('  - npx prisma generate (generate Prisma client)');
  console.log('  - cp .env.example .env (create environment file)');
  console.log('');
  process.exit(1);
}
