import { Platform } from 'react-native';

/**
 * Dynamically resolves the correct API base URL:
 *  - Web browser (localhost / same machine) → localhost:8000
 *  - Android emulator                       → 10.0.2.2:8000
 *  - Physical device (iOS/Android)          → LAN IP:8000
 */
const LAN_IP = '10.60.175.190'; // ← update this if your router assigns a new IP

function getApiUrl(): string {
  if (Platform.OS === 'web') {
    // Running in the browser on the same machine as the server
    return 'http://localhost:8000';
  }
  if (Platform.OS === 'android') {
    // Android emulator routes host machine via 10.0.2.2
    // Real device uses LAN IP
    return `http://${LAN_IP}:8000`;
  }
  // iOS simulator or real device
  return `http://${LAN_IP}:8000`;
}

export const API_URL = getApiUrl();
