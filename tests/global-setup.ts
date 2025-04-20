// tests/global-setup.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
// Store the backend process ID in a file
const PID_FILE = path.join(__dirname, 'backend-pid.txt');

// Remove the parameter completely if not used
async function globalSetup(/* no parameters */) {
  console.log('Starting backend server...');
  
  try {
    // Start the Python backend server
    const backendProcess = spawn('python', ['api/app.py'], {
      detached: true,
      stdio: 'pipe'
    });
    
    // Log stdout and stderr for debugging
    backendProcess.stdout?.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });
    
    backendProcess.stderr?.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });
    
    // Store the process ID for later cleanup
    if (backendProcess.pid !== undefined) {
      fs.writeFileSync(PID_FILE, backendProcess.pid.toString());
      console.log(`Backend server started with PID: ${backendProcess.pid}`);
    } else {
      throw new Error('Failed to get backend process PID');
    }
    
    // Detach the process so it continues running after this script exits
    backendProcess.unref();
    
    // Wait for the server to start
    console.log('Waiting for backend server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Backend server started successfully.');
  } catch (error) {
    console.error('Error starting backend server:', error);
    // Write a fallback value to the PID file
    fs.writeFileSync(PID_FILE, 'error-starting-server');
    throw error; // Re-throw to fail the test setup
  }
}

export default globalSetup;