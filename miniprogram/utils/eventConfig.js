// miniprogram/utils/eventConfig.js
//
// Single source of truth for which event the mini program is currently running.
//
// The event is chosen at runtime from a cloud database flag, so switching events
// (e.g. Mole Day -> Bit Day, one day apart) needs NO code release:
//
//   collection: "settings"
//   doc:        { "type": "activeEvent", "event": "moleday", "windowMode": "currentYear" }
//
//   "event"      - "moleday" | "bitday" | "piday". Optional: when the doc is missing
//                  or unreadable, ACTIVE_EVENT_DEFAULT is used, so the app still runs.
//   "windowMode" - Optional runtime override of the question-window mode below, so an
//                  admin can widen or tighten question release from the cloud console
//                  without shipping a new build.
//
// Per-event fields:
//   tag                  - event tag accepted on scanned QR codes (handleCode.js)
//   logTag               - value written to activityLog.eventTag for this event.
//                          null = write untagged logs (legacy Pi Day behaviour).
//   title                - display name used by the hub / trivia / leaderboard pages
//   banner               - home page banner image (root-absolute path)
//   triviaCollection     - collection holding the trivia questions
//   scavCollection       - collection holding scavenger hunt questions
//   activityLog          - collection holding student answers / points
//   activitiesCollection - collection holding QR activity definitions
//   adminsCollection     - collection holding this event's admins
//   tempCollection       - collection holding short-lived activity QR codes
//   windowMode           - how a question's startTime/endTime decides release:
//       'strict'      - absolute timestamps: open only between the exact stored
//                       startTime and endTime.
//       'currentYear' - the stored window is read for its month/day/time only and
//                       re-interpreted in the current year (Asia/Shanghai), so last
//                       year's questions release on the same calendar dates this year
//                       WITHOUT editing a single question. Windows that cross New Year
//                       are handled.
//       'ignore'      - every question in triviaCollection is open immediately.
//
//   Mole Day / Bit Day use 'currentYear' so last year's question bank releases on the
//   same dates this year with no database edits. If the stored dates turn out not to
//   line up with the event days and the event hub comes up empty, set windowMode to
//   "ignore" on the settings doc above - no code release needed.

export const ACTIVE_EVENT_DEFAULT = 'moleday';

export const WINDOW_MODES = ['strict', 'currentYear', 'ignore'];

export const EVENT_CONFIGS = {
  moleday: {
    tag: 'MD26',
    logTag: 'MD26',
    title: 'Mole Day',
    banner: '/images/moleday.jpg',
    triviaCollection: 'bitDayTrivia',
    scavCollection: 'piDayScav',
    activityLog: 'piDay2026ActivityLog',
    activitiesCollection: 'piDay2026Activities',
    adminsCollection: 'piDay2026Admins',
    tempCollection: 'piDay2026Temp',
    windowMode: 'currentYear',
  },
  bitday: {
    tag: 'BD26',
    logTag: 'BD26',
    title: 'Bit Day',
    banner: '/images/bitday.png',
    triviaCollection: 'bitDayTrivia',
    scavCollection: 'piDayScav',
    activityLog: 'piDay2026ActivityLog',
    activitiesCollection: 'piDay2026Activities',
    adminsCollection: 'piDay2026Admins',
    tempCollection: 'piDay2026Temp',
    windowMode: 'currentYear',
  },
  piday: {
    tag: 'PI26',
    logTag: null,
    title: 'Pi Day',
    banner: '/images/piday2026.jpg',
    triviaCollection: 'piDayTrivia',
    scavCollection: 'piDayScav',
    activityLog: 'piDay2026ActivityLog',
    activitiesCollection: 'piDay2026Activities',
    adminsCollection: 'piDay2026Admins',
    tempCollection: 'piDay2026Temp',
    windowMode: 'strict',
  },
};

// The events are school events in Shanghai, so question windows are always evaluated
// in UTC+8 no matter what time zone the student's phone is set to.
const UTC8_OFFSET_SECONDS = 8 * 60 * 60;

function utc8Parts(unixSeconds) {
  const d = new Date((unixSeconds + UTC8_OFFSET_SECONDS) * 1000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
  };
}

function utc8ToUnix(parts) {
  return Date.UTC(parts.year, parts.month, parts.day, parts.hours, parts.minutes, parts.seconds) / 1000
    - UTC8_OFFSET_SECONDS;
}

// Re-express a stored window using only its month/day/time, in `year`.
function windowInYear(startSeconds, endSeconds, year) {
  const startParts = utc8Parts(startSeconds);
  const endParts = utc8Parts(endSeconds);
  const start = utc8ToUnix({ ...startParts, year });
  let end = utc8ToUnix({ ...endParts, year });
  if (end < start) {
    // Window crosses New Year (e.g. 12/31 23:00 -> 01/01 01:00).
    end = utc8ToUnix({ ...endParts, year: year + 1 });
  }
  return { start, end };
}

// Decide whether a question is open right now. Pure function so it can be reasoned
// about (and tested) on its own.
export function isWindowOpen(startSeconds, endSeconds, windowMode, nowSeconds) {
  if (windowMode === 'ignore') {
    return true;
  }
  if (windowMode !== 'currentYear') {
    return startSeconds <= nowSeconds && nowSeconds <= endSeconds;
  }
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    // Unscheduled question: nothing to place on the calendar, so keep it closed.
    return false;
  }
  const currentYear = utc8Parts(nowSeconds).year;
  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    const w = windowInYear(startSeconds, endSeconds, year);
    if (w.start <= nowSeconds && nowSeconds <= w.end) {
      return true;
    }
  }
  return false;
}

let cached = null;

export async function getActiveEvent() {
  if (cached !== null) {
    return cached;
  }
  let config = EVENT_CONFIGS[ACTIVE_EVENT_DEFAULT];
  try {
    const res = await wx.cloud.database().collection('settings')
      .where({ type: 'activeEvent' })
      .get();
    const doc = res.data.length > 0 ? res.data[0] : undefined;
    const key = doc ? doc.event : undefined;
    if (key !== undefined && EVENT_CONFIGS[key] === undefined) {
      console.error(`Unknown activeEvent "${key}", falling back to ${ACTIVE_EVENT_DEFAULT}`);
    }
    // Copy so the shared EVENT_CONFIGS table is never mutated by a DB override.
    config = { ...(EVENT_CONFIGS[key] || config) };
    if (doc && WINDOW_MODES.indexOf(doc.windowMode) !== -1) {
      config.windowMode = doc.windowMode;
      console.log(`windowMode overridden by settings doc: ${config.windowMode}`);
    }
  } catch (err) {
    console.error('Failed to read activeEvent flag, falling back to', ACTIVE_EVENT_DEFAULT, err);
    config = { ...EVENT_CONFIGS[ACTIVE_EVENT_DEFAULT] };
  }
  cached = config;
  console.log('Active event:', cached.title, cached.tag, 'windowMode:', cached.windowMode);
  return cached;
}
