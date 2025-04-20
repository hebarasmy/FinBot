// tests/global-teardown.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to Promise-based
const execAsync = promisify(exec);

// Path to the file storing the backend process ID
const PID_FILE = path.join(__dirname, 'backend-pid.txt');

// Remove the parameter completely if not used
async function globalTeardown(/* no parameters */) {
  console.log('Stopping backend server...');
  
  try {
    // Read the process ID from the file
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
      
      // Check if the PID is valid (a number)
      if (pid && /^\d+$/.test(pid)) {
        try {
          // Kill the process
          if (process.platform === 'win32') {
            // Windows
            await execAsync(`taskkill /PID ${pid} /F /T`);
          } else {
            // macOS/Linux
            await execAsync(`kill -9 ${pid}`);
          }
          console.log(`Backend server (PID: ${pid}) stopped successfully.`);
        } catch (error) {
          // Properly type the error
          const killError = error as Error;
          console.error(`Error killing process ${pid}:`, killError.message);
          console.log('Process may have already been terminated or PID is invalid.');
        }
      } else {
        console.log(`Invalid PID found in file: "${pid}". Skipping process termination.`);
      }
      
      // Remove the PID file regardless of whether kill was successful
      try {
        fs.unlinkSync(PID_FILE);
        console.log('PID file removed.');
      } catch (error) {
        // Properly type the error
        const unlinkError = error as Error;
        console.error('Error removing PID file:', unlinkError.message);
      }
    } else {
      console.log('No backend server PID file found. Nothing to clean up.');
    }
  } catch (error) {
    console.error('Error in teardown process:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('Teardown completed.');
}

export default globalTeardown;