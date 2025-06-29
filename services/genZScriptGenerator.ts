export class GenZScriptGenerator {
  private static readonly ACHIEVEMENT_TEMPLATES = [
    {
      type: 'hype_beast',
      scripts: [
        "Yooo, just CRUSHED a {distance}km {activity_type}! 💪 That's {calories} calories absolutely DEMOLISHED. Main character energy fr fr 🔥",
        "Not me casually burning {calories} calories like it's nothing 😎 {distance}km {activity_type} = DONE ✅ We're literally built different 💯",
        "POV: You just witnessed greatness 👑 {distance}km {activity_type} completed and {calories} calories said goodbye forever. This is how we do it! 🚀"
      ]
    },
    {
      type: 'motivational_real',
      scripts: [
        "Real talk: {activity_type} isn't always fun, but crossing that {distance}km finish line? UNMATCHED feeling 🎯 {calories} calories burned, confidence gained 📈",
        "Started from the couch, now we here! 🛋️➡️🏃‍♀️ {distance}km {activity_type} complete. Your future self is literally thanking you rn ✨",
        "That post-workout glow hits different when you know you just burned {calories} calories 😌 {distance}km of pure determination. We love to see it! 💫"
      ]
    },
    {
      type: 'relatable_struggle',
      scripts: [
        "Me: 'I'll just do a quick {activity_type}' Also me: accidentally goes {distance}km and burns {calories} calories 😭 Why am I like this? (But also proud ngl) 🏆",
        "When your legs are screaming but your playlist is HITTING 🎵 Just finished {distance}km {activity_type} - {calories} calories didn't stand a chance 🎧✨",
        "Proof that I can commit to something: {distance}km {activity_type} ✅ {calories} calories burned ✅ Tomorrow I'll probably forget I own running shoes 👟😅"
      ]
    }
  ];

  private static readonly PERSONAL_RECORD_SCRIPTS = [
    "BESTIE I JUST SET A NEW PR! 🚨 {distance}km in record time - we're literally unstoppable now 👑 {calories} calories trembling in fear ⚡",
    "New personal record unlocked! 🔓 Just ran {distance}km faster than ever - main character moment achieved 🌟 {calories} calories could never 💅",
    "Plot twist: I'm actually an athlete now? 👀 New PR alert! {distance}km {activity_type} destroyed. {calories} calories eliminated. Period. 💯"
  ];

  private static readonly MILESTONE_SCRIPTS = [
    "First time hitting {distance}km and I'm EMOTIONAL 🥺 {calories} calories burned but the pride? PRICELESS ✨ We really did that!",
    "Milestone unlocked: {distance}km {activity_type} COMPLETED 🎉 {calories} calories down, confidence UP! This is just the beginning bestie 💪",
    "Not me crying happy tears after my first {distance}km {activity_type} 😭 {calories} calories burned and a whole new level of self-love unlocked 💕"
  ];

  static generateScript(activityData: any, isPersonalRecord = false, isMilestone = false): string {
    let templates: string[];
    
    if (isPersonalRecord) {
      templates = this.PERSONAL_RECORD_SCRIPTS;
    } else if (isMilestone) {
      templates = this.MILESTONE_SCRIPTS;
    } else {
      const randomTemplate = this.getRandomTemplate();
      templates = randomTemplate.scripts;
    }
    
    const script = templates[Math.floor(Math.random() * templates.length)];
    
    return this.replacePlaceholders(script, activityData);
  }

  private static getRandomTemplate() {
    return this.ACHIEVEMENT_TEMPLATES[
      Math.floor(Math.random() * this.ACHIEVEMENT_TEMPLATES.length)
    ];
  }

  private static replacePlaceholders(script: string, data: any): string {
    return script
      .replace(/{distance}/g, data.distance_km?.toFixed(1) || '0')
      .replace(/{activity_type}/g, data.activity_type?.toLowerCase() || 'workout')
      .replace(/{calories}/g, data.calories_burned || '0')
      .replace(/{duration}/g, this.formatDuration(data.duration_seconds));
  }

  private static formatDuration(seconds: number): string {
    if (!seconds) return '0 mins';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }

  static getScriptVariations(activityData: any): string[] {
    // Return multiple script variations for user to choose from
    return [
      this.generateScript(activityData),
      this.generateScript(activityData),
      this.generateScript(activityData)
    ];
  }

  static isGenZOptimized(script: string): boolean {
    // Check if script contains Gen Z elements
    const genZIndicators = ['💪', '🔥', '✨', 'fr fr', 'ngl', 'bestie', 'literally', 'POV:', 'Main character'];
    return genZIndicators.some(indicator => script.includes(indicator));
  }
}