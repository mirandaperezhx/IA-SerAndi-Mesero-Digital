// ============================================================================
// Notification and Audio Chime Service
// Handles Desktop Pushes, Web Audio oscillators, and Pluggable FCM bindings.
// ============================================================================

export const notificationService = {
  // 1. DESKTOP NOTIFICATIONS (Web Notification API)
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async sendDesktopNotification(title: string, body: string, iconUrl?: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: iconUrl || '/logo.png',
        tag: 'sgp-notification',
        requireInteraction: false
      });
    } catch (e) {
      console.error('Error sending native notification:', e);
    }
  },

  // 2. AUDIO SYNTHESIZER (Web Audio API)
  // Synthesizes a clean premium chime locally so we do not depend on external file downloads!
  playChime(type: 'success' | 'new-order' | 'notification' = 'new-order') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'new-order') {
        // Double ding (High pitch chime)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'success') {
        // Joyful chord rise
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.7);
      } else {
        // Single ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (err) {
      console.warn('AudioContext blocked or failed:', err);
    }
  },

  // 3. PLUGGABLE FIREBASE CLOUD MESSAGING (FCM) Boilerplate
  // This slot is structured for direct deployment config setup.
  async registerFCMToken(userId: string) {
    console.log(`[FCM Config] Registering push channel for user: ${userId}`);
    // Mock setup: In production, you would fetch FCM token using getToken(messaging, { vapidKey })
    // and store it in a 'user_push_tokens' table in Supabase.
    
    // Example:
    // const token = await getMessagingToken();
    // await supabase.from('push_tokens').upsert({ user_id: userId, token });
  },

  simulateFCMPush(title: string, body: string) {
    console.log(`[FCM Backup Notification Sent] ${title} - ${body}`);
    this.sendDesktopNotification(`[Respaldo FCM] ${title}`, body);
  }
};

export default notificationService;
