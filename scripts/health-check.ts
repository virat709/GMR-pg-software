#!/usr/bin/env node
/**
 * 3-Day Periodic Project Monitor and Thorough Diagnostics Script
 *
 * Verifies:
 * 1. Project Configuration & Metadata
 * 2. Static Typing & Lint Checks
 * 3. Vitest Unit Test Suite
 * 4. Production Build & Bundle Generation
 * 5. Security & Configuration File Checks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  timestamp: string;
}

const results: CheckResult[] = [];

function runCheck(category: string, name: string, fn: () => void) {
  const timestamp = new Date().toISOString();
  try {
    fn();
    results.push({ category, name, status: 'PASSED', details: 'OK', timestamp });
  } catch (error: any) {
    const errorMsg = error?.stdout?.toString() || error?.message || String(error);
    results.push({ category, name, status: 'FAILED', details: errorMsg.trim(), timestamp });
  }
}

console.log('='.repeat(70));
console.log('🔍 GMR PG SOFTWARE - 3-DAY PERIODIC PROJECT MONITOR & AUDIT');
console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
console.log('='.repeat(70));

// Check 1: Metadata & Blueprint
runCheck('Configuration', 'Verify metadata.json and firebase-blueprint.json exist', () => {
  const rootDir = process.cwd();
  if (!fs.existsSync(path.join(rootDir, 'metadata.json'))) {
    throw new Error('metadata.json missing');
  }
  if (!fs.existsSync(path.join(rootDir, 'firebase-blueprint.json'))) {
    throw new Error('firebase-blueprint.json missing');
  }
});

// Check 2: Firestore security rules
runCheck('Security', 'Verify firestore.rules configuration', () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    throw new Error('firestore.rules missing');
  }
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
  if (!rulesContent.includes('rules_version')) {
    throw new Error('Invalid firestore.rules format');
  }
});

// Check 3: Static Type Checking
runCheck('Quality', 'TypeScript Compiler static typecheck (tsc --noEmit)', () => {
  execSync('npm run lint', { stdio: 'pipe' });
});

// Check 4: Automated Unit Tests
runCheck('Quality', 'Vitest Unit Test Suite execution', () => {
  execSync('npm test', { stdio: 'pipe' });
});

// Check 5: Production Build
runCheck('Build', 'Vite Production Build (npm run build)', () => {
  execSync('npm run build', { stdio: 'pipe' });
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html artifact missing after build');
  }
});

console.log('\n📊 AUDIT SUMMARY REPORT:');
console.log('-'.repeat(70));
let hasFailure = false;
results.forEach(res => {
  const symbol = res.status === 'PASSED' ? '✅' : '❌';
  console.log(`${symbol} [${res.category}] ${res.name}: ${res.status}`);
  if (res.status === 'FAILED') {
    hasFailure = true;
    console.log(`   Error details: ${res.details.substring(0, 200)}...`);
  }
});
console.log('-'.repeat(70));

if (hasFailure) {
  console.error('❌ Periodic Monitor detected problems! Please review the failures above.');
  process.exit(1);
} else {
  console.log('🎉 Periodic Monitor Audit: ALL CHECKS PASSED HEALTHILY! The project is in excellent health.');
  process.exit(0);
}
