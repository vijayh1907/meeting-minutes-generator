import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // expose limited, safe APIs here in the future
  platform: process.platform,
});

export {};


