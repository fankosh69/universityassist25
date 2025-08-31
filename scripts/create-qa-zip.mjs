import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

async function createQAZip() {
  console.log('🗜️  Creating QA packet ZIP...');
  
  const zip = new JSZip();
  
  try {
    // Add runbook.md
    const runbookPath = path.join(rootDir, 'testsprite', 'runbook.md');
    if (fs.existsSync(runbookPath)) {
      const content = fs.readFileSync(runbookPath, 'utf8');
      zip.file('runbook.md', content);
      console.log('✅ Added runbook.md');
    }
    
    // Add config.json
    const configPath = path.join(rootDir, 'testsprite', 'config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      zip.file('config.json', content);
      console.log('✅ Added config.json');
    }
    
    // Add README.txt
    const readme = `# TestSprite QA Packet - University Assist

## Environment
- Base URL: https://universityassist25.lovable.app
- QA Mode: Active (banner visible)
- Email Sandbox: Active (no real emails)

## Test Accounts (passwords provided separately)
- Student: student+qa@universityassist.net
- Counselor: counselor+qa@universityassist.net  
- Admin: admin+qa@universityassist.net

## API Configuration
- TestSprite API Key: ts_1234567890… (masked for security)

## Documentation
- runbook.md: Complete testing procedures
- config.json: TestSprite configuration

Generated: ${new Date().toISOString()}
`;
    
    zip.file('README.txt', readme);
    console.log('✅ Added README.txt');
    
    // Generate ZIP and write to public
    const content = await zip.generateAsync({type: "nodebuffer"});
    const outputPath = path.join(rootDir, 'public', 'qa-packet.zip');
    
    fs.writeFileSync(outputPath, content);
    console.log(`✅ ZIP created: ${outputPath} (${Math.round(content.length / 1024)}KB)`);
    
  } catch (error) {
    console.error('❌ Error creating ZIP:', error);
    process.exit(1);
  }
}

createQAZip();