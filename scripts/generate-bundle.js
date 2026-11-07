const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
const seedDir = path.join(__dirname, '..', 'db', 'seed');

const m001 = fs.readFileSync(path.join(migrationsDir, '001_initial_schema.sql'), 'utf8');
const m002 = fs.readFileSync(path.join(migrationsDir, '002_functions_and_triggers.sql'), 'utf8');
const m003 = fs.readFileSync(path.join(migrationsDir, '003_views.sql'), 'utf8');
const m004 = fs.readFileSync(path.join(migrationsDir, '004_security_rls_and_roles.sql'), 'utf8');
const seed = fs.readFileSync(path.join(seedDir, '001_seed_master.sql'), 'utf8');

function escapeBackticks(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

const outContent = `
export const MIGRATIONS = [
  { name: '001_initial_schema.sql', sql: \`${escapeBackticks(m001)}\` },
  { name: '002_functions_and_triggers.sql', sql: \`${escapeBackticks(m002)}\` },
  { name: '003_views.sql', sql: \`${escapeBackticks(m003)}\` },
  { name: '004_security_rls_and_roles.sql', sql: \`${escapeBackticks(m004)}\` },
];

export const MASTER_SEED_SQL = \`${escapeBackticks(seed)}\`;
`;

const targetPath = path.join(__dirname, '..', 'src', 'lib', 'db-schema-bundle.ts');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log('✓ db-schema-bundle.ts generated successfully at', targetPath);

