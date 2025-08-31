import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildQAZip() {
  try {
    console.log('🗜️  Building QA packet ZIP...');
    
    const zip = new JSZip();
    
    // Add runbook.md
    const runbookPath = path.join(__dirname, '..', 'testsprite', 'runbook.md');
    if (fs.existsSync(runbookPath)) {
      const runbookContent = fs.readFileSync(runbookPath, 'utf8');
      zip.file('runbook.md', runbookContent);
      console.log('✅ Added runbook.md');
    } else {
      console.warn('⚠️  runbook.md not found at:', runbookPath);
    }
    
    // Add config.json
    const configPath = path.join(__dirname, '..', 'testsprite', 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      zip.file('config.json', configContent);
      console.log('✅ Added config.json');
    } else {
      console.warn('⚠️  config.json not found at:', configPath);
    }
    
    // Create README.txt with masked packet info
    const readmeContent = `# TestSprite QA Packet - University Assist

## Environment Details
- **Base URL**: https://universityassist25.lovable.app
- **Mode**: QA Testing (Active)
- **Email Sandbox**: Active (No real emails sent)

## Test Accounts
All passwords are provided separately for security.

### Student Account
- Email: student+qa@universityassist.net
- Role: student
- Use Case: Basic user journey, eligibility checking, watchlist

### School Counselor Account  
- Email: counselor+qa@universityassist.net
- Role: school_counselor
- Use Case: Student management, cohort tracking, reporting

### Admin Account
- Email: admin+qa@universityassist.net
- Role: admin
- Use Case: Full system access, data management, configuration

## API Configuration
- TestSprite API Key: ts_1234567890… (masked)
- Full credentials stored separately in TestSprite

## Documentation
- runbook.md: Complete testing procedures and validation points
- config.json: TestSprite configuration and test scenarios

## Security Notes
- No real passwords or full API keys included in this package
- All email communications are sandboxed during testing
- QA mode banner visible on all pages
- Audit logging captures all test activities

## Support
For technical issues or questions about the QA environment, 
check the runbook.md or contact the development team.

Generated: ${new Date().toISOString()}
`;
    
    zip.file('README.txt', readmeContent);
    console.log('✅ Added README.txt');
    
    // Generate the ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    // Write to public directory
    const outputPath = path.join(__dirname, '..', 'public', 'qa-packet.zip');
    fs.writeFileSync(outputPath, zipBuffer);
    
    console.log(`✅ QA packet ZIP created: ${outputPath}`);
    console.log(`📦 Size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ Failed to build QA ZIP:', error);
    process.exit(1);
  }
}

// Run the build
buildQAZip();