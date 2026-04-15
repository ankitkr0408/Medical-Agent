#!/usr/bin/env node

/**
 * Pre-Deployment Checklist for Vercel
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 HealthIQ - Pre-Deployment Checklist\n');
console.log('='.repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check 1: .gitignore includes .env
console.log('\n✓ Checking .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignore.includes('.env')) {
        console.log('  ✅ .env is in .gitignore');
    } else {
        console.log('  ❌ ERROR: .env is NOT in .gitignore!');
        hasErrors = true;
    }
} else {
    console.log('  ⚠️  WARNING: .gitignore not found');
    hasWarnings = true;
}

// Check 2: Required files exist
console.log('\n✓ Checking required files...');
const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'tsconfig.json',
    '.env.example'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`  ✅ ${file} exists`);
    } else {
        console.log(`  ❌ ERROR: ${file} is missing!`);
        hasErrors = true;
    }
});

// Check 3: package.json has required dependencies
console.log('\n✓ Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const requiredDeps = ['next', 'react', 'mongodb', 'next-auth', 'openai'];

requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
        console.log(`  ✅ ${dep} is installed`);
    } else {
        console.log(`  ❌ ERROR: ${dep} is missing!`);
        hasErrors = true;
    }
});

// Check 4: Environment variables template
console.log('\n✓ Checking .env.example...');
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'OPENAI_API_KEY'];

    requiredEnvVars.forEach(envVar => {
        if (envExample.includes(envVar)) {
            console.log(`  ✅ ${envVar} is documented`);
        } else {
            console.log(`  ⚠️  WARNING: ${envVar} not in .env.example`);
            hasWarnings = true;
        }
    });
}

// Check 5: No .env file in git
console.log('\n✓ Checking for sensitive files...');
const sensitiveFiles = ['.env', '.env.local', '.env.production'];
sensitiveFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ⚠️  WARNING: ${file} exists locally (make sure it's in .gitignore)`);
        hasWarnings = true;
    }
});

// Check 6: Build configuration
console.log('\n✓ Checking build configuration...');
const nextConfig = fs.readFileSync(path.join(__dirname, 'next.config.mjs'), 'utf8');
if (nextConfig.includes('output:') && nextConfig.includes('standalone')) {
    console.log('  ⚠️  WARNING: "output: standalone" found - Vercel handles this automatically');
    hasWarnings = true;
} else {
    console.log('  ✅ Build configuration looks good');
}

// Check 7: vercel.json
console.log('\n✓ Checking vercel.json...');
const vercelJsonPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

    if (vercelJson.functions && vercelJson.functions['app/api/**/*.ts']) {
        console.log('  ✅ API function timeout configured');
    } else {
        console.log('  ⚠️  WARNING: API function timeout not configured');
        hasWarnings = true;
    }

    if (vercelJson.env) {
        console.log('  ⚠️  WARNING: Environment variables in vercel.json (use Vercel dashboard instead)');
        hasWarnings = true;
    }
} else {
    console.log('  ✅ No vercel.json (Vercel will use defaults)');
}

// Check 8: TypeScript configuration
console.log('\n✓ Checking TypeScript configuration...');
const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8'));
if (tsconfig.compilerOptions && tsconfig.compilerOptions.strict) {
    console.log('  ✅ Strict mode enabled');
} else {
    console.log('  ⚠️  WARNING: TypeScript strict mode not enabled');
    hasWarnings = true;
}

// Final Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

if (!hasErrors && !hasWarnings) {
    console.log('✅ All checks passed! Ready for deployment.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Push to GitHub: git push origin main');
    console.log('   2. Import to Vercel: https://vercel.com/new');
    console.log('   3. Set Root Directory: medical-platform-nextjs');
    console.log('   4. Add 3 environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)');
    console.log('   5. Deploy!');
    process.exit(0);
} else if (hasErrors) {
    console.log('❌ ERRORS FOUND - Please fix before deploying');
    console.log('\n📖 See VERCEL_DEPLOYMENT_GUIDE.md for help');
    process.exit(1);
} else {
    console.log('⚠️  WARNINGS FOUND - Review before deploying');
    console.log('\n📖 See VERCEL_DEPLOYMENT_GUIDE.md for details');
    console.log('\n🚀 You can still deploy, but review warnings first.');
    process.exit(0);
}
