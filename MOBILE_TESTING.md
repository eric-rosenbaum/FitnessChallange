# Mobile Testing Guide

## Testing on Your Phone (Local Network)

### Option 1: Using Your Local IP Address (Recommended)

1. **Find your computer's local IP address:**
   - **Mac/Linux:** Open Terminal and run:
     ```bash
     ifconfig | grep "inet " | grep -v 127.0.0.1
     ```
     Look for something like `192.168.1.xxx` or `10.0.0.xxx`
   
   - **Windows:** Open Command Prompt and run:
     ```cmd
     ipconfig
     ```
     Look for "IPv4 Address" under your active network adapter

2. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **Make sure your phone and computer are on the same Wi-Fi network**

4. **On your phone's browser, navigate to:**
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   For example: `http://192.168.1.100:3000`

5. **If it doesn't work**, you might need to:
   - Allow port 3000 through your firewall
   - Make sure Next.js is binding to `0.0.0.0` (not just `localhost`)
     - Check `package.json` - the dev script should be `next dev` (which defaults to all interfaces)
     - Or explicitly use: `next dev -H 0.0.0.0`

### Option 2: Using ngrok (Works from anywhere)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok  # on Mac
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`) and open it on your phone

## Testing with Browser DevTools (Quick Testing)

### Chrome/Edge DevTools

1. **Open your app** in Chrome/Edge
2. **Press F12** (or Cmd+Option+I on Mac) to open DevTools
3. **Click the device toggle icon** (or press Cmd+Shift+M / Ctrl+Shift+M)
4. **Select a device** from the dropdown (iPhone, iPad, etc.)
5. **Refresh the page** to see the mobile view

### Firefox DevTools

1. **Open your app** in Firefox
2. **Press F12** to open DevTools
3. **Click the responsive design icon** (or press Cmd+Shift+M / Ctrl+Shift+M)
4. **Select a device** or set custom dimensions

## Mobile Simulators/Emulators

### iOS Simulator (Mac only)

1. **Install Xcode** from the App Store (free, but large download)
2. **Open Xcode** → Open Developer Tool → Simulator
3. **Choose a device** (iPhone 14, iPhone SE, etc.)
4. **Open Safari** in the simulator
5. **Navigate to** `http://localhost:3000` or your local IP

### Android Emulator

1. **Install Android Studio** (free)
2. **Open Android Studio** → Tools → Device Manager
3. **Create a virtual device** (Pixel, Nexus, etc.)
4. **Start the emulator**
5. **Open Chrome** in the emulator
6. **Navigate to** `http://10.0.2.2:3000` (special IP for Android emulator)

## Quick Tips

- **Clear cache** on your phone if you see old styles
- **Use HTTPS** when testing with ngrok (some features require secure context)
- **Test on real devices** when possible - simulators don't always match real behavior
- **Check different screen sizes** - iPhone SE (small), iPhone 14 (medium), iPad (large)
