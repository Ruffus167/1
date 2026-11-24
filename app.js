if (typeof document === 'undefined') {
const CACHE_NAME = 'dayglow-shell-v11';
const APP_SHELL = ['./', './index.html', './app.css', import.meta.url, './christmas.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('dayglow-shell-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy)));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          if (requestUrl.pathname.endsWith('/christmas.html')) {
            const seasonalApp = await caches.match('./christmas.html');
            if (seasonalApp) return seasonalApp;
          }
          const appShell = await caches.match('./index.html');
          if (appShell) return appShell;
        }
        return Response.error();
      })
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() ?? '' };
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Hoilday';
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'You have a calendar update.',
    icon: './icon.svg',
    badge: './icon.svg',
    data: { url: typeof payload.url === 'string' ? payload.url : './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url ?? './', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((client) => client.url === targetUrl);
        if (existingClient) return existingClient.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});

} else {
const STORAGE_KEY = 'dayglow-calendar-events';
const SESSION_STORAGE_KEY = 'dayglow-server-session';
const API_BASE = '/api';
const APP_VERSION_STORAGE_KEY = 'dayglow-app-version';
const PENDING_UPDATE_STORAGE_KEY = 'dayglow-pending-update';
const SETTINGS_KEY = 'dayglow-calendar-settings';
const SENT_REMINDERS_KEY = 'dayglow-calendar-sent-reminders';
const DAILY_WEEKLY_SUMMARY_KEY = 'dayglow-calendar-weekly-summary-sent-date';
const MAX_PROFILE_AVATAR_BYTES = 256 * 1024;
const MAX_PROFILE_IMAGE_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_HOME_BACKGROUND_BYTES = 1024 * 1024;
const MAX_HOME_BACKGROUND_INPUT_BYTES = 5 * 1024 * 1024;
const DEFAULT_HOME_APP_ORDER = ['calendar', 'chat', 'notifications', 'settings', 'browser-appearance', 'profile', 'trading', 'admin', 'report', 'seasonal', 'emojis', 'turkey-fishing', 'thanksgiving-feast', 'christmas', 'topps', 'advent-calendar', 'holiday-fishing', 'holiday-shop', 'text-color-fishing', 'christmas-tree', 'export', 'updates'];
const HOME_APP_LABELS = Object.freeze({
  calendar: 'Calendar',
  chat: 'Messages',
  notifications: 'Notifications',
  settings: 'Settings',
  'browser-appearance': 'Browser appearance',
  profile: 'Profile',
  trading: 'Gifts & trades',
  admin: 'Admin panel',
  report: 'Reporting',
  seasonal: 'Fishing',
  emojis: 'Emoji fishing',
  'turkey-fishing': 'Turkey fishing',
  'thanksgiving-feast': 'Thanksgiving Feast',
  christmas: 'Christmas',
  topps: 'Topps',
  'advent-calendar': 'Advent Calendar',
  'holiday-fishing': 'Holiday fishing',
  'holiday-shop': 'Holiday shop',
  'text-color-fishing': 'Text Color Fishing',
  'christmas-tree': 'Christmas Tree',
  export: 'Export / import',
  updates: 'Updates'
});
const ADVENT_UPDATE_DATE = new Date(2026, 11, 1);
const RANK_RARITIES = Object.freeze({
  Snow: 'Common',
  Present: 'Uncommon',
  Peppermint: 'Rare',
  Fall: 'Rare',
  Santa: 'Epic',
  Cameron: 'Legendary',
  Turkey: 'Epic',
  Holiday: 'Legendary',
  Gingerbread: 'Rare',
  Reindeer: 'Epic',
  Elf: 'Uncommon',
  Snowman: 'Rare',
  'Gummy Bear': 'Epic',
  'Candy Cane': 'Epic',
  'Snow Pup': 'Legendary',
  'Winter Guardian': 'Legendary',
  "Santa's Favorite": 'Mythical',
  Harvest: 'Uncommon',
  Drumstick: 'Rare',
});
const defaultSettings = {
  weeklySummaryEnabled: false,
  notificationsEnabled: false,
  reminderFiveDays: false,
  reminderOneDay: false,
  reminderFiveHours: false,
  reminderOneHour: false,
  email: '',
  theme: 'cobalt',
  weekStartsOn: 'monday',
  timeFormat: '12-hour',
  notificationSound: false,
  soundVolume: 45,
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  defaultEventCategory: 'violet',
  appOrder: [...DEFAULT_HOME_APP_ORDER],
  homeBackground: ''
};
const reminderTypes = [
  { key: 'reminderFiveDays', label: 'in 5 days', days: 5 },
  { key: 'reminderOneDay', label: 'tomorrow', days: 1 },
  { key: 'reminderFiveHours', label: 'in 5 hours', hours: 5 },
  { key: 'reminderOneHour', label: 'in 1 hour', hours: 1 }
];
const categoryNames = {
  violet: 'Dreamy lilac',
  coral: 'Peachy keen',
  mint: 'Mint condition',
  blue: 'Blue skies',
  yellow: 'Golden hour',
  pink: 'Pink pop',
  orange: 'Tangerine',
  teal: 'Sea glass',
  indigo: 'Periwinkle'
};
const categoryIcons = {
  violet: '✦',
  coral: '☼',
  mint: '❋',
  blue: '◈',
  yellow: '✺',
  pink: '♥',
  orange: '☀',
  teal: '≋',
  indigo: '✧'
};
const recurrenceNames = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month'
};

const elements = {
  monthTitle: document.querySelector('#monthTitle'),
  calendarGrid: document.querySelector('#calendarGrid'),
  selectedDayLabel: document.querySelector('#selectedDayLabel'),
  selectedDateTitle: document.querySelector('#selectedDateTitle'),
  dayEvents: document.querySelector('#dayEvents'),
  upcomingList: document.querySelector('#upcomingList'),
  upcomingCount: document.querySelector('#upcomingCount'),
  monthEventCount: document.querySelector('#monthEventCount'),
  dayEventCount: document.querySelector('#dayEventCount'),
  liveMessage: document.querySelector('#liveMessage'),
  errorMessage: document.querySelector('#errorMessage'),
  dialog: document.querySelector('#eventDialog'),
  form: document.querySelector('#eventForm'),
  dialogTitle: document.querySelector('#dialogTitle'),
  dialogEyebrow: document.querySelector('#dialogEyebrow'),
  titleInput: document.querySelector('#eventTitle'),
  dateInput: document.querySelector('#eventDate'),
  timeInput: document.querySelector('#eventTime'),
  categoryInput: document.querySelector('#eventCategory'),
  recurrenceInput: document.querySelector('#eventRecurrence'),
  notesInput: document.querySelector('#eventNotes'),
  eventSearchInput: document.querySelector('#eventSearchInput'),
  eventCategoryFilter: document.querySelector('#eventCategoryFilter'),
  formError: document.querySelector('#formError'),
  deleteButton: document.querySelector('#deleteEventButton'),
  saveButtonText: document.querySelector('#saveButtonText'),
  settingsOverlay: document.querySelector('#settingsOverlay'),
  settingsPanel: document.querySelector('#settingsPanel'),
  settingsForm: document.querySelector('#settingsForm'),
  settingsError: document.querySelector('#settingsError'),
  testNotificationButton: document.querySelector('#testNotificationButton'),
  testNotificationStatus: document.querySelector('#testNotificationStatus'),
  previewBannerButton: document.querySelector('#previewBannerButton'),
  notificationBannerHost: document.querySelector('#notificationBannerHost'),
  notificationForm: document.querySelector('#notificationForm'),
  notificationPermissionStatus: document.querySelector('#notificationPermissionStatus'),
  notificationStatus: document.querySelector('#notificationStatus'),
  previewSoundButton: document.querySelector('#previewSoundButton'),
  audioStatus: document.querySelector('#audioStatus'),
  soundVolume: document.querySelector('#soundVolume'),
  soundVolumeValue: document.querySelector('#soundVolumeValue'),
  emailSummaryButton: document.querySelector('#emailSummaryButton'),
  emailSummaryStatus: document.querySelector('#emailSummaryStatus'),
  weeklySummaryEnabled: document.querySelector('#weeklySummaryEnabled'),
  notificationsEnabled: document.querySelector('#notificationsEnabled'),
  reminderEmail: document.querySelector('#reminderEmail'),
  backgroundTheme: document.querySelector('#backgroundTheme'),
  winterModeNotice: document.querySelector('#winterModeNotice'),
  weekStartsOn: document.querySelector('#weekStartsOn'),
  timeFormat: document.querySelector('#timeFormat'),
  defaultEventCategory: document.querySelector('#defaultEventCategory'),
  calendarDensity: document.querySelector('#calendarDensity'),
  highContrast: document.querySelector('#highContrast'),
  reduceMotion: document.querySelector('#reduceMotion'),
  settingsTabs: [...document.querySelectorAll('[data-settings-tab]')],
  settingsPanels: [...document.querySelectorAll('[data-settings-panel]')],
  homeAppGrid: document.querySelector('#homeAppGrid'),
  homePageDots: document.querySelector('#homePageDots'),
  browserAppearancePage: document.querySelector('#browserAppearancePage'),
  homeBackgroundPreview: document.querySelector('#homeBackgroundPreview'),
  homeBackgroundPreviewEmpty: document.querySelector('#homeBackgroundPreviewEmpty'),
  homeBackgroundInput: document.querySelector('#homeBackgroundInput'),
  removeHomeBackgroundButton: document.querySelector('#removeHomeBackgroundButton'),
  homeBackgroundStatus: document.querySelector('#homeBackgroundStatus'),
  homeAppOrderList: document.querySelector('#homeAppOrderList'),
  homeAppOrderStatus: document.querySelector('#homeAppOrderStatus'),
  resetHomeAppOrderButton: document.querySelector('#resetHomeAppOrderButton'),
  weekdays: document.querySelector('.weekdays'),
  notificationSound: document.querySelector('#notificationSound'),
  reminderControls: reminderTypes.map(({ key }) => document.querySelector(`#${key}`)),
  accountButton: document.querySelector('#accountButton'),
  createAccountButton: document.querySelector('#createAccountButton'),
  sidebarAvatar: document.querySelector('#sidebarAvatar'),
  sidebarUsername: document.querySelector('#sidebarUsername'),
  sidebarRank: document.querySelector('#sidebarRank'),
  reportNavLink: document.querySelector('#reportNavLink'),
  reportPage: document.querySelector('#reportPage'),
  homeScreen: document.querySelector('#homeScreen'),
  homeAdminApp: document.querySelector('#homeAdminApp'),
  homeReportApp: document.querySelector('#homeReportApp'),
  homeChatUnreadBadge: document.querySelector('#homeChatUnreadBadge'),
  homeProfileAvatar: document.querySelector('#homeProfileAvatar'),
  appTopbar: document.querySelector('#appTopbar'),
  reportForm: document.querySelector('#reportForm'),
  reportSignInNotice: document.querySelector('#reportSignInNotice'),
  reportSignInButton: document.querySelector('#reportSignInButton'),
  reportSubject: document.querySelector('#reportSubject'),
  reportMessage: document.querySelector('#reportMessage'),
  reportSubmitButton: document.querySelector('#reportSubmitButton'),
  reportStatus: document.querySelector('#reportStatus'),
  adminNavLink: document.querySelector('#adminNavLink'),
  adminPage: document.querySelector('#adminPage'),
  tradingPage: document.querySelector('#tradingPage'),
  giftForm: document.querySelector('#giftForm'),
  giftRecipient: document.querySelector('#giftRecipient'),
  giftType: document.querySelector('#giftType'),
  giftItem: document.querySelector('#giftItem'),
  giftSubmitButton: document.querySelector('#giftSubmitButton'),
  giftStatus: document.querySelector('#giftStatus'),
  tradeForm: document.querySelector('#tradeForm'),
  tradeRecipient: document.querySelector('#tradeRecipient'),
  tradeOfferedType: document.querySelector('#tradeOfferedType'),
  tradeOfferedItem: document.querySelector('#tradeOfferedItem'),
  tradeRequestedType: document.querySelector('#tradeRequestedType'),
  tradeRequestedItem: document.querySelector('#tradeRequestedItem'),
  tradeSubmitButton: document.querySelector('#tradeSubmitButton'),
  tradeStatus: document.querySelector('#tradeStatus'),
  tradeOfferList: document.querySelector('#tradeOfferList'),
  tradeOfferEmpty: document.querySelector('#tradeOfferEmpty'),
  tradingStatus: document.querySelector('#tradingStatus'),
  exportPage: document.querySelector('#exportPage'),
  exportAccountButton: document.querySelector('#exportAccountButton'),
  exportStatus: document.querySelector('#exportStatus'),
  importAccountForm: document.querySelector('#importAccountForm'),
  importBackupFile: document.querySelector('#importBackupFile'),
  importAccountPassword: document.querySelector('#importAccountPassword'),
  importAccountButton: document.querySelector('#importAccountButton'),
  importStatus: document.querySelector('#importStatus'),
  updatesPage: document.querySelector('#updatesPage'),
  christmasPage: document.querySelector('#christmasPage'),
  updateHistory: document.querySelector('#updateHistory'),
  updatesStatus: document.querySelector('#updatesStatus'),
  adminTabs: [...document.querySelectorAll('[data-admin-tab]')],
  adminPanels: [...document.querySelectorAll('[data-admin-panel]')],
  adminAccountsSearch: document.querySelector('#adminAccountsSearch'),
  adminAccountsList: document.querySelector('#adminAccountsList'),
  adminAccountsStatus: document.querySelector('#adminAccountsStatus'),
  adminRewardForm: document.querySelector('#adminRewardForm'),
  adminRewardTarget: document.querySelector('#adminRewardTarget'),
  adminRewardAction: document.querySelector('#adminRewardAction'),
  adminRewardType: document.querySelector('#adminRewardType'),
  adminRewardItem: document.querySelector('#adminRewardItem'),
  adminRewardQuantity: document.querySelector('#adminRewardQuantity'),
  adminRewardSubmit: document.querySelector('#adminRewardSubmit'),
  adminRewardStatus: document.querySelector('#adminRewardStatus'),
  adminAnnouncementForm: document.querySelector('#adminAnnouncementForm'),
  adminAnnouncementTitle: document.querySelector('#adminAnnouncementTitle'),
  adminAnnouncementMessage: document.querySelector('#adminAnnouncementMessage'),
  adminAnnouncementSubmit: document.querySelector('#adminAnnouncementSubmit'),
  adminAnnouncementClear: document.querySelector('#adminAnnouncementClear'),
  adminAnnouncementCurrent: document.querySelector('#adminAnnouncementCurrent'),
  adminAnnouncementStatus: document.querySelector('#adminAnnouncementStatus'),
  adminEventForm: document.querySelector('#adminEventForm'),
  adminEventId: document.querySelector('#adminEventId'),
  adminEventTitle: document.querySelector('#adminEventTitle'),
  adminEventDate: document.querySelector('#adminEventDate'),
  adminEventTime: document.querySelector('#adminEventTime'),
  adminEventCategory: document.querySelector('#adminEventCategory'),
  adminEventRecurrence: document.querySelector('#adminEventRecurrence'),
  adminEventNotes: document.querySelector('#adminEventNotes'),
  adminEventSubmit: document.querySelector('#adminEventSubmit'),
  adminEventCancelEdit: document.querySelector('#adminEventCancelEdit'),
  adminEventStatus: document.querySelector('#adminEventStatus'),
  adminEventList: document.querySelector('#adminEventList'),
  adminRegistrationToggle: document.querySelector('#adminRegistrationToggle'),
  adminRegistrationStatus: document.querySelector('#adminRegistrationStatus'),
  adminResetPasswordForm: document.querySelector('#adminResetPasswordForm'),
  adminResetAccount: document.querySelector('#adminResetAccount'),
  adminResetNewPassword: document.querySelector('#adminResetNewPassword'),
  adminSecurityPassword: document.querySelector('#adminSecurityPassword'),
  adminResetPasswordButton: document.querySelector('#adminResetPasswordButton'),
  adminSecurityStatus: document.querySelector('#adminSecurityStatus'),
  adminSecuritySessions: document.querySelector('#adminSecuritySessions'),
  adminSecurityAudit: document.querySelector('#adminSecurityAudit'),
  adminMailList: document.querySelector('#adminMailList'),
  adminMailStatus: document.querySelector('#adminMailStatus'),
  adminMailUnreadCount: document.querySelector('#adminMailUnreadCount'),
  adminAdventRewards: document.querySelector('#adminAdventRewards'),
  adminAdventStatus: document.querySelector('#adminAdventStatus'),
  adminOnlineList: document.querySelector('#adminOnlineList'),
  adminOnlineStatus: document.querySelector('#adminOnlineStatus'),
  adminTargetSelect: document.querySelector('#adminTargetSelect'),
  adminWinterToggle: document.querySelector('#adminWinterToggle'),
  adminWinterStatus: document.querySelector('#adminWinterStatus'),
  adminCamelWeatherToggle: document.querySelector('#adminCamelWeatherToggle'),
  adminCamelWeatherStatus: document.querySelector('#adminCamelWeatherStatus'),
  adminChristmasWeatherToggle: document.querySelector('#adminChristmasWeatherToggle'),
  adminChristmasWeatherStatus: document.querySelector('#adminChristmasWeatherStatus'),
  weatherEffects: document.querySelector('#weatherEffects'),
  adminWarningInput: document.querySelector('#adminWarningInput'),
  adminWarnButton: document.querySelector('#adminWarnButton'),
  adminBanDuration: document.querySelector('#adminBanDuration'),
  adminBanButton: document.querySelector('#adminBanButton'),
  adminActionStatus: document.querySelector('#adminActionStatus'),
  adminBanList: document.querySelector('#adminBanList'),
  adminBanStatus: document.querySelector('#adminBanStatus'),
  adminProfile: document.querySelector('#adminProfile'),
  adminProfileAvatar: document.querySelector('#adminProfileAvatar'),
  adminProfileName: document.querySelector('#adminProfileName'),
  adminProfileRank: document.querySelector('#adminProfileRank'),
  adminProfileStats: document.querySelector('#adminProfileStats'),
  adminProfileCollections: document.querySelector('#adminProfileCollections'),
  warningDialog: document.querySelector('#warningDialog'),
  warningDialogMessage: document.querySelector('#warningDialogMessage'),
  closeWarningButton: document.querySelector('#closeWarningButton'),
  autoBanDialog: document.querySelector('#autoBanDialog'),
  autoBanEmoji: document.querySelector('#autoBanEmoji'),
  autoBanTitle: document.querySelector('#autoBanTitle'),
  autoBanReason: document.querySelector('#autoBanReason'),
  autoBanDuration: document.querySelector('#autoBanDuration'),
  closeAutoBanButton: document.querySelector('#closeAutoBanButton'),
  openProfileButton: document.querySelector('#openProfileButton'),
  breadcrumbTitle: document.querySelector('#breadcrumbTitle'),
  calendarPage: document.querySelector('#calendarPage'),
  calendar: document.querySelector('#calendar'),
  monthSummary: document.querySelector('.month-summary'),
  emojisPage: document.querySelector('#emojisPage'),
  emojiCollection: document.querySelector('#emojiCollection'),
  emojiFishButton: document.querySelector('#emojiFishButton'),
  emojiSignInButton: document.querySelector('#emojiSignInButton'),
  clearEmojiButton: document.querySelector('#clearEmojiButton'),
  emojiFishingStatus: document.querySelector('#emojiFishingStatus'),
  emojiStatus: document.querySelector('#emojiStatus'),
  communityTabs: document.querySelector('#communityTabs'),
  communityCalendarTab: document.querySelector('#communityCalendarTab'),
  communityOnlineTab: document.querySelector('#communityOnlineTab'),
  communityOnlineView: document.querySelector('#communityOnlineView'),
  chatPage: document.querySelector('#chatPage'),
  notificationsPage: document.querySelector('#notificationsPage'),
  chatNavLink: document.querySelector('#chatNavLink'),
  chatUnreadBadge: document.querySelector('#chatUnreadBadge'),
  chatTab: document.querySelector('#chatTab'),
  chatOnlineTab: document.querySelector('#chatOnlineTab'),
  chatMessagesPanel: document.querySelector('#chatMessagesPanel'),
  chatOnlinePanel: document.querySelector('#chatOnlinePanel'),
  chatOnlinePrompt: document.querySelector('#chatOnlinePrompt'),
  chatOnlineList: document.querySelector('#chatOnlineList'),
  chatNotificationButton: document.querySelector('#chatNotificationButton'),
  chatClearButton: document.querySelector('#chatClearButton'),
  chatMessages: document.querySelector('#chatMessages'),
  chatSignInPrompt: document.querySelector('#chatSignInPrompt'),
  chatSignInButton: document.querySelector('#chatSignInButton'),
  chatForm: document.querySelector('#chatForm'),
  chatMessageInput: document.querySelector('#chatMessageInput'),
  chatSendButton: document.querySelector('#chatSendButton'),
  chatConnectionStatus: document.querySelector('#chatConnectionStatus'),
  chatStatus: document.querySelector('#chatStatus'),
  updateNotice: document.querySelector('#updateNotice'),
  updateNoticeLabel: document.querySelector('#updateNoticeLabel'),
  updateNoticeTitle: document.querySelector('#updateNoticeTitle'),
  updateNoticeDescription: document.querySelector('#updateNoticeDescription'),
  updateRefreshButton: document.querySelector('#updateRefreshButton'),
  updateDismissButton: document.querySelector('#updateDismissButton'),
  updateDialog: document.querySelector('#updateDialog'),
  updateDialogTitle: document.querySelector('#updateDialogTitle'),
  updateDialogDescription: document.querySelector('#updateDialogDescription'),
  closeUpdateDialogButton: document.querySelector('#closeUpdateDialogButton'),
  globalAnnouncement: document.querySelector('#globalAnnouncement'),
  globalAnnouncementTitle: document.querySelector('#globalAnnouncementTitle'),
  globalAnnouncementMessage: document.querySelector('#globalAnnouncementMessage'),
  dismissGlobalAnnouncement: document.querySelector('#dismissGlobalAnnouncement'),
  seasonalPage: document.querySelector('#seasonalPage'),
  profilePage: document.querySelector('#profilePage'),
  turkeyFishingPage: document.querySelector('#turkeyFishingPage'),
  turkeyFishButton: document.querySelector('#turkeyFishButton'),
  turkeySignInButton: document.querySelector('#turkeySignInButton'),
  turkeyFishingStatus: document.querySelector('#turkeyFishingStatus'),
  ringCollection: document.querySelector('#ringCollection'),
  turkeyCollectionStatus: document.querySelector('#turkeyCollectionStatus'),
  thanksgivingFeastPage: document.querySelector('#thanksgivingFeastPage'),
  thanksgivingDishes: document.querySelector('#thanksgivingDishes'),
  thanksgivingFeastProgress: document.querySelector('#thanksgivingFeastProgress'),
  thanksgivingFeastCountdown: document.querySelector('#thanksgivingFeastCountdown'),
  thanksgivingFeastCountdownTimer: document.querySelector('#thanksgivingFeastCountdownTimer'),
  thanksgivingFeastStatus: document.querySelector('#thanksgivingFeastStatus'),
  thanksgivingFeastReward: document.querySelector('#thanksgivingFeastReward'),
  thanksgivingFeastRewardSummary: document.querySelector('#thanksgivingFeastRewardSummary'),
  thanksgivingEquipColorButton: document.querySelector('#thanksgivingEquipColorButton'),
  thanksgivingColorStatus: document.querySelector('#thanksgivingColorStatus'),
  thanksgivingSignInButton: document.querySelector('#thanksgivingSignInButton'),
  profileAvatarUploadLabel: document.querySelector('#profileAvatarUploadLabel'),
  profileAvatarInput: document.querySelector('#profileAvatarInput'),
  removeProfileAvatarButton: document.querySelector('#removeProfileAvatarButton'),
  profileAvatarStatus: document.querySelector('#profileAvatarStatus'),
  calendarStatus: document.querySelector('#calendarStatus'),
  fishingTab: document.querySelector('#fishingTab'),
  ranksTab: document.querySelector('#ranksTab'),
  questsTab: document.querySelector('#questsTab'),
  fishingPanel: document.querySelector('#fishingPanel'),
  ranksPanel: document.querySelector('#ranksPanel'),
  questsPanel: document.querySelector('#questsPanel'),
  harvestStartButton: document.querySelector('#harvestStartButton'),
  harvestGame: document.querySelector('#harvestGame'),
  harvestClue: document.querySelector('#harvestClue'),
  harvestChoices: document.querySelector('#harvestChoices'),
  harvestQuestStatus: document.querySelector('#harvestQuestStatus'),
  drumstickStartButton: document.querySelector('#drumstickStartButton'),
  drumstickGame: document.querySelector('#drumstickGame'),
  drumstickSignal: document.querySelector('#drumstickSignal'),
  drumstickReactButton: document.querySelector('#drumstickReactButton'),
  drumstickQuestStatus: document.querySelector('#drumstickQuestStatus'),
  questsStatus: document.querySelector('#questsStatus'),
  catchFishButton: document.querySelector('#catchFishButton'),
  catchStatus: document.querySelector('#catchStatus'),
  profileAvatar: document.querySelector('#profileAvatar'),
  profileUsername: document.querySelector('#profileUsername'),
  profileCaption: document.querySelector('#profileCaption'),
  profileRank: document.querySelector('#profileRank'),
  profileRankList: document.querySelector('#profileRankList'),
  profileRankEmpty: document.querySelector('#profileRankEmpty'),
  profileRankStatus: document.querySelector('#profileRankStatus'),
  profileEmojiList: document.querySelector('#profileEmojiList'),
  profileEmojiEmpty: document.querySelector('#profileEmojiEmpty'),
  profileEmojiStatus: document.querySelector('#profileEmojiStatus'),
  profileRingList: document.querySelector('#profileRingList'),
  profileRingEmpty: document.querySelector('#profileRingEmpty'),
  profileRingStatus: document.querySelector('#profileRingStatus'),
  profileTextColorList: document.querySelector('#profileTextColorList'),
  profileTextColorEmpty: document.querySelector('#profileTextColorEmpty'),
  profileTextColorStatus: document.querySelector('#profileTextColorStatus'),
  profileFishCount: document.querySelector('#profileFishCount'),
  profileFishButton: document.querySelector('#profileFishButton'),
  onlineList: document.querySelector('#onlineList'),
  saveStatusText: document.querySelector('#saveStatusText'),
  privacyNoteText: document.querySelector('#privacyNoteText'),
  addEventButton: document.querySelector('#addEventButton'),
  personalCalendarButton: document.querySelector('#personalCalendarButton'),
  communityCalendarButton: document.querySelector('#communityCalendarButton'),
  authDialog: document.querySelector('#authDialog'),
  authForm: document.querySelector('#authForm'),
  authTitle: document.querySelector('#authTitle'),
  authDescription: document.querySelector('#authDescription'),
  authUsername: document.querySelector('#authUsername'),
  authPassword: document.querySelector('#authPassword'),
  authMessage: document.querySelector('#authMessage'),
  authModeButton: document.querySelector('#authModeButton'),
  authSubmitButton: document.querySelector('#authSubmitButton')
};

const homeAppButtons = new Map(
  [...elements.homeAppGrid.querySelectorAll('[data-app-id]')].map((button) => [button.dataset.appId, button])
);

const today = new Date();
today.setHours(0, 0, 0, 0);

let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = toDateKey(today);
let editingEventId = null;
let events = loadEvents();
let settings = loadSettings();
let audioContext;
let weeklySummarySentDate = null;
let calendarMode = 'personal';
let communityView = 'calendar';
let chatView = 'chat';
let currentUser = null;
let currentProfile = null;
let turkeyRingCatalog = [];
let turkeyFishingInProgress = false;
let seasonalInfoState = null;
let authMode = 'sign-in';
let calendarModeRequestId = 0;
let communityFetchRequestId = 0;
let activePage = 'home';
let lastChatMessageId = 0;
let chatGeneration = null;
let chatRenderEpoch = 0;
let chatRequestInProgress = false;
let chatUnreadCount = 0;
let appUpdateCheckInProgress = false;
let appUpdateReloadPending = false;
let sideQuestLoadInProgress = false;
let drumstickReadyTimer = null;
let emojiCatalog = [];
let emojiFishingInProgress = false;
let emojiCollectionRequestId = 0;
let adminRefreshInProgress = false;
let adminAccounts = [];
let adminSecurityData = null;
let adminRewardCatalog = null;
let adminEvents = [];
let currentGlobalAnnouncement = null;
let globalAnnouncementSyncInProgress = false;
let winterModeEnabled = false;
let camelWeatherEnabled = false;
let christmasWeatherEnabled = false;
let winterModeRequestInProgress = false;
let renderedWeatherMode = null;
let warningPollInProgress = false;
let pendingWarnings = [];
let tradingData = null;
let tradingLoadRequestId = 0;

function tradingItems(type, ownedOnly = false, recipientName = '') {
  const catalog = tradingData?.[`${type}s`] ?? [];
  const ownedKey = type === 'rank' ? 'unlocked_ranks' : type === 'emoji' ? 'unlocked_emojis' : 'unlocked_rings';
  const ownedIds = new Set(Array.isArray(currentProfile?.[ownedKey]) ? currentProfile[ownedKey] : []);
  const recipient = tradingData?.members?.find((member) => member.username === recipientName);
  const recipientIds = new Set(recipient?.collections?.[type] ?? []);
  return catalog.filter((item) =>
    (!ownedOnly || ownedIds.has(item.id)) &&
    (!recipientName || !recipientIds.has(item.id))
  );
}

function requestedTradingItems(type, recipientName) {
  const catalog = tradingData?.[`${type}s`] ?? [];
  const ownedKey = type === 'rank' ? 'unlocked_ranks' : type === 'emoji' ? 'unlocked_emojis' : 'unlocked_rings';
  const ownedIds = new Set(Array.isArray(currentProfile?.[ownedKey]) ? currentProfile[ownedKey] : []);
  const recipient = tradingData?.members?.find((member) => member.username === recipientName);
  const recipientIds = new Set(recipient?.collections?.[type] ?? []);
  return catalog.filter((item) => recipientIds.has(item.id) && !ownedIds.has(item.id));
}

function tradingItemLabel(type, item) {
  if (type === 'emoji') return `${item.symbol} ${item.name}`;
  return item.name;
}

function populateTradingSelect(select, type, items, placeholder) {
  const selected = select.value;
  const options = items.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} (${item.id})`;
    return option;
  });
  if (items.some((item) => item.symbol)) {
    options.forEach((option, index) => {
      option.textContent = tradingItemLabel(type, items[index]);
    });
  }
  if (!options.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    options.push(option);
  }
  select.replaceChildren(...options);
  select.value = items.some((item) => item.id === selected) ? selected : options[0].value;
  select.disabled = !currentUser || items.length === 0;
}

function populateTradingRecipientSelect(select) {
  const selected = select.value;
  const options = (tradingData?.members ?? []).map((member) => {
    const option = document.createElement('option');
    option.value = member.username;
    option.textContent = member.is_bot
      ? `${member.username} (BOT · fair trades only)`
      : member.username;
    return option;
  });
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose a member';
  options.unshift(placeholder);
  select.replaceChildren(...options);
  select.value = options.some((option) => option.value === selected) ? selected : '';
  select.disabled = !currentUser || !tradingData?.members?.length;
}

function updateTradingSelects() {
  populateTradingRecipientSelect(elements.giftRecipient);
  populateTradingRecipientSelect(elements.tradeRecipient);
  const giftItems = tradingItems(elements.giftType.value, true, elements.giftRecipient.value);
  const offeredItems = tradingItems(elements.tradeOfferedType.value, true, elements.tradeRecipient.value);
  const requestedItems = requestedTradingItems(elements.tradeRequestedType.value, elements.tradeRecipient.value);
  populateTradingSelect(elements.giftItem, elements.giftType.value, giftItems, 'No items available');
  populateTradingSelect(elements.tradeOfferedItem, elements.tradeOfferedType.value, offeredItems, 'No items available');
  populateTradingSelect(elements.tradeRequestedItem, elements.tradeRequestedType.value, requestedItems, 'No items available');
  elements.giftSubmitButton.disabled = !currentUser || !elements.giftRecipient.value || !elements.giftItem.value;
  elements.tradeSubmitButton.disabled = !currentUser || !elements.tradeRecipient.value ||
    !elements.tradeOfferedItem.value || !elements.tradeRequestedItem.value;
}

function renderTradeOffers() {
  const offers = tradingData?.offers ?? [];
  elements.tradeOfferEmpty.hidden = offers.length > 0;
  elements.tradeOfferEmpty.textContent = currentUser
    ? offers.length ? '' : 'No trade offers yet.'
    : 'Sign in to see trade offers.';
  elements.tradeOfferList.replaceChildren(...offers.map((offer) => {
    const card = document.createElement('article');
    card.className = 'trade-offer';
    const summary = document.createElement('p');
    summary.textContent = offer.direction === 'incoming'
      ? `From ${offer.other_username}: ${offer.offered_item_name} for your ${offer.requested_item_name}.`
      : `To ${offer.other_username}: your ${offer.offered_item_name} for their ${offer.requested_item_name}.`;
    const status = document.createElement('small');
    status.textContent = `${offer.status[0].toUpperCase()}${offer.status.slice(1)} · ${new Date(offer.created_at * 1000).toLocaleString()}`;
    card.append(summary, status);
    if (offer.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'trade-offer-actions';
      const buttonActions = offer.direction === 'incoming'
        ? [['accept', 'Accept'], ['decline', 'Decline']]
        : [['cancel', 'Cancel']];
      buttonActions.forEach(([action, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.tradeAction = action;
        button.dataset.offerId = String(offer.id);
        button.textContent = label;
        actions.append(button);
      });
      card.append(actions);
    }
    return card;
  }));
}

async function loadTrading() {
  const requestId = ++tradingLoadRequestId;
  if (!currentUser) {
    tradingData = null;
    updateTradingSelects();
    renderTradeOffers();
    elements.tradingStatus.textContent = 'Sign in to send gifts or trade collectibles.';
    return;
  }
  elements.tradingStatus.textContent = 'Loading your collection and trade offers…';
  try {
    const result = await apiRequest('/trading');
    if (requestId !== tradingLoadRequestId) return;
    if (
      !result.profile ||
      !['ranks', 'emojis', 'rings', 'members', 'offers'].every((key) => Array.isArray(result[key])) ||
      result.members.some((member) =>
        !member ||
        typeof member.username !== 'string' ||
        typeof member.is_bot !== 'boolean' ||
        !member.collections ||
        !['rank', 'emoji', 'ring'].every((type) => Array.isArray(member.collections[type]))
      )
    ) {
      throw new Error('The server returned an invalid trading collection.');
    }
    tradingData = result;
    currentProfile = result.profile;
    currentUser = { ...currentUser, ...result.profile };
    updateTradingSelects();
    renderTradeOffers();
    render();
    elements.tradingStatus.textContent = '';
  } catch (error) {
    if (requestId !== tradingLoadRequestId) return;
    elements.tradingStatus.textContent = `Trading data could not be loaded: ${error.message}`;
  }
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response. Is the Hoilday server running?');
  }
  if (!response.ok) {
    const error = new Error(result.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.autoBan = result.auto_ban;
    throw error;
  }
  return result;
}

async function resizeProfileImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_PROFILE_IMAGE_INPUT_BYTES) {
    throw new Error('Choose an image smaller than 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 20_000_000) {
      throw new Error('Choose an image with dimensions under 20 megapixels.');
    }
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the profile picture.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.86, 0.72, 0.58, 0.44]) {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Your browser could not encode the profile picture.')),
          'image/jpeg',
          quality
        );
      });
      if (blob.size <= MAX_PROFILE_AVATAR_BYTES) return blob;
    }
    throw new Error('The image could not be compressed below 256 KB.');
  } finally {
    bitmap.close();
  }
}

async function resizeHomeBackground(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_HOME_BACKGROUND_INPUT_BYTES) {
    throw new Error('Choose an image smaller than 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 20_000_000) {
      throw new Error('Choose an image with dimensions under 20 megapixels.');
    }
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the background image.');
    context.fillStyle = '#171d31';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.84, 0.7, 0.56, 0.42, 0.3]) {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Your browser could not encode the background image.')),
          'image/jpeg',
          quality
        );
      });
      if (blob.size <= MAX_HOME_BACKGROUND_BYTES) return blob;
    }
    throw new Error('The image could not be compressed to fit this browser’s storage.');
  } finally {
    bitmap.close();
  }
}

async function uploadProfileImage(blob) {
  const token = localStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: blob
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response while saving your picture.');
  }
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

const PROFILE_RING_IDS = ['white', 'red', 'peppermint', 'gold', 'santa', 'turkey', 'present', 'christmas', 'candy_cane', 'cookie', 'snow', 'north_star', 'harvest_feast'];
const RING_DECORATIONS = Object.freeze({
  santa: '🎅',
  turkey: '🦃',
  present: '🎁🎁🎁',
  christmas: '🎄',
  cookie: '🍪',
  snow: '❄️',
  north_star: '🌟',
  harvest_feast: '🍂'
});

function createCandyCaneIcon(className = 'ring-icon-svg') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 72 48');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  for (const pathData of [
    'M24 44V15a7 7 0 0 0-14 0v5',
    'M29 44V10a7 7 0 0 1 14 0v5',
    'M48 44V15a7 7 0 0 1 14 0v5'
  ]) {
    const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    base.setAttribute('d', pathData);
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', '#fff8ee');
    base.setAttribute('stroke-width', '5');
    base.setAttribute('stroke-linecap', 'round');
    svg.append(base);
    const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stripe.setAttribute('d', pathData);
    stripe.setAttribute('fill', 'none');
    stripe.setAttribute('stroke', '#e33b4d');
    stripe.setAttribute('stroke-width', '5');
    stripe.setAttribute('stroke-linecap', 'round');
    stripe.setAttribute('stroke-dasharray', '4 6');
    svg.append(stripe);
  }
  return svg;
}

function createChristmasLights(className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const wire = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  wire.setAttribute('cx', '50');
  wire.setAttribute('cy', '50');
  wire.setAttribute('r', '43');
  wire.setAttribute('fill', 'none');
  wire.setAttribute('stroke', '#e9e1b5');
  wire.setAttribute('stroke-width', '2');
  wire.setAttribute('stroke-dasharray', '2 2');
  wire.setAttribute('opacity', '.75');
  svg.append(wire);

  const colors = ['#ff4057', '#ffd447', '#35c9ff', '#72e48a', '#c47aff', '#ff884b', '#44e0d1', '#ff67aa', '#8ee53f', '#5596ff', '#ffb938', '#f35cff'];
  colors.forEach((color, index) => {
    const angle = (index / colors.length) * Math.PI * 2 - Math.PI / 2;
    const cx = 50 + Math.cos(angle) * 43;
    const cy = 50 + Math.sin(angle) * 43;
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', String(cx));
    glow.setAttribute('cy', String(cy));
    glow.setAttribute('r', '7.5');
    glow.setAttribute('fill', color);
    glow.setAttribute('opacity', '.32');
    svg.append(glow);

    const bulb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bulb.setAttribute('class', 'light-bulb');
    bulb.setAttribute('cx', String(cx));
    bulb.setAttribute('cy', String(cy));
    bulb.setAttribute('r', '4.8');
    bulb.setAttribute('fill', color);
    bulb.setAttribute('stroke', '#fff8dc');
    bulb.setAttribute('stroke-width', '1.2');
    bulb.style.animationDelay = `${index * 0.1}s`;
    svg.append(bulb);
  });
  return svg;
}

function createRingPreviewAvatar() {
  const avatar = document.createElement('span');
  avatar.className = 'ring-preview-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  head.setAttribute('cx', '16');
  head.setAttribute('cy', '11');
  head.setAttribute('r', '6');
  head.setAttribute('fill', '#f4cba3');
  const shoulders = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shoulders.setAttribute('d', 'M3 32c.8-8.2 5.1-12.5 13-12.5S28.2 23.8 29 32Z');
  shoulders.setAttribute('fill', '#453c70');
  svg.append(head, shoulders);
  avatar.append(svg);
  return avatar;
}

function createRingDecoration(ringId, compact = false) {
  if (ringId === 'candy_cane') {
    const decoration = document.createElement('span');
    decoration.className = 'avatar-ring-decoration';
    decoration.append(createCandyCaneIcon());
    return decoration;
  }
  const symbol = RING_DECORATIONS[ringId];
  if (!symbol) return null;
  const decoration = document.createElement('span');
  decoration.className = 'avatar-ring-decoration';
  decoration.textContent = symbol;
  decoration.setAttribute('aria-hidden', 'true');
  if (ringId === 'turkey') {
    const leaves = document.createElement('span');
    leaves.className = 'avatar-ring-leaves';
    leaves.textContent = '🍂';
    decoration.append(leaves);
  }
  if (compact) decoration.classList.add('avatar-ring-decoration-compact');
  return decoration;
}

function applyAvatarRing(element, ringId) {
  element.querySelectorAll('.avatar-ring-frame, .avatar-ring-decoration, .avatar-ring-lights').forEach((item) => item.remove());
  PROFILE_RING_IDS.forEach((id) => element.classList.remove(`ring-avatar-${id}`));
  if (!PROFILE_RING_IDS.includes(ringId)) {
    delete element.dataset.ring;
    return;
  }
  element.dataset.ring = ringId;
  element.classList.add(`ring-avatar-${ringId}`);
  const frame = document.createElement('span');
  frame.className = 'avatar-ring-frame';
  frame.dataset.ring = ringId;
  frame.setAttribute('aria-hidden', 'true');
  element.append(frame);
  if (ringId === 'christmas') element.append(createChristmasLights('avatar-ring-lights'));
  const decoration = createRingDecoration(ringId, element.classList.contains('chat-avatar') || element.classList.contains('online-avatar'));
  if (decoration) element.append(decoration);
}

function renderAvatar(element, username, avatarUrl, equippedRing = '') {
  element.replaceChildren();
  applyAvatarRing(element, equippedRing);
  if (!avatarUrl) {
    const initial = document.createElement('span');
    initial.textContent = username ? username.slice(0, 1).toUpperCase() : '?';
    element.prepend(initial);
    return;
  }
  const image = document.createElement('img');
  image.src = avatarUrl;
  image.alt = '';
  image.onerror = () => {
    image.remove();
    const initial = document.createElement('span');
    initial.textContent = username ? username.slice(0, 1).toUpperCase() : '?';
    element.prepend(initial);
  };
  element.prepend(image);
}

async function uploadSelectedProfilePicture(file) {
  elements.profileAvatarStatus.textContent = 'Preparing your profile picture…';
  elements.profileAvatarInput.disabled = true;
  try {
    const blob = await resizeProfileImage(file);
    const result = await uploadProfileImage(blob);
    if (!result.user || typeof result.user.avatar_url !== 'string') {
      throw new Error('The server returned an invalid profile.');
    }
    currentProfile = result.user;
    currentUser = { ...currentUser, ...result.user };
    renderProfile();
    elements.profileAvatarStatus.textContent = 'Profile picture saved. It will appear beside your name in chat and the online list.';
    void syncOnlineUsers();
    if (activePage === 'chat') void syncChatMessages(true);
  } catch (error) {
    elements.profileAvatarStatus.textContent = `Profile picture could not be saved: ${error.message}`;
  } finally {
    elements.profileAvatarInput.disabled = false;
    elements.profileAvatarInput.value = '';
  }
}

async function removeProfilePicture() {
  elements.profileAvatarStatus.textContent = '';
  elements.removeProfileAvatarButton.disabled = true;
  try {
    const result = await apiRequest('/profile/avatar', { method: 'DELETE' });
    if (!result.user || result.user.avatar_url) {
      throw new Error('The server did not remove the profile picture.');
    }
    currentProfile = result.user;
    currentUser = { ...currentUser, ...result.user };
    renderProfile();
    elements.profileAvatarStatus.textContent = 'Profile picture removed.';
    void syncOnlineUsers();
    if (activePage === 'chat') void syncChatMessages(true);
  } catch (error) {
    elements.profileAvatarStatus.textContent = `Profile picture could not be removed: ${error.message}`;
  } finally {
    elements.removeProfileAvatarButton.disabled = false;
  }
}

function createUserAvatar(avatarUrl, className, equippedRing, username) {
  if (!avatarUrl && !PROFILE_RING_IDS.includes(equippedRing)) return null;
  const avatar = document.createElement('span');
  avatar.className = className;
  applyAvatarRing(avatar, equippedRing);
  if (!avatarUrl) {
    avatar.textContent = username ? username.slice(0, 1).toUpperCase() : '?';
    return avatar;
  }
  const image = document.createElement('img');
  image.src = avatarUrl;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.onerror = () => image.remove();
  avatar.prepend(image);
  return avatar;
}

function normalizeHomeAppOrder(value) {
  const savedOrder = Array.isArray(value)
    ? value.filter((appId, index) =>
      Object.hasOwn(HOME_APP_LABELS, appId) && value.indexOf(appId) === index)
    : [];
  return [...savedOrder, ...DEFAULT_HOME_APP_ORDER.filter((appId) => !savedOrder.includes(appId))];
}

function renderHomePageDots() {
  if (!elements.homePageDots) return;
  const pages = [...elements.homeAppGrid.querySelectorAll('.home-app-page')];
  elements.homePageDots.replaceChildren(...pages.map((page, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `home-page-dot${index === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to home screen page ${index + 1}`);
    dot.addEventListener('click', () => {
      elements.homeAppGrid.scrollTo({
        left: elements.homeAppGrid.clientWidth * index,
        behavior: 'smooth'
      });
    });
    return dot;
  }));
  elements.homePageDots.hidden = pages.length <= 1;
}

elements.homeAppGrid.addEventListener('scroll', () => {
  if (!elements.homePageDots || elements.homePageDots.hidden) return;
  const pageIndex = Math.round(elements.homeAppGrid.scrollLeft / elements.homeAppGrid.clientWidth);
  elements.homePageDots.querySelectorAll('.home-page-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === pageIndex);
  });
}, { passive: true });

function renderHomeAppOrder() {
  const visibleButtons = settings.appOrder
    .map((appId) => homeAppButtons.get(appId))
    .filter((app) => app && !app.hidden);
  const mobile = window.innerWidth <= 680;
  const firstCapacity = mobile ? 12 : 15;
  elements.homeAppGrid.replaceChildren();
  let start = 0;
  while (start < visibleButtons.length) {
    const page = document.createElement('div');
    page.className = 'home-app-page';
    const capacity = start === 0 ? firstCapacity : (mobile ? 16 : 15);
    page.append(...visibleButtons.slice(start, start + capacity));
    elements.homeAppGrid.append(page);
    start += capacity;
  }
  renderHomePageDots();
  const visibleOrder = settings.appOrder.filter((appId) => {
    const app = homeAppButtons.get(appId);
    return app && !app.hidden;
  });
  elements.homeAppOrderList.replaceChildren(...visibleOrder.map((appId, index) => {
    const item = document.createElement('li');
    item.dataset.appId = appId;
    const name = document.createElement('span');
    name.className = 'home-app-order-name';
    name.textContent = HOME_APP_LABELS[appId];
    const actions = document.createElement('span');
    actions.className = 'home-app-order-actions';
    for (const [direction, label, symbol] of [
      ['up', 'Move up', '↑'],
      ['down', 'Move down', '↓']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.orderMove = direction;
      button.setAttribute('aria-label', `${label} ${HOME_APP_LABELS[appId]}`);
      button.textContent = symbol;
      button.disabled = direction === 'up' ? index === 0 : index === visibleOrder.length - 1;
      actions.append(button);
    }
    item.append(name, actions);
    return item;
  }));
}

function loadSettings() {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!storedSettings) return { ...defaultSettings, appOrder: [...DEFAULT_HOME_APP_ORDER] };
    const parsedSettings = JSON.parse(storedSettings);
    if (!parsedSettings || typeof parsedSettings !== 'object' || Array.isArray(parsedSettings)) {
      throw new Error('Saved settings are not valid.');
    }

    return {
      weeklySummaryEnabled: parsedSettings.weeklySummaryEnabled === true,
      notificationsEnabled: parsedSettings.notificationsEnabled === true,
      reminderFiveDays: parsedSettings.reminderFiveDays === true,
      reminderOneDay: parsedSettings.reminderOneDay === true,
      reminderFiveHours: parsedSettings.reminderFiveHours === true,
      reminderOneHour: parsedSettings.reminderOneHour === true,
      email: typeof parsedSettings.email === 'string' ? parsedSettings.email : '',
      theme: ['midnight', 'plum', 'ocean', 'forest', 'sunset', 'candy', 'lagoon', 'citrus', 'cobalt', 'berry'].includes(parsedSettings.theme)
        ? parsedSettings.theme
        : defaultSettings.theme,
      weekStartsOn: ['monday', 'sunday'].includes(parsedSettings.weekStartsOn) ? parsedSettings.weekStartsOn : 'monday',
      timeFormat: ['12-hour', '24-hour'].includes(parsedSettings.timeFormat) ? parsedSettings.timeFormat : '12-hour',
      notificationSound: parsedSettings.notificationSound === true,
      soundVolume: Number.isInteger(parsedSettings.soundVolume) && parsedSettings.soundVolume >= 0 && parsedSettings.soundVolume <= 100
        ? parsedSettings.soundVolume
        : defaultSettings.soundVolume,
      density: ['comfortable', 'compact'].includes(parsedSettings.density) ? parsedSettings.density : defaultSettings.density,
      highContrast: parsedSettings.highContrast === true,
      reduceMotion: parsedSettings.reduceMotion === true,
      defaultEventCategory: Object.hasOwn(categoryNames, parsedSettings.defaultEventCategory)
        ? parsedSettings.defaultEventCategory
        : defaultSettings.defaultEventCategory,
      appOrder: normalizeHomeAppOrder(parsedSettings.appOrder),
      homeBackground: typeof parsedSettings.homeBackground === 'string' &&
        parsedSettings.homeBackground.length <= Math.ceil(MAX_HOME_BACKGROUND_BYTES / 3) * 4 + 30 &&
        /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(parsedSettings.homeBackground)
        ? parsedSettings.homeBackground
        : ''
    };
  } catch (error) {
    elements.errorMessage.textContent = `Your settings could not be loaded: ${error.message}`;
    return { ...defaultSettings, appOrder: [...DEFAULT_HOME_APP_ORDER] };
  }
}

function applySettings() {
  const globalWeather = christmasWeatherEnabled
    ? 'christmas'
    : camelWeatherEnabled
      ? 'camel'
      : winterModeEnabled
        ? 'winter'
        : null;
  document.body.dataset.theme = globalWeather ?? settings.theme;
  elements.winterModeNotice.hidden = !globalWeather;
  elements.winterModeNotice.textContent = christmasWeatherEnabled
    ? 'Christmas Weather is active for everyone. Your saved theme will return when an admin turns it off.'
    : camelWeatherEnabled
      ? 'Camel Weather is active for everyone. Your saved theme will return when an admin turns it off.'
      : 'Winter mode is active for everyone. Your saved theme will return when an admin turns it off.';
  updateWeatherEffects();
  document.querySelector('meta[name="theme-color"]').content =
    getComputedStyle(document.body).getPropertyValue('--page').trim();
  document.body.dataset.density = settings.density;
  document.body.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  document.body.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
  applyHomeBackground();
  renderHomeBackgroundPreview();
}

function applyHomeBackground() {
  if (settings.homeBackground) {
    elements.homeScreen.style.setProperty(
      '--home-screen-background',
      `linear-gradient(rgba(8, 12, 25, .38), rgba(8, 12, 25, .38)), url("${settings.homeBackground}")`
    );
    return;
  }
  if (currentProfile?.holiday?.advent_background_unlocked) {
    elements.homeScreen.style.setProperty(
      '--home-screen-background',
      'radial-gradient(ellipse at 18% 18%, rgba(245, 77, 88, .48), transparent 36%), radial-gradient(ellipse at 82% 76%, rgba(67, 207, 129, .42), transparent 42%), linear-gradient(145deg, #153d30, #24203b 58%, #6a2935)'
    );
    return;
  } else {
    elements.homeScreen.style.removeProperty('--home-screen-background');
  }
}

function renderHomeBackgroundPreview() {
  const image = settings.homeBackground ? document.createElement('img') : null;
  if (image) {
    image.src = settings.homeBackground;
    image.alt = 'Current home-screen background';
  }
  elements.homeBackgroundPreview.replaceChildren(image ?? elements.homeBackgroundPreviewEmpty);
  elements.homeBackgroundPreviewEmpty.hidden = Boolean(image);
}

function updateWeatherEffects() {
  const mode = christmasWeatherEnabled
    ? 'christmas'
    : camelWeatherEnabled
      ? 'camel'
      : winterModeEnabled
        ? 'winter'
        : null;
  elements.weatherEffects.hidden = !mode;
  if (!mode) {
    elements.weatherEffects.replaceChildren();
    renderedWeatherMode = null;
    return;
  }
  if (mode === renderedWeatherMode && elements.weatherEffects.childElementCount) return;
  elements.weatherEffects.replaceChildren();
  renderedWeatherMode = mode;
  const count = mode === 'christmas' ? 42 : mode === 'camel' ? 28 : 20;
  for (let index = 0; index < count; index += 1) {
    const emoji = document.createElement('span');
    emoji.className = mode === 'christmas'
      ? 'weather-effect weather-effect-christmas'
      : mode === 'camel'
        ? 'weather-effect weather-effect-camel'
        : 'weather-effect';
    emoji.textContent = mode === 'christmas' ? '🎄' : mode === 'camel' ? '🐪' : '❄️';
    emoji.style.setProperty('--flake-left', `${(index * 37) % 100}%`);
    emoji.style.setProperty('--flake-size', mode === 'christmas'
      ? `${36 + (index % 4) * 12}px`
      : mode === 'camel'
        ? `${88 + (index % 5) * 18}px`
        : `${36 + (index % 5) * 12}px`);
    emoji.style.setProperty('--flake-drift', `${index % 2 === 0 ? -64 : 64}px`);
    emoji.style.setProperty('--flake-duration', mode === 'christmas'
      ? `${7 + (index % 6) * 2}s`
      : mode === 'camel'
        ? `${8 + (index % 5) * 2}s`
        : `${10 + (index % 6) * 2}s`);
    emoji.style.setProperty('--flake-delay', `-${(index * 1.7) % 16}s`);
    elements.weatherEffects.append(emoji);
  }
}

function applyGlobalWeatherSettings(result) {
  if (
    typeof result.winter_enabled !== 'boolean' ||
    typeof result.camel_weather_enabled !== 'boolean' ||
    typeof result.christmas_weather_enabled !== 'boolean' ||
    Number(result.winter_enabled) +
      Number(result.camel_weather_enabled) +
      Number(result.christmas_weather_enabled) > 1
  ) {
    throw new Error('The server returned invalid global weather settings.');
  }
  const changed =
    winterModeEnabled !== result.winter_enabled ||
    camelWeatherEnabled !== result.camel_weather_enabled ||
    christmasWeatherEnabled !== result.christmas_weather_enabled;
  winterModeEnabled = result.winter_enabled;
  camelWeatherEnabled = result.camel_weather_enabled;
  christmasWeatherEnabled = result.christmas_weather_enabled;
  if (changed) applySettings();
  updateAdminWeatherControls();
}

async function syncGlobalTheme() {
  if (winterModeRequestInProgress) return;
  winterModeRequestInProgress = true;
  try {
    const result = await apiRequest('/theme');
    applyGlobalWeatherSettings(result);
  } catch (error) {
    elements.errorMessage.textContent = `The shared appearance could not be loaded: ${error.message}`;
  } finally {
    winterModeRequestInProgress = false;
  }
}

function updateAdminWeatherControls() {
  elements.adminWinterToggle.setAttribute('aria-pressed', String(winterModeEnabled));
  elements.adminWinterToggle.textContent = winterModeEnabled
    ? 'Turn Winter mode off for everyone'
    : 'Turn Winter mode on for everyone';
  elements.adminWinterStatus.textContent = winterModeEnabled
    ? 'Winter mode is on for everyone.'
    : camelWeatherEnabled
      ? 'Camel Weather is active instead.'
      : christmasWeatherEnabled
        ? 'Christmas Weather is active instead.'
        : 'Everyone is using their own saved theme.';
  elements.adminCamelWeatherToggle.setAttribute('aria-pressed', String(camelWeatherEnabled));
  elements.adminCamelWeatherToggle.textContent = camelWeatherEnabled
    ? 'Turn Camel Weather off for everyone'
    : 'Turn Camel Weather on for everyone';
  elements.adminCamelWeatherStatus.textContent = camelWeatherEnabled
    ? 'Camel Weather is on for everyone.'
    : winterModeEnabled
      ? 'Winter mode is active instead.'
      : christmasWeatherEnabled
        ? 'Christmas Weather is active instead.'
        : 'Everyone is using their own saved theme.';
  elements.adminChristmasWeatherToggle.setAttribute('aria-pressed', String(christmasWeatherEnabled));
  elements.adminChristmasWeatherToggle.textContent = christmasWeatherEnabled
    ? 'Turn Christmas Weather off for everyone'
    : 'Turn Christmas Weather on for everyone';
  elements.adminChristmasWeatherStatus.textContent = christmasWeatherEnabled
    ? 'Christmas Weather is on for everyone.'
    : winterModeEnabled
      ? 'Winter mode is active instead.'
      : camelWeatherEnabled
        ? 'Camel Weather is active instead.'
        : 'Everyone is using their own saved theme.';
}

function setWeatherTogglesDisabled(disabled) {
  elements.adminWinterToggle.disabled = disabled;
  elements.adminCamelWeatherToggle.disabled = disabled;
  elements.adminChristmasWeatherToggle.disabled = disabled;
}

async function toggleGlobalWinterMode() {
  if (winterModeRequestInProgress) return;
  const winterEnabled = !winterModeEnabled;
  const confirmation = winterEnabled
    ? `Turn on the white Winter theme for everyone using Hoilday?${camelWeatherEnabled || christmasWeatherEnabled ? ' This will turn off the current global weather.' : ''}`
    : 'Turn off Winter mode and restore everyone’s saved theme?';
  if (!window.confirm(confirmation)) return;
  winterModeRequestInProgress = true;
  setWeatherTogglesDisabled(true);
  elements.adminWinterStatus.textContent = '';
  try {
    const result = await apiRequest('/admin/theme', {
      method: 'POST',
      body: { winter_enabled: winterEnabled }
    });
    applyGlobalWeatherSettings(result);
  } catch (error) {
    elements.adminWinterStatus.textContent = `Winter mode could not be changed: ${error.message}`;
  } finally {
    winterModeRequestInProgress = false;
    setWeatherTogglesDisabled(false);
  }
}

async function toggleCamelWeather() {
  if (winterModeRequestInProgress) return;
  const camelEnabled = !camelWeatherEnabled;
  const confirmation = camelEnabled
    ? `Turn on Camel Weather for everyone?${winterModeEnabled || christmasWeatherEnabled ? ' This will turn off the current global weather.' : ''}`
    : 'Turn off Camel Weather and restore everyone’s saved theme?';
  if (!window.confirm(confirmation)) return;
  winterModeRequestInProgress = true;
  setWeatherTogglesDisabled(true);
  elements.adminCamelWeatherStatus.textContent = '';
  try {
    const result = await apiRequest('/admin/theme', {
      method: 'POST',
      body: { camel_weather_enabled: camelEnabled }
    });
    applyGlobalWeatherSettings(result);
  } catch (error) {
    elements.adminCamelWeatherStatus.textContent = `Camel Weather could not be changed: ${error.message}`;
  } finally {
    winterModeRequestInProgress = false;
    setWeatherTogglesDisabled(false);
  }
}

async function toggleChristmasWeather() {
  if (winterModeRequestInProgress) return;
  const christmasEnabled = !christmasWeatherEnabled;
  const confirmation = christmasEnabled
    ? `Turn on Christmas Weather for everyone?${winterModeEnabled || camelWeatherEnabled ? ' This will turn off the current global weather.' : ''}`
    : 'Turn off Christmas Weather and restore everyone’s saved theme?';
  if (!window.confirm(confirmation)) return;
  winterModeRequestInProgress = true;
  setWeatherTogglesDisabled(true);
  elements.adminChristmasWeatherStatus.textContent = '';
  try {
    const result = await apiRequest('/admin/theme', {
      method: 'POST',
      body: { christmas_weather_enabled: christmasEnabled }
    });
    applyGlobalWeatherSettings(result);
  } catch (error) {
    elements.adminChristmasWeatherStatus.textContent = `Christmas Weather could not be changed: ${error.message}`;
  } finally {
    winterModeRequestInProgress = false;
    setWeatherTogglesDisabled(false);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    elements.errorMessage.textContent = '';
    return true;
  } catch (error) {
    elements.errorMessage.textContent = `Your settings could not be saved in this browser: ${error.message}`;
    return false;
  }
}

async function saveHomeBackground(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Your browser could not read the background image.'));
    reader.readAsDataURL(blob);
  });
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/jpeg;base64,')) {
    throw new Error('Your browser returned an invalid background image.');
  }

  const previousBackground = settings.homeBackground;
  settings = { ...settings, homeBackground: dataUrl };
  if (!saveSettings()) {
    settings = { ...settings, homeBackground: previousBackground };
    throw new Error(elements.errorMessage.textContent);
  }
  applyHomeBackground();
  renderHomeBackgroundPreview();
}

function removeHomeBackground() {
  const previousBackground = settings.homeBackground;
  settings = { ...settings, homeBackground: '' };
  if (!saveSettings()) {
    settings = { ...settings, homeBackground: previousBackground };
    elements.homeBackgroundStatus.textContent = `The background could not be removed: ${elements.errorMessage.textContent}`;
    return;
  }
  applyHomeBackground();
  renderHomeBackgroundPreview();
  elements.homeBackgroundInput.value = '';
  elements.homeBackgroundStatus.textContent = 'Default home-screen background restored.';
}

function thanksgivingAppActive() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  return today >= '2026-11-23' && today <= '2026-11-27';
}

function updateSeasonalAppVisibility() {
  const today = new Date().toISOString().slice(0, 10);
  const thanksgivingApp = homeAppButtons.get('thanksgiving-feast');
  const thanksgivingHidden = !thanksgivingAppActive();
  const adventButton = homeAppButtons.get('advent-calendar');
  const adventHidden = today < '2026-12-01' || today > '2026-12-25';
  let visibilityChanged = false;
  if (thanksgivingApp) {
    visibilityChanged ||= thanksgivingApp.hidden !== thanksgivingHidden;
    thanksgivingApp.hidden = thanksgivingHidden;
  }
  if (adventButton) {
    visibilityChanged ||= adventButton.hidden !== adventHidden;
    adventButton.hidden = adventHidden;
  }

  const unlockedApps = new Set(currentProfile?.holiday?.apps_unlocked || []);
  for (const [appId, featureId, releaseDate] of [
    ['holiday-fishing', 'holiday_fishing', '2026-12-01'],
    ['holiday-shop', 'holiday_shop', '2026-12-02'],
    ['text-color-fishing', 'text_color_fishing', '2026-12-04'],
    ['christmas-tree', 'christmas_tree', '2026-12-15']
  ]) {
    const app = homeAppButtons.get(appId);
    if (!app) continue;
    const hidden = today < releaseDate || !unlockedApps.has(featureId);
    visibilityChanged ||= app.hidden !== hidden;
    app.hidden = hidden;
  }
  if (visibilityChanged) renderHomeAppOrder();
}

function saveHomeAppOrder(nextOrder) {
  const previousOrder = settings.appOrder;
  settings = { ...settings, appOrder: normalizeHomeAppOrder(nextOrder) };
  if (!saveSettings()) {
    settings = { ...settings, appOrder: previousOrder };
    elements.homeAppOrderStatus.textContent = `App order could not be saved: ${elements.errorMessage.textContent}`;
    renderHomeAppOrder();
    return false;
  }
  renderHomeAppOrder();
  elements.homeAppOrderStatus.textContent = 'Home screen app order saved on this device.';
  return true;
}

function populateSettingsForm() {
  elements.backgroundTheme.value = settings.theme;
  elements.weekStartsOn.value = settings.weekStartsOn;
  elements.timeFormat.value = settings.timeFormat;
  elements.defaultEventCategory.value = settings.defaultEventCategory;
  elements.calendarDensity.value = settings.density;
  elements.highContrast.checked = settings.highContrast;
  elements.reduceMotion.checked = settings.reduceMotion;
}

function populateNotificationForm() {
  elements.weeklySummaryEnabled.checked = settings.weeklySummaryEnabled;
  elements.notificationsEnabled.checked = settings.notificationsEnabled;
  elements.reminderEmail.value = settings.email;
  elements.notificationSound.checked = settings.notificationSound;
  elements.soundVolume.value = String(settings.soundVolume);
  elements.soundVolumeValue.value = `${settings.soundVolume}%`;
  reminderTypes.forEach(({ key }, index) => {
    elements.reminderControls[index].checked = settings[key];
  });
  updateReminderControls();
  updateNotificationPermissionStatus();
}

function updateReminderControls() {
  elements.reminderControls.forEach((control) => {
    control.disabled = !elements.notificationsEnabled.checked;
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function loadEvents() {
  try {
    const storedEvents = localStorage.getItem(STORAGE_KEY);
    if (!storedEvents) return [];

    const parsedEvents = JSON.parse(storedEvents);
    if (
      !Array.isArray(parsedEvents) ||
      parsedEvents.some((event) =>
        !event ||
        typeof event.id !== 'string' ||
        typeof event.title !== 'string' ||
        typeof event.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(event.date)
      )
    ) {
      throw new Error('Saved calendar data is not valid.');
    }

    return parsedEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: typeof event.time === 'string' ? event.time : '',
      category: Object.hasOwn(categoryNames, event.category) ? event.category : 'violet',
      notes: typeof event.notes === 'string' ? event.notes : '',
      recurrence: Object.hasOwn(recurrenceNames, event.recurrence) ? event.recurrence : 'none'
    }));
  } catch (error) {
    elements.errorMessage.textContent = `Your saved events could not be loaded: ${error.message}`;
    return [];
  }
}

function matchesEventFilters(event) {
  const searchText = elements.eventSearchInput?.value.trim().toLowerCase() || '';
  const categoryFilter = elements.eventCategoryFilter?.value || 'all';
  const termMatch = !searchText || `${event.title} ${event.notes} ${event.date} ${event.time}`.toLowerCase().includes(searchText);
  const categoryMatch = categoryFilter === 'all' || event.category === categoryFilter;
  return termMatch && categoryMatch;
}

function getExpandedEventsForRange(startDate, endDate) {
  const startAt = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endAt = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const occurrences = [];

  events.forEach((event) => {
    if (!event.recurrence || event.recurrence === 'none') {
      if (event.date >= toDateKey(startAt) && event.date <= toDateKey(endAt)) {
        occurrences.push({ ...event, date: event.date, occurrenceDate: event.date });
      }
      return;
    }

    let current = fromDateKey(event.date);
    const limit = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate());
    let safety = 0;

    while (current <= limit && safety < 5000) {
      const currentKey = toDateKey(current);
      if (current >= startAt && current <= endAt) {
        occurrences.push({
          ...event,
          date: currentKey,
          occurrenceDate: currentKey,
          originalId: event.id
        });
      }

      if (event.recurrence === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (event.recurrence === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (event.recurrence === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
      safety += 1;
    }
  });

  return occurrences.filter(matchesEventFilters);
}

function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    elements.errorMessage.textContent = '';
    return true;
  } catch (error) {
    elements.errorMessage.textContent = `Your changes could not be saved in this browser: ${error.message}`;
    return false;
  }
}

async function fetchCommunityEvents() {
  return apiRequest('/events');
}

async function saveCalendarEvent(updatedEvent, existingEvent) {
  if (calendarMode === 'community') {
    if (!currentUser) throw new Error('Sign in to edit the public calendar.');
    const result = await apiRequest(existingEvent ? `/events/${encodeURIComponent(updatedEvent.id)}` : '/events', {
      method: existingEvent ? 'PUT' : 'POST',
      body: updatedEvent
    });
    const savedEvent = result.event;
    events = existingEvent
      ? events.map((item) => item.id === existingEvent.id ? savedEvent : item)
      : [...events.filter((item) => item.id !== savedEvent.id), savedEvent];
  } else {
    const nextEvents = existingEvent
      ? events.map((item) => item.id === existingEvent.id ? { ...updatedEvent, recurrence: updatedEvent.recurrence || 'none' } : item)
      : [...events, { ...updatedEvent, recurrence: updatedEvent.recurrence || 'none' }];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
    } catch (error) {
      throw new Error(`Your changes could not be saved in this browser: ${error.message}`);
    }
    events = nextEvents;
  }
}

async function removeCalendarEvent(eventToDelete) {
  if (calendarMode === 'community') {
    if (!currentUser) throw new Error('Sign in to edit the public calendar.');
    await apiRequest(`/events/${encodeURIComponent(eventToDelete.id)}`, { method: 'DELETE' });
    events = events.filter((item) => item.id !== eventToDelete.id);
  } else {
    const nextEvents = events.filter((item) => item.id !== eventToDelete.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
    } catch (error) {
      throw new Error(`Your changes could not be saved in this browser: ${error.message}`);
    }
    events = nextEvents;
  }
}

function updateCalendarControls() {
  const isCommunity = calendarMode === 'community';
  if (!isCommunity) communityView = 'calendar';
  elements.personalCalendarButton.setAttribute('aria-pressed', String(!isCommunity));
  elements.communityCalendarButton.setAttribute('aria-pressed', String(isCommunity));
  elements.communityTabs.hidden = !isCommunity;
  elements.communityCalendarTab.setAttribute('aria-selected', String(communityView === 'calendar'));
  elements.communityOnlineTab.setAttribute('aria-selected', String(communityView === 'online'));
  elements.calendar.hidden = isCommunity && communityView === 'online';
  elements.monthSummary.hidden = isCommunity && communityView === 'online';
  elements.communityOnlineView.hidden = !isCommunity || communityView !== 'online';
  elements.accountButton.textContent = currentUser ? 'Sign out' : 'Sign in';
  elements.adminNavLink.hidden = currentProfile?.is_admin !== true;
  elements.reportNavLink.hidden = currentProfile?.is_admin === true;
  elements.homeAdminApp.hidden = currentProfile?.is_admin !== true;
  elements.homeReportApp.hidden = currentProfile?.is_admin === true;
  renderHomeAppOrder();
  const canFileReport = Boolean(currentUser) && currentProfile?.is_admin !== true;
  elements.reportSignInNotice.hidden = canFileReport;
  elements.reportSignInButton.hidden = canFileReport;
  elements.reportForm.hidden = !canFileReport;
  elements.createAccountButton.hidden = Boolean(currentUser);
  elements.accountButton.title = currentUser ? `Signed in as ${currentProfile?.username ?? 'player'}` : 'Sign in to manage public calendar events';
  elements.saveStatusText.textContent = isCommunity ? 'Shared public calendar' : 'Saved on this device';
  elements.privacyNoteText.textContent = isCommunity
    ? 'Anyone can view this shared calendar. Sign in to add or edit events.'
    : 'Your personal calendar is saved privately in this browser.';
  elements.addEventButton.querySelector('span:last-child').textContent =
    isCommunity && !currentUser ? 'Sign in to add' : 'Add an event';
  renderProfile();
  updateChatControls();
  if (currentProfile?.is_admin && activePage === 'report') setActivePage('calendar');
  if (!currentUser) stopOnlinePresence();
}

function subscribeToCommunityEvents() {
  if (calendarMode !== 'community') return;
  void syncCommunityEvents();
}

async function syncCommunityEvents() {
  try {
    const updatedEvents = await fetchCommunityEvents();
    if (calendarMode !== 'community') return;
    if (JSON.stringify(updatedEvents) !== JSON.stringify(events)) {
      events = updatedEvents;
      render();
    }
    if (!currentUser) elements.calendarStatus.textContent = 'Shared updates are live. Sign in to add or edit events.';
  } catch (error) {
    elements.calendarStatus.textContent = `The public calendar could not sync: ${error.message}`;
  }
}

async function syncOnlineUsers() {
  if (!currentUser) {
    stopOnlinePresence();
    return;
  }
  try {
    await apiRequest('/presence/ping', { method: 'POST', body: {} });
    const onlineUsers = await apiRequest('/presence');
    renderOnlineUserList(elements.onlineList, onlineUsers);
    renderOnlineUserList(elements.chatOnlineList, onlineUsers);
  } catch (error) {
    const status = activePage === 'chat' ? elements.chatStatus : elements.calendarStatus;
    status.textContent = `Who's online could not be loaded: ${error.message}`;
  }
}

async function loadAdminAdventPreview() {
  elements.adminAdventStatus.textContent = 'Loading the 25 read-only reward previews…';
  try {
    const result = await apiRequest('/admin/advent');
    if (!Array.isArray(result.days) || result.days.length !== 25) {
      throw new Error('The server returned an incomplete Advent Calendar preview.');
    }
    const cards = result.days.map((day, index) => {
      const card = document.createElement('article');
      card.className = 'admin-advent-reward';
      card.style.setProperty('--reward-order', String(index));
      const date = document.createElement('p');
      date.className = 'admin-advent-date';
      date.textContent = `December ${String(day.day).padStart(2, '0')}`;
      const title = document.createElement('h3');
      title.textContent = day.title;
      const description = document.createElement('p');
      description.textContent = day.description;
      const lights = document.createElement('span');
      lights.className = 'admin-advent-lights';
      lights.setAttribute('aria-hidden', 'true');
      const tree = document.createElement('span');
      tree.className = 'admin-advent-falling-tree';
      tree.setAttribute('aria-hidden', 'true');
      tree.style.setProperty('--tree-x', `${12 + (index % 5) * 17}%`);
      tree.style.setProperty('--tree-duration', `${5 + (index % 4)}s`);
      tree.style.setProperty('--tree-delay', `${-(index % 7) * 0.7}s`);
      card.append(lights, tree, date, title, description);
      return card;
    });
    elements.adminAdventRewards.replaceChildren(...cards);
    elements.adminAdventStatus.textContent = 'Preview only. Rewards can only be claimed in the Advent Calendar app on their scheduled day.';
  } catch (error) {
    elements.adminAdventStatus.textContent = `Advent preview could not be loaded: ${error.message}`;
  }
}

function renderGlobalAnnouncement(announcement) {
  currentGlobalAnnouncement = announcement;
  if (!announcement) {
    elements.globalAnnouncement.hidden = true;
    return;
  }
  elements.globalAnnouncementTitle.textContent = announcement.title;
  elements.globalAnnouncementMessage.textContent = announcement.message;
  elements.globalAnnouncement.hidden =
    localStorage.getItem('dayglowDismissedAnnouncementId') === String(announcement.id);
}

async function syncGlobalAnnouncement() {
  if (globalAnnouncementSyncInProgress) return;
  globalAnnouncementSyncInProgress = true;
  try {
    const announcement = await apiRequest('/announcement');
    if (
      announcement !== null &&
      (!announcement || !Number.isInteger(announcement.id) ||
        typeof announcement.title !== 'string' || typeof announcement.message !== 'string')
    ) {
      throw new Error('The server returned an invalid announcement.');
    }
    renderGlobalAnnouncement(announcement);
  } catch (error) {
    elements.errorMessage.textContent = `Announcements could not be loaded: ${error.message}`;
  } finally {
    globalAnnouncementSyncInProgress = false;
  }
}

function renderAdminAnnouncement(announcement) {
  if (!announcement) {
    elements.adminAnnouncementCurrent.textContent = 'No announcement is live.';
    return;
  }
  elements.adminAnnouncementCurrent.textContent =
    `Live: ${announcement.title} · ${new Date(announcement.created_at * 1000).toLocaleString()}`;
}

function renderAdminRewardControls() {
  if (!adminRewardCatalog) return;
  const previousAccount = elements.adminRewardTarget.value;
  const accountOptions = adminAccounts.map((account) => {
    const option = document.createElement('option');
    option.value = String(account.id);
    option.textContent = `${account.username}${account.is_bot ? ' (BOT)' : ''}`;
    return option;
  });
  const accountPlaceholder = new Option('Choose an account', '');
  elements.adminRewardTarget.replaceChildren(accountPlaceholder, ...accountOptions);
  elements.adminRewardTarget.value = accountOptions.some((option) => option.value === previousAccount)
    ? previousAccount
    : '';

  const type = elements.adminRewardType.value;
  const catalogKey = {
    rank: 'ranks',
    emoji: 'emojis',
    ring: 'rings',
    holiday_item: 'holiday_items',
    holiday_currency: 'holiday_currencies'
  }[type];
  const items = adminRewardCatalog[catalogKey] ?? [];
  const itemOptions = items.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.symbol ? `${item.symbol} ` : ''}${item.name}`;
    return option;
  });
  const itemPlaceholder = new Option('Choose an item', '');
  elements.adminRewardItem.replaceChildren(itemPlaceholder, ...itemOptions);
  elements.adminRewardQuantity.disabled = type !== 'holiday_item' && type !== 'holiday_currency';
  if (elements.adminRewardQuantity.disabled) elements.adminRewardQuantity.value = '1';
  elements.adminRewardSubmit.disabled = !accountOptions.length || !itemOptions.length;
}

function renderAdminCalendarEvents() {
  elements.adminEventList.replaceChildren();
  if (!adminEvents.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'There are no public calendar events.';
    elements.adminEventList.append(empty);
    return;
  }
  for (const event of adminEvents) {
    if (
      !event || typeof event.id !== 'string' || typeof event.title !== 'string' ||
      typeof event.date !== 'string' || typeof event.time !== 'string'
    ) {
      throw new Error('The server returned invalid calendar event data.');
    }
    const row = document.createElement('article');
    row.className = 'admin-event-row';
    const copy = document.createElement('div');
    copy.className = 'admin-event-copy';
    const title = document.createElement('strong');
    title.textContent = event.title;
    const dateTime = document.createElement('span');
    dateTime.textContent = `${formatLongDate(event.date)}${event.time ? ` · ${formatTime(event.time)}` : ''}`;
    copy.append(title, dateTime);
    const actions = document.createElement('div');
    actions.className = 'admin-event-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.dataset.editAdminEvent = event.id;
    edit.textContent = 'Edit';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.deleteAdminEvent = event.id;
    remove.textContent = 'Delete';
    actions.append(edit, remove);
    row.append(copy, actions);
    elements.adminEventList.append(row);
  }
}

async function loadAdminTools() {
  elements.adminRewardStatus.textContent = 'Loading reward catalog…';
  elements.adminEventStatus.textContent = 'Loading public calendar…';
  try {
    const [catalog, eventsResult, announcement, accounts] = await Promise.all([
      apiRequest('/admin/rewards'),
      apiRequest('/admin/events'),
      apiRequest('/announcement'),
      apiRequest('/admin/accounts')
    ]);
    if (
      !catalog || !['ranks', 'emojis', 'rings', 'holiday_items', 'holiday_currencies']
        .every((key) => Array.isArray(catalog[key])) ||
      !Array.isArray(eventsResult) || !Array.isArray(accounts)
    ) {
      throw new Error('The server returned invalid admin tool data.');
    }
    adminRewardCatalog = catalog;
    adminEvents = eventsResult;
    adminAccounts = accounts;
    renderAdminRewardControls();
    renderAdminCalendarEvents();
    renderAdminAnnouncement(announcement);
    elements.adminRewardStatus.textContent = '';
    elements.adminEventStatus.textContent = '';
  } catch (error) {
    elements.adminRewardStatus.textContent = `Reward tools could not be loaded: ${error.message}`;
    elements.adminEventStatus.textContent = `Calendar tools could not be loaded: ${error.message}`;
  }
}

async function submitAdminReward(event) {
  event.preventDefault();
  const userId = Number(elements.adminRewardTarget.value);
  const type = elements.adminRewardType.value;
  const quantity = elements.adminRewardQuantity.disabled ? 1 : Number(elements.adminRewardQuantity.value);
  elements.adminRewardSubmit.disabled = true;
  elements.adminRewardStatus.textContent = '';
  try {
    const result = await apiRequest('/admin/rewards', {
      method: 'POST',
      body: {
        user_id: userId,
        item_type: type,
        item_id: elements.adminRewardItem.value,
        action: elements.adminRewardAction.value,
        quantity
      }
    });
    await loadAdminTools();
    elements.adminRewardStatus.textContent =
      `${result.action === 'grant' ? 'Granted' : 'Removed'} ${result.quantity} ${result.item_name}.`;
  } catch (error) {
    elements.adminRewardStatus.textContent = `The reward could not be applied: ${error.message}`;
  } finally {
    elements.adminRewardSubmit.disabled = false;
  }
}

async function submitAdminAnnouncement(event) {
  event.preventDefault();
  elements.adminAnnouncementSubmit.disabled = true;
  elements.adminAnnouncementStatus.textContent = '';
  try {
    const result = await apiRequest('/admin/announcement', {
      method: 'POST',
      body: {
        action: 'publish',
        title: elements.adminAnnouncementTitle.value.trim(),
        message: elements.adminAnnouncementMessage.value.trim()
      }
    });
    renderGlobalAnnouncement(result.announcement);
    elements.adminAnnouncementForm.reset();
    await loadAdminTools();
    elements.adminAnnouncementStatus.textContent = 'Announcement published for everyone.';
  } catch (error) {
    elements.adminAnnouncementStatus.textContent = `The announcement could not be published: ${error.message}`;
  } finally {
    elements.adminAnnouncementSubmit.disabled = false;
  }
}

async function clearAdminAnnouncement() {
  if (!window.confirm('Clear the current announcement for everyone?')) return;
  elements.adminAnnouncementClear.disabled = true;
  elements.adminAnnouncementStatus.textContent = '';
  try {
    await apiRequest('/admin/announcement', {
      method: 'POST',
      body: { action: 'clear' }
    });
    renderGlobalAnnouncement(null);
    renderAdminAnnouncement(null);
    elements.adminAnnouncementStatus.textContent = 'The announcement was cleared.';
  } catch (error) {
    elements.adminAnnouncementStatus.textContent = `The announcement could not be cleared: ${error.message}`;
  } finally {
    elements.adminAnnouncementClear.disabled = false;
  }
}

function resetAdminEventForm() {
  elements.adminEventForm.reset();
  elements.adminEventId.value = '';
  elements.adminEventSubmit.textContent = 'Add event';
  elements.adminEventCancelEdit.hidden = true;
}

function editAdminEvent(eventId) {
  const event = adminEvents.find((item) => item.id === eventId);
  if (!event) return;
  elements.adminEventId.value = event.id;
  elements.adminEventTitle.value = event.title;
  elements.adminEventDate.value = event.date;
  elements.adminEventTime.value = event.time;
  elements.adminEventCategory.value = event.category;
  elements.adminEventRecurrence.value = event.recurrence || 'none';
  elements.adminEventNotes.value = event.notes;
  elements.adminEventSubmit.textContent = 'Save changes';
  elements.adminEventCancelEdit.hidden = false;
  elements.adminEventTitle.focus();
}

async function submitAdminEvent(event) {
  event.preventDefault();
  const eventId = elements.adminEventId.value;
  elements.adminEventSubmit.disabled = true;
  elements.adminEventStatus.textContent = '';
  try {
    const payload = {
      title: elements.adminEventTitle.value.trim(),
      date: elements.adminEventDate.value,
      time: elements.adminEventTime.value,
      category: elements.adminEventCategory.value,
      recurrence: elements.adminEventRecurrence.value,
      notes: elements.adminEventNotes.value.trim()
    };
    const result = await apiRequest(
      eventId ? `/admin/events/${encodeURIComponent(eventId)}` : '/admin/events',
      { method: eventId ? 'PUT' : 'POST', body: payload }
    );
    if (eventId) {
      adminEvents = adminEvents.map((item) => item.id === eventId ? result.event : item);
    } else {
      adminEvents.push(result.event);
    }
    renderAdminCalendarEvents();
    resetAdminEventForm();
    elements.adminEventStatus.textContent = eventId ? 'Calendar event updated.' : 'Calendar event added.';
    if (calendarMode === 'community') void syncCommunityEvents();
  } catch (error) {
    elements.adminEventStatus.textContent = `The calendar event could not be saved: ${error.message}`;
  } finally {
    elements.adminEventSubmit.disabled = false;
  }
}

async function deleteAdminEvent(eventId, button) {
  const event = adminEvents.find((item) => item.id === eventId);
  if (!event || !window.confirm(`Delete “${event.title}” from the public calendar?`)) return;
  button.disabled = true;
  elements.adminEventStatus.textContent = '';
  try {
    await apiRequest(`/admin/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    adminEvents = adminEvents.filter((item) => item.id !== eventId);
    if (elements.adminEventId.value === eventId) resetAdminEventForm();
    renderAdminCalendarEvents();
    elements.adminEventStatus.textContent = 'Calendar event deleted.';
    if (calendarMode === 'community') void syncCommunityEvents();
  } catch (error) {
    elements.adminEventStatus.textContent = `The calendar event could not be deleted: ${error.message}`;
    button.disabled = false;
  }
}

function renderAdminSecurity() {
  const data = adminSecurityData;
  if (!data) return;
  elements.adminRegistrationToggle.textContent = data.registration_enabled
    ? 'Disable new account registration'
    : 'Enable new account registration';
  elements.adminRegistrationToggle.setAttribute('aria-pressed', String(data.registration_enabled));
  const selectedAccount = elements.adminResetAccount.value;
  elements.adminResetAccount.replaceChildren(new Option('Choose an account', ''));
  for (const account of data.accounts) {
    elements.adminResetAccount.append(new Option(account.username, String(account.id)));
  }
  if ([...elements.adminResetAccount.options].some((option) => option.value === selectedAccount)) {
    elements.adminResetAccount.value = selectedAccount;
  }

  elements.adminSecuritySessions.replaceChildren();
  if (!data.sessions.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No active sessions.';
    elements.adminSecuritySessions.append(empty);
  }
  for (const session of data.sessions) {
    const row = document.createElement('article');
    row.className = 'admin-user';
    const detail = document.createElement('div');
    detail.className = 'admin-user-name';
    detail.textContent = session.username;
    const meta = document.createElement('span');
    meta.className = 'admin-user-meta';
    meta.textContent = `${session.is_current ? 'This session · ' : ''}Signed in ${new Date(session.created_at * 1000).toLocaleString()}`;
    detail.append(meta);
    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.className = 'account-button';
    revoke.dataset.revokeSecuritySession = String(session.id);
    revoke.textContent = 'Revoke';
    row.append(detail, revoke);
    elements.adminSecuritySessions.append(row);
  }

  elements.adminSecurityAudit.replaceChildren();
  if (!data.audit.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No account activity recorded yet.';
    elements.adminSecurityAudit.append(empty);
  }
  for (const entry of data.audit) {
    const row = document.createElement('article');
    row.className = 'admin-user';
    const detail = document.createElement('div');
    detail.className = 'admin-user-name';
    detail.textContent = `${entry.username} · ${entry.event.replaceAll('_', ' ')}`;
    const meta = document.createElement('span');
    meta.className = 'admin-user-meta';
    meta.textContent = `${new Date(entry.created_at * 1000).toLocaleString()}${entry.actor ? ` · by ${entry.actor}` : ''}`;
    detail.append(meta);
    row.append(detail);
    elements.adminSecurityAudit.append(row);
  }
}

async function loadAdminSecurity() {
  try {
    const data = await apiRequest('/admin/security');
    if (
      typeof data.registration_enabled !== 'boolean' ||
      !Array.isArray(data.accounts) ||
      data.accounts.some((account) => !Number.isInteger(account.id) || typeof account.username !== 'string') ||
      !Array.isArray(data.sessions) ||
      data.sessions.some((session) =>
        !Number.isInteger(session.id) ||
        typeof session.username !== 'string' ||
        !Number.isInteger(session.created_at) ||
        typeof session.is_current !== 'boolean'
      ) ||
      !Array.isArray(data.audit) ||
      data.audit.some((entry) =>
        typeof entry.username !== 'string' ||
        typeof entry.event !== 'string' ||
        typeof entry.actor !== 'string' ||
        !Number.isInteger(entry.created_at)
      )
    ) {
      throw new Error('The server returned invalid account security data.');
    }
    adminSecurityData = data;
    renderAdminSecurity();
    elements.adminRegistrationStatus.textContent = '';
  } catch (error) {
    elements.adminRegistrationStatus.textContent = `Security settings could not be loaded: ${error.message}`;
  }
}

async function submitAdminSecurityAction(action) {
  const adminPassword = elements.adminSecurityPassword.value;
  if (!adminPassword) {
    elements.adminSecurityPassword.focus();
    throw new Error('Enter your admin password to confirm this action.');
  }
  try {
    return await apiRequest('/admin/security', {
      method: 'POST',
      body: { ...action, admin_password: adminPassword }
    });
  } finally {
    elements.adminSecurityPassword.value = '';
  }
}

async function refreshAdminPanel() {
  if (!currentProfile?.is_admin || adminRefreshInProgress) return;
  adminRefreshInProgress = true;
  try {
    await apiRequest('/presence/ping', { method: 'POST', body: {} });
    const [members, bans, reports, accounts] = await Promise.all([
      apiRequest('/admin/online'),
      apiRequest('/admin/bans'),
      apiRequest('/admin/reports'),
      apiRequest('/admin/accounts')
    ]);
    if (
      !Array.isArray(members) ||
      !Array.isArray(bans) ||
      !Array.isArray(accounts) ||
      !reports ||
      !Array.isArray(reports.reports) ||
      !Number.isInteger(reports.unread_count)
    ) {
      throw new Error('The server returned invalid moderation data.');
    }
    renderAdminMembers(members);
    renderAdminBans(bans);
    renderAdminReports(reports);
    adminAccounts = accounts;
    renderAdminAccounts();
    if (adminRewardCatalog) renderAdminRewardControls();
    await loadAdminSecurity();
    elements.adminOnlineStatus.textContent = '';
    elements.adminBanStatus.textContent = '';
    elements.adminMailStatus.textContent = '';
    elements.adminAccountsStatus.textContent = '';
  } catch (error) {
    elements.adminOnlineStatus.textContent = `Online members could not be loaded: ${error.message}`;
    elements.adminBanStatus.textContent = `Active bans could not be loaded: ${error.message}`;
    elements.adminMailStatus.textContent = `Reports could not be loaded: ${error.message}`;
    elements.adminAccountsStatus.textContent = `Accounts could not be loaded: ${error.message}`;
  } finally {
    adminRefreshInProgress = false;
  }
}

function renderAdminAccounts() {
  const search = elements.adminAccountsSearch.value.trim().toLocaleLowerCase();
  const accounts = adminAccounts.filter((account) => account.username.toLocaleLowerCase().includes(search));
  elements.adminAccountsList.replaceChildren();
  if (!accounts.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = adminAccounts.length ? 'No accounts match your search.' : 'There are no accounts yet.';
    elements.adminAccountsList.append(empty);
    return;
  }
  for (const account of accounts) {
    if (
      !Number.isInteger(account.id) ||
      typeof account.username !== 'string' ||
      typeof account.rank !== 'string' ||
      !Number.isInteger(account.fish_caught) ||
      typeof account.online !== 'boolean' ||
      typeof account.is_bot !== 'boolean' ||
      !Array.isArray(account.unlocked_ranks) ||
      !Array.isArray(account.unlocked_emojis) ||
      !Array.isArray(account.unlocked_rings) ||
      !Array.isArray(account.completed_quests)
    ) {
      throw new Error('The server returned invalid account data.');
    }
    const card = document.createElement('article');
    card.className = 'admin-account';
    const heading = document.createElement('div');
    heading.className = 'admin-account-heading';
    const avatar = document.createElement('div');
    avatar.className = 'profile-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    renderAvatar(avatar, account.username, account.avatar_url, account.equipped_ring);
    const identity = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = `${account.equipped_emoji_symbol ? `${account.equipped_emoji_symbol} ` : ''}${account.username}`;
    appendAdminBadge(name, account.username);
    if (account.is_bot) name.append(createBotBadge());
    const meta = document.createElement('p');
    meta.className = 'admin-account-meta';
    const status = account.ban_expires_at
      ? `Banned until ${new Date(account.ban_expires_at * 1000).toLocaleString()}`
      : account.online ? 'Online' : 'Offline';
    meta.textContent = `Account #${account.id} · ${status}`;
    identity.append(name, meta);
    heading.append(avatar, identity);
    const stats = document.createElement('p');
    stats.className = 'admin-account-details';
    stats.textContent = `Current rank: ${account.rank} · Fish caught: ${account.fish_caught}`;
    const equipped = document.createElement('p');
    equipped.className = 'admin-account-details';
    equipped.textContent =
      `Equipped emoji: ${account.equipped_emoji || 'None'} · Equipped ring: ${account.equipped_ring || 'None'}`;
    const collections = document.createElement('p');
    collections.className = 'admin-account-details';
    collections.textContent =
      `Ranks: ${account.unlocked_ranks.join(', ') || 'None'} · Emojis: ${account.unlocked_emojis.join(', ') || 'None'} · Rings: ${account.unlocked_rings.join(', ') || 'None'}`;
    const quests = document.createElement('p');
    quests.className = 'admin-account-details';
    quests.textContent = `Completed quests: ${account.completed_quests.join(', ') || 'None'}`;
    card.append(heading, stats, equipped, collections, quests);
    if (!account.is_bot && account.username.toLocaleLowerCase() !== 'rufus') {
      const actions = document.createElement('div');
      actions.className = 'admin-action-row';
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.dataset.deleteAccount = String(account.id);
      deleteButton.textContent = 'Delete account';
      actions.append(deleteButton);
      card.append(actions);
    }
    elements.adminAccountsList.append(card);
  }
}

async function deleteAdminAccount(accountId, button) {
  const account = adminAccounts.find((item) => item.id === Number(accountId));
  if (!account || account.is_bot || account.username.toLocaleLowerCase() === 'rufus') return;
  const confirmed = window.confirm(
    `Permanently delete ${account.username}? This removes the account, saved progress, sessions, and chat messages. This cannot be undone.`
  );
  if (!confirmed) return;
  button.disabled = true;
  elements.adminAccountsStatus.textContent = '';
  try {
    const result = await apiRequest(`/admin/accounts/${account.id}`, { method: 'DELETE' });
    adminAccounts = adminAccounts.filter((item) => item.id !== account.id);
    renderAdminAccounts();
    await refreshAdminPanel();
    elements.adminAccountsStatus.textContent = `${result.username} was deleted.`;
  } catch (error) {
    elements.adminAccountsStatus.textContent = `The account could not be deleted: ${error.message}`;
    button.disabled = false;
  }
}

function renderAdminReports(result) {
  elements.adminMailList.replaceChildren();
  elements.adminMailUnreadCount.textContent = String(result.unread_count);
  elements.adminMailUnreadCount.hidden = result.unread_count === 0;
  if (!result.reports.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'There are no reports yet.';
    elements.adminMailList.append(empty);
    return;
  }
  for (const report of result.reports) {
    if (
      !Number.isInteger(report.id) ||
      typeof report.reporter_name !== 'string' ||
      typeof report.subject !== 'string' ||
      typeof report.message !== 'string' ||
      !Number.isInteger(report.created_at) ||
      (report.read_at !== null && !Number.isInteger(report.read_at))
    ) {
      throw new Error('The server returned an invalid report.');
    }
    const card = document.createElement('article');
    card.className = 'admin-report';
    const heading = document.createElement('div');
    heading.className = 'admin-report-heading';
    const subject = document.createElement('h3');
    subject.textContent = report.subject;
    const meta = document.createElement('span');
    meta.className = 'admin-report-meta';
    meta.textContent = `From ${report.reporter_name} · ${new Date(report.created_at * 1000).toLocaleString()}`;
    heading.append(subject, meta);
    const message = document.createElement('p');
    message.className = 'admin-report-message';
    message.textContent = report.message;
    card.append(heading, message);
    if (report.read_at === null) {
      const actions = document.createElement('div');
      actions.className = 'admin-action-row';
      const readButton = document.createElement('button');
      readButton.type = 'button';
      readButton.dataset.markReportRead = String(report.id);
      readButton.textContent = 'Mark as read';
      actions.append(readButton);
      card.append(actions);
    }
    elements.adminMailList.append(card);
  }
}

async function markAdminReportRead(reportId, button) {
  button.disabled = true;
  elements.adminMailStatus.textContent = '';
  try {
    await apiRequest('/admin/reports/read', {
      method: 'POST',
      body: { report_id: Number(reportId) }
    });
    button.parentElement.remove();
    const unreadCount = Math.max(0, Number(elements.adminMailUnreadCount.textContent) - 1);
    elements.adminMailUnreadCount.textContent = String(unreadCount);
    elements.adminMailUnreadCount.hidden = unreadCount === 0;
    elements.adminMailStatus.textContent = 'Report marked as read.';
  } catch (error) {
    elements.adminMailStatus.textContent = `The report could not be marked as read: ${error.message}`;
    button.disabled = false;
  }
}

async function submitReport(event) {
  event.preventDefault();
  if (!currentUser || currentProfile?.is_admin) {
    elements.reportStatus.textContent = 'Sign in with a non-admin account to file a report.';
    return;
  }
  const subject = elements.reportSubject.value.trim();
  const message = elements.reportMessage.value.trim();
  elements.reportSubmitButton.disabled = true;
  elements.reportStatus.textContent = '';
  try {
    await apiRequest('/reports', {
      method: 'POST',
      body: { subject, message }
    });
    elements.reportForm.reset();
    elements.reportStatus.textContent = 'Your report was sent to Rufus.';
  } catch (error) {
    elements.reportStatus.textContent = `Your report could not be sent: ${error.message}`;
  } finally {
    elements.reportSubmitButton.disabled = false;
  }
}

function selectAdminTab(tabName) {
  for (const tab of elements.adminTabs) {
    const selected = tab.dataset.adminTab === tabName;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  for (const panel of elements.adminPanels) {
    panel.hidden = panel.dataset.adminPanel !== tabName;
  }
}

function renderAdminMembers(members) {
  const selectedId = elements.adminTargetSelect.value;
  elements.adminTargetSelect.replaceChildren(new Option('Select a member', ''));
  elements.adminOnlineList.replaceChildren();
  if (!members.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No other members are online.';
    elements.adminOnlineList.append(empty);
  }
  for (const member of members) {
    if (typeof member.is_bot !== 'boolean') {
      throw new Error('The server returned invalid online member data.');
    }
    const option = new Option(
      `${member.equipped_emoji_symbol ? `${member.equipped_emoji_symbol} ` : ''}${member.username}${member.username.toLowerCase() === 'rufus' ? ' [ADMIN]' : ''}${member.is_bot ? ' (BOT)' : ''}`,
      String(member.id)
    );
    option.dataset.isBot = String(member.is_bot);
    elements.adminTargetSelect.add(option);

    const row = document.createElement('div');
    row.className = 'admin-user';
    const name = document.createElement('div');
    name.className = 'admin-user-name';
    name.textContent = `${member.equipped_emoji_symbol ? `${member.equipped_emoji_symbol} ` : ''}${member.username}`;
    appendAdminBadge(name, member.username);
    if (member.is_bot) name.append(createBotBadge());
    const meta = document.createElement('span');
    meta.className = 'admin-user-meta';
    meta.textContent = `${member.rank} · ${member.fish_caught} fish`;
    name.append(meta);
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.dataset.adminProfile = String(member.id);
    viewButton.textContent = 'View profile';
    row.append(name, viewButton);
    elements.adminOnlineList.append(row);
  }
  const selectedMember = members.find((member) => String(member.id) === selectedId);
  if (selectedMember) {
    elements.adminTargetSelect.value = selectedId;
  }
}

function renderAdminBans(bans) {
  elements.adminBanList.replaceChildren();
  if (!bans.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'There are no active bans.';
    elements.adminBanList.append(empty);
    return;
  }
  for (const ban of bans) {
    const row = document.createElement('div');
    row.className = 'admin-ban';
    const name = document.createElement('div');
    name.className = 'admin-ban-name';
    name.textContent = ban.username;
    const meta = document.createElement('span');
    meta.className = 'admin-ban-meta';
    meta.textContent = `${ban.reason || 'Manual admin ban'} · Until ${new Date(ban.expires_at * 1000).toLocaleString()}`;
    name.append(meta);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.unbanUser = String(ban.id);
    button.textContent = 'Unban';
    row.append(name, button);
    elements.adminBanList.append(row);
  }
}

async function viewAdminProfile(userId) {
  elements.adminOnlineStatus.textContent = '';
  try {
    const result = await apiRequest(`/admin/profile/${encodeURIComponent(userId)}`);
    const profile = result.profile;
    if (
      !profile ||
      typeof profile.username !== 'string' ||
      typeof profile.is_bot !== 'boolean' ||
      !Array.isArray(profile.unlocked_ranks) ||
      !Array.isArray(profile.unlocked_emojis)
    ) {
      throw new Error('The server returned an invalid member profile.');
    }
    elements.adminProfile.hidden = false;
    renderAvatar(elements.adminProfileAvatar, profile.username, profile.avatar_url, profile.equipped_ring);
    elements.adminProfileName.textContent =
      `${profile.equipped_emoji_symbol ? `${profile.equipped_emoji_symbol} ` : ''}${profile.username}`;
    appendAdminBadge(elements.adminProfileName, profile.username);
    if (profile.is_bot) elements.adminProfileName.append(createBotBadge());
    elements.adminProfileRank.textContent = `Current rank: ${profile.rank}`;
    elements.adminProfileStats.textContent = `Fish caught: ${profile.fish_caught}`;
    elements.adminProfileCollections.textContent =
      `Unlocked ranks: ${profile.unlocked_ranks.join(', ') || 'None'} · Unlocked emojis: ${profile.unlocked_emojis.join(', ') || 'None'}`;
  } catch (error) {
    elements.adminOnlineStatus.textContent = `Member profile could not be loaded: ${error.message}`;
  }
}

async function sendAdminWarning() {
  const userId = Number(elements.adminTargetSelect.value);
  const message = elements.adminWarningInput.value.trim();
  if (!userId || !message) {
    elements.adminActionStatus.textContent = 'Select an online member and enter a warning message.';
    return;
  }
  elements.adminWarnButton.disabled = true;
  elements.adminActionStatus.textContent = '';
  try {
    await apiRequest('/admin/warnings', { method: 'POST', body: { user_id: userId, message } });
    elements.adminWarningInput.value = '';
    const targetIsBot = elements.adminTargetSelect.selectedOptions[0]?.dataset.isBot === 'true';
    elements.adminActionStatus.textContent = targetIsBot
      ? 'Warning sent. The bot will acknowledge it in chat.'
      : 'Warning sent. It will appear as a pop-up for that member.';
  } catch (error) {
    elements.adminActionStatus.textContent = `Warning could not be sent: ${error.message}`;
  } finally {
    elements.adminWarnButton.disabled = false;
  }
}

async function banAdminTarget() {
  const userId = Number(elements.adminTargetSelect.value);
  if (!userId) {
    elements.adminActionStatus.textContent = 'Select an online member to ban.';
    return;
  }
  const duration = Number(elements.adminBanDuration.value);
  const durationLabel = elements.adminBanDuration.selectedOptions[0].textContent;
  if (!window.confirm(`Ban this member for ${durationLabel}? They will be signed out immediately.`)) return;
  elements.adminBanButton.disabled = true;
  elements.adminActionStatus.textContent = '';
  try {
    await apiRequest('/admin/bans', {
      method: 'POST',
      body: { user_id: userId, duration_seconds: duration }
    });
    elements.adminActionStatus.textContent = `Member banned for ${durationLabel}.`;
    await refreshAdminPanel();
  } catch (error) {
    elements.adminActionStatus.textContent = `Member could not be banned: ${error.message}`;
  } finally {
    elements.adminBanButton.disabled = false;
  }
}

async function unbanAdminTarget(userId) {
  elements.adminBanStatus.textContent = '';
  try {
    await apiRequest(`/admin/bans/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    elements.adminBanStatus.textContent = 'Account unbanned.';
    await refreshAdminPanel();
  } catch (error) {
    elements.adminBanStatus.textContent = `Account could not be unbanned: ${error.message}`;
  }
}

async function pollAccountWarnings() {
  if (!currentUser || warningPollInProgress) return;
  warningPollInProgress = true;
  try {
    const warnings = await apiRequest('/warnings');
    if (!Array.isArray(warnings)) throw new Error('The server returned invalid warning messages.');
    pendingWarnings.push(...warnings.filter((warning) => typeof warning.message === 'string'));
    showNextWarning();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      currentUser = null;
      currentProfile = null;
      pendingWarnings = [];
      applySettings();
      stopOnlinePresence();
      updateCalendarControls();
      render();
      elements.calendarStatus.textContent = 'Your sign-in is no longer active. Sign in again to continue.';
    } else {
      elements.errorMessage.textContent = `Account messages could not be checked: ${error.message}`;
    }
  } finally {
    warningPollInProgress = false;
  }
}

function showNextWarning() {
  if (elements.warningDialog.open || !pendingWarnings.length) return;
  const [warning] = pendingWarnings.splice(0, 1);
  elements.warningDialogMessage.textContent = warning.message;
  try {
    elements.warningDialog.showModal();
  } catch (error) {
    elements.errorMessage.textContent = `The account message could not be displayed: ${error.message}`;
  }
}

function showAutomaticBan(ban) {
  if (
    !ban ||
    typeof ban.reason !== 'string' ||
    !Number.isInteger(ban.expires_at) ||
    !Number.isInteger(ban.duration_seconds)
  ) {
    elements.errorMessage.textContent = 'The server returned invalid automatic-ban details.';
    return;
  }
  localStorage.removeItem(SESSION_STORAGE_KEY);
  currentUser = null;
  currentProfile = null;
  emojiCatalog = [];
  pendingWarnings = [];
  stopOnlinePresence();
  applySettings();
  updateCalendarControls();
  render();
  elements.autoBanEmoji.textContent = typeof ban.emoji === 'string' ? ban.emoji : '🚫';
  elements.autoBanReason.textContent = ban.reason;
  const durationMinutes = Math.max(1, Math.ceil(ban.duration_seconds / 60));
  elements.autoBanDuration.textContent =
    `Duration: ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'}. ` +
    `Ban expires ${new Date(ban.expires_at * 1000).toLocaleString()}.`;
  if (elements.authDialog.open) elements.authDialog.close();
  try {
    elements.autoBanDialog.showModal();
  } catch (error) {
    elements.errorMessage.textContent = `The automatic-ban notice could not be displayed: ${error.message}`;
  }
}

function renderOnlineUserList(list, onlineUsers) {
  list.replaceChildren();
  if (!onlineUsers.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'online-empty';
    emptyMessage.textContent = currentUser ? 'No other members are online right now.' : "Sign in to see who's online.";
    list.append(emptyMessage);
    return;
  }
  onlineUsers.forEach((onlineUser) => {
    const userTag = document.createElement('span');
    userTag.className = 'online-user';
    const dot = document.createElement('i');
    dot.className = 'online-dot';
    dot.setAttribute('aria-hidden', 'true');
    const username = document.createElement('strong');
    setUsernameText(username, onlineUser.username, onlineUser.equipped_emoji_symbol, onlineUser.equipped_text_color);
    appendAdminBadge(username, onlineUser.username);
    const avatar = createUserAvatar(onlineUser.avatar_url, 'online-avatar', onlineUser.equipped_ring, onlineUser.username);
    const rank = document.createElement('span');
    rank.textContent = onlineUser.rank;
    userTag.append(dot);
    if (avatar) userTag.append(avatar);
    userTag.append(username);
    if (onlineUser.is_bot) userTag.append(createBotBadge());
    userTag.append(rank);
    list.append(userTag);
  });
}

function createBotBadge() {
  const badge = document.createElement('span');
  badge.className = 'bot-badge';
  badge.textContent = 'BOT';
  badge.title = 'Automated account';
  return badge;
}

function appendAdminBadge(element, username) {
  if (typeof username !== 'string' || username.toLowerCase() !== 'rufus') return;
  const badge = document.createElement('span');
  badge.className = 'admin-badge';
  badge.textContent = '[ADMIN]';
  badge.title = 'Administrator';
  element.append(badge);
}

function setUsernameText(element, username, emoji = '', colorId = '') {
  const styles = {
    red_text_color: ['red', ''],
    white_text_color: ['white', ''],
    gold_text_color: ['gold', ''],
    reindeer_text_color: ['reindeer', '🦌'],
    christmas_text_color: ['christmas', '🎄'],
    present_text_color: ['present', '🎁'],
    candy_cane_text_color: ['candy_cane', ''],
    winter_text_color: ['winter', ''],
    gummy_text_color: ['gummy', '🐻'],
    northern_lights_text_color: ['northern_lights', '✨'],
    thanksgiving_text_color: ['thanksgiving', '🦃']
  };
  element.replaceChildren();
  element.classList.remove(...Object.values(styles).map(([name]) => `holiday-name-${name}`), 'holiday-name-decorated');
  if (emoji) element.append(document.createTextNode(`${emoji} `));
  const style = styles[colorId];
  if (!style || typeof username !== 'string') {
    element.append(document.createTextNode(username ?? ''));
    return;
  }
  const [colorClass, decoration] = style;
  element.classList.add(`holiday-name-${colorClass}`);
  if (decoration) element.classList.add('holiday-name-decorated');
  for (const letter of username) {
    const span = document.createElement('span');
    span.className = 'holiday-name-letter';
    span.textContent = letter === ' ' ? '\u00a0' : letter;
    if (decoration) span.dataset.decoration = decoration;
    element.append(span);
  }
}

function stopOnlinePresence() {
  renderOnlineUserList(elements.onlineList, []);
  renderOnlineUserList(elements.chatOnlineList, []);
}

function createRankRarityBadge(rank) {
  return createRarityBadge(RANK_RARITIES[rank]);
}

function rankClass(rank) {
  return `rank-${rank.toLowerCase().replaceAll(/\s+/g, '-')}`;
}

function renderProfile() {
    const username = currentProfile?.username ?? null;
    const rank = currentProfile?.rank ?? null;
    const emoji = currentProfile?.equipped_emoji_symbol ?? '';
    const avatarUrl = currentProfile?.avatar_url ?? '';
    renderAvatar(elements.sidebarAvatar, username, avatarUrl, currentProfile?.equipped_ring);
    renderAvatar(elements.homeProfileAvatar, username, avatarUrl, currentProfile?.equipped_ring);
    setUsernameText(elements.sidebarUsername, username ?? 'Not signed in', emoji, currentProfile?.equipped_text_color);
    if (username) appendAdminBadge(elements.sidebarUsername, username);
    elements.sidebarRank.textContent = rank ?? 'Sign in to save rank';
    renderAvatar(elements.profileAvatar, username, avatarUrl, currentProfile?.equipped_ring);
    setUsernameText(elements.profileUsername, username ?? 'Not signed in', emoji, currentProfile?.equipped_text_color);
    if (username) appendAdminBadge(elements.profileUsername, username);
    elements.profileAvatarUploadLabel.hidden = !currentUser;
    elements.profileAvatarInput.disabled = !currentUser;
    elements.removeProfileAvatarButton.hidden = !currentUser || !avatarUrl;
    elements.profileCaption.textContent = currentUser
      ? 'Your Hoilday seasonal profile'
      : 'Sign in to create your profile.';
    elements.profileRank.textContent = rank ?? '—';
    elements.profileRank.className = rank ? rankClass(rank) : '';
    elements.profileFishCount.textContent = String(currentProfile?.fish_caught ?? 0);
    const unlockedRanks = Array.isArray(currentProfile?.unlocked_ranks)
      ? currentProfile.unlocked_ranks
      : [];
    elements.profileRankEmpty.hidden = unlockedRanks.length > 0;
    elements.profileRankEmpty.textContent = currentUser
      ? 'Catch fish or finish side quests to unlock more ranks.'
      : 'Sign in to see and choose your unlocked ranks.';
    elements.profileRankList.replaceChildren(...unlockedRanks.map((unlockedRank) => {
      const button = document.createElement('button');
      button.className = `profile-rank-option ${rankClass(unlockedRank)}`;
      button.type = 'button';
      button.dataset.selectRank = unlockedRank;
      button.append(document.createTextNode(unlockedRank), createRankRarityBadge(unlockedRank));
      button.setAttribute('aria-pressed', String(unlockedRank === rank));
      button.disabled = !currentUser || unlockedRank === rank;
      return button;
    }));
    renderProfileEmojis();
    renderProfileRings();
    renderProfileTextColors();
    elements.catchFishButton.disabled = !currentUser;
    elements.catchFishButton.textContent = currentUser ? 'Cast your line' : 'Sign in to fish';
    elements.catchStatus.textContent = currentUser
      ? `Current rank: ${rank ?? 'Snow'} · ${currentProfile?.fish_caught ?? 0} catches`
      : 'Sign in to start fishing and save your rank.';
    updateSeasonalAppVisibility();
}

function createRingPreview(ringId) {
  const preview = document.createElement('span');
  preview.className = `ring-preview ring-${ringId}`;
  preview.dataset.ring = ringId;
  preview.setAttribute('aria-hidden', 'true');
  preview.append(createRingPreviewAvatar());
  if (ringId === 'christmas') {
    preview.append(createChristmasLights('ring-preview-lights'));
    const decoration = document.createElement('span');
    decoration.className = 'ring-preview-decoration';
    decoration.textContent = RING_DECORATIONS.christmas;
    preview.append(decoration);
  } else if (ringId === 'candy_cane') {
    const decoration = document.createElement('span');
    decoration.className = 'ring-preview-decoration';
    decoration.append(createCandyCaneIcon());
    preview.append(decoration);
  } else if (RING_DECORATIONS[ringId]) {
    const decoration = document.createElement('span');
    decoration.className = 'ring-preview-decoration';
    decoration.textContent = RING_DECORATIONS[ringId];
    if (ringId === 'turkey') {
      const leaves = document.createElement('span');
      leaves.className = 'ring-preview-leaves';
      leaves.textContent = '🍂';
      decoration.append(leaves);
    }
    preview.append(decoration);
  }
  return preview;
}

function updateSeasonalPresentation(info) {
  seasonalInfoState = info;
  for (const [seasonalKey, rank] of Object.entries(info.fishing_ranks)) {
    document.querySelectorAll(`[data-seasonal-rank="${seasonalKey}"]`).forEach((chip) => {
      const oldRank = seasonalKey === 'fall' ? (info.christmas_enabled ? 'Fall' : 'Gingerbread') : (info.christmas_enabled ? 'Turkey' : 'Reindeer');
      chip.classList.remove(rankClass(oldRank));
      chip.classList.add(rankClass(rank));
      chip.querySelector('strong').textContent = rank;
      const rarity = RANK_RARITIES[rank];
      const badge = chip.querySelector('.rank-rarity');
      badge.className = `rank-rarity rarity-${rarity.toLowerCase()}`;
      badge.textContent = rarity;
    });
  }

  for (const [questId, rank] of Object.entries(info.quest_rewards)) {
    const rewardName = document.querySelector(`#${questId}RewardName`);
    const rewardRarity = document.querySelector(`#${questId}RewardRarity`);
    rewardName.textContent = rank;
    rewardName.className = rankClass(rank);
    const rarity = RANK_RARITIES[rank];
    rewardRarity.className = `rank-rarity rarity-${rarity.toLowerCase()}`;
    rewardRarity.textContent = rarity;
  }
  document.querySelector('#questIntro').textContent = info.christmas_enabled
    ? 'Take a break from fishing and earn two special Christmas ranks.'
    : 'Take a break from fishing and earn two special seasonal ranks.';
  document.querySelector('#harvestQuestTitle').textContent = info.christmas_enabled ? 'Present scavenger hunt' : 'Harvest scavenger hunt';
  document.querySelector('#harvestQuestDescription').textContent = info.christmas_enabled
    ? 'Find the hidden present. You get three guesses per hunt.'
    : 'Find the hidden golden leaf. You get three guesses per hunt.';
  document.querySelector('#harvestClue').textContent = info.christmas_enabled
    ? 'Which find is hiding the present?'
    : 'Which find is hiding the golden leaf?';
  document.querySelector('#drumstickQuestTitle').textContent = info.christmas_enabled ? 'Present dash' : 'Drumstick dash';
  document.querySelector('#drumstickQuestDescription').textContent = info.christmas_enabled
    ? 'Wait for the present to appear, then tap as quickly as you can.'
    : 'Wait for the turkey to appear, then tap as quickly as you can.';
  document.querySelector('#drumstickSignal').textContent = info.christmas_enabled ? '🎁' : '🦃';
  document.querySelector('#drumstickReactButton').textContent = info.christmas_enabled ? 'Tap the present!' : 'Tap the turkey!';
  if (!currentUser) {
    document.querySelector('#harvestQuestStatus').textContent =
      `Sign in to play and unlock ${info.quest_rewards.harvest}.`;
    document.querySelector('#drumstickQuestStatus').textContent =
      `Sign in to play and unlock ${info.quest_rewards.drumstick}.`;
  }
  const harvestChoices = info.christmas_enabled
    ? [['🎄', 'Search the Christmas tree'], ['🍪', 'Search the cookie plate'], ['🔔', 'Search the bell box'], ['🎁', 'Search the presents'], ['⛄', 'Search the snowman'], ['🧦', 'Search the stockings']]
    : [['🍂', 'Search the fallen leaves'], ['🍄', 'Search the mushrooms'], ['🎃', 'Search the pumpkin patch'], ['🌽', 'Search the cornfield'], ['🍎', 'Search the apple basket'], ['🥧', 'Search the pie table']];
  document.querySelectorAll('#harvestChoices [data-harvest-choice]').forEach((button, index) => {
    button.textContent = harvestChoices[index][0];
    button.setAttribute('aria-label', harvestChoices[index][1]);
  });

  const ringTitle = document.querySelector('#ringFishingTitle');
  ringTitle.firstChild.nodeValue = `${info.ring_fishing_title}`;
  document.querySelector('#ringFishingCard').setAttribute('aria-label', info.ring_fishing_title);
  document.querySelector('#turkeyFishingPage .fishing-art').textContent = info.ring_fishing_icon;
  document.querySelector('#turkeyFishButton').textContent = `Go ${info.ring_fishing_title}`;
  document.querySelector('#turkeyFishingPage h2').textContent = `Cast for a profile ring`;
  document.querySelector('#turkeyFishingPage .seasonal-heading .welcome-subtitle').textContent =
    'Catch a colored ring, then equip your favorite from Profile.';
  document.querySelector('#turkeyFishingPage .seasonal-heading h1').setAttribute('aria-label', info.ring_fishing_title);
  document.querySelectorAll('[data-app-id="turkey-fishing"] .home-app-label').forEach((label) => {
    label.textContent = info.ring_fishing_title;
  });
  document.querySelectorAll('[data-app-id="turkey-fishing"] .home-app-icon').forEach((icon) => {
    icon.textContent = info.ring_fishing_icon;
  });
  document.querySelectorAll('[data-app-id="turkey-fishing"]').forEach((app) => {
    app.setAttribute('aria-label', `Open ${info.ring_fishing_title}`);
  });
  if (activePage === 'turkey-fishing') elements.breadcrumbTitle.textContent = info.ring_fishing_title;
  renderRingCollection();
}

async function loadSeasonalInfo() {
  try {
    const info = await apiRequest('/seasonal');
    if (!info || typeof info.christmas_enabled !== 'boolean' || !info.fishing_ranks || !info.quest_rewards) {
      throw new Error('The server returned invalid seasonal information.');
    }
    updateSeasonalPresentation(info);
  } catch (error) {
    elements.errorMessage.textContent = `Seasonal information could not be loaded: ${error.message}`;
  }
}

function renderRingCollection() {
  const unlocked = new Set(currentProfile?.unlocked_rings ?? []);
  const visibleRings = turkeyRingCatalog.filter((ring) => ring.available || unlocked.has(ring.id));
  elements.ringCollection.replaceChildren(...visibleRings.map((ring) => {
    const card = document.createElement('article');
    card.className = 'ring-card';
    card.append(createRingPreview(ring.id));
    const title = document.createElement('h3');
    title.textContent = ring.name;
    const odds = document.createElement('p');
    odds.textContent = ring.id === 'harvest_feast'
      ? 'Thanksgiving Feast reward'
      : ring.available ? `${ring.odds}% chance per cast` : 'No longer available to catch';
    const state = document.createElement('p');
    state.textContent = currentProfile?.equipped_ring === ring.id
      ? 'Equipped on your profile'
      : unlocked.has(ring.id)
        ? 'Unlocked'
        : ring.id === 'harvest_feast'
          ? 'Cook every dish in Thanksgiving Feast'
        : !ring.available
          ? 'Retired · still equipable if unlocked'
        : 'Not caught yet';
    card.append(title, odds, state);
    return card;
  }));
  elements.turkeyFishButton.disabled = !currentUser || turkeyFishingInProgress;
  elements.turkeyFishButton.textContent = turkeyFishingInProgress
    ? 'Casting…'
    : currentUser ? `Go ${seasonalInfoState?.ring_fishing_title ?? 'Turkey fishing'}` : 'Sign in to fish';
  elements.turkeySignInButton.hidden = Boolean(currentUser);
  elements.turkeyFishingStatus.textContent = currentUser
    ? `${unlocked.size} profile rings unlocked. Choose a ring from Profile to equip it.`
    : 'Sign in to save your profile rings.';
  renderProfileRings();
}

function renderProfileRings() {
  const unlockedIds = Array.isArray(currentProfile?.unlocked_rings)
    ? currentProfile.unlocked_rings
    : [];
  const unlockedRings = turkeyRingCatalog.filter((ring) => unlockedIds.includes(ring.id));
  elements.profileRingEmpty.hidden = unlockedRings.length > 0;
  elements.profileRingEmpty.textContent = !currentUser
    ? 'Sign in to see and equip your unlocked rings.'
    : turkeyRingCatalog.length
      ? 'Catch rings in Turkey fishing to add them to your collection.'
      : 'Loading your profile rings…';
  const options = unlockedRings.map((ring) => {
    const button = document.createElement('button');
    button.className = 'profile-rank-option';
    button.type = 'button';
    button.dataset.equipRing = ring.id;
    button.setAttribute('aria-pressed', String(ring.id === currentProfile?.equipped_ring));
    button.disabled = ring.id === currentProfile?.equipped_ring;
    button.append(createRingPreview(ring.id), document.createTextNode(ring.name));
    return button;
  });
  if (currentUser) {
    const clearButton = document.createElement('button');
    clearButton.className = 'profile-rank-option';
    clearButton.type = 'button';
    clearButton.dataset.equipRing = '';
    clearButton.textContent = 'No ring';
    clearButton.setAttribute('aria-pressed', String(!currentProfile?.equipped_ring));
    clearButton.disabled = !currentProfile?.equipped_ring;
    options.push(clearButton);
  }
  elements.profileRingList.replaceChildren(...options);
}

const TEXT_COLOR_NAMES = Object.freeze({
  red_text_color: 'Red',
  white_text_color: 'White',
  gold_text_color: 'Gold',
  reindeer_text_color: 'Reindeer',
  christmas_text_color: 'Christmas',
  present_text_color: 'Present',
  candy_cane_text_color: 'Candy Cane',
  winter_text_color: 'Winter',
  gummy_text_color: 'Gummy',
  northern_lights_text_color: 'Northern Lights',
  thanksgiving_text_color: 'Thanksgiving'
});

function renderProfileTextColors() {
  const unlockedIds = Array.isArray(currentProfile?.unlocked_text_colors)
    ? currentProfile.unlocked_text_colors.filter((colorId) => Object.hasOwn(TEXT_COLOR_NAMES, colorId))
    : [];
  elements.profileTextColorEmpty.hidden = unlockedIds.length > 0;
  elements.profileTextColorEmpty.textContent = !currentUser
    ? 'Sign in to see and equip your unlocked text colors.'
    : 'Unlock text colors through Holiday fishing and seasonal rewards.';

  const options = unlockedIds.map((colorId) => {
    const button = document.createElement('button');
    button.className = 'profile-rank-option';
    button.type = 'button';
    button.dataset.equipTextColor = colorId;
    button.setAttribute('aria-pressed', String(colorId === currentProfile?.equipped_text_color));
    button.disabled = !currentUser || colorId === currentProfile?.equipped_text_color;
    const preview = document.createElement('span');
    preview.className = 'profile-text-color-preview';
    setUsernameText(preview, currentProfile?.username ?? 'Your name', '', colorId);
    button.append(preview, document.createTextNode(TEXT_COLOR_NAMES[colorId]));
    return button;
  });
  if (currentUser) {
    const clearButton = document.createElement('button');
    clearButton.className = 'profile-rank-option';
    clearButton.type = 'button';
    clearButton.dataset.equipTextColor = '';
    clearButton.textContent = 'No text color';
    clearButton.setAttribute('aria-pressed', String(!currentProfile?.equipped_text_color));
    clearButton.disabled = !currentProfile?.equipped_text_color;
    options.push(clearButton);
  }
  elements.profileTextColorList.replaceChildren(...options);
}

let turkeyCollectionRequestId = 0;

function seasonalRingAvailability(ringId) {
  const christmasActive = seasonalInfoState?.christmas_enabled
    ?? (() => {
      const today = new Date();
      return today.getUTCMonth() === 11 || (today.getUTCMonth() === 10 && today.getUTCDate() >= 28);
    })();
  return ringId !== (christmasActive ? 'turkey' : 'present');
}

async function loadTurkeyFishing() {
  const requestId = ++turkeyCollectionRequestId;
  elements.turkeyCollectionStatus.textContent = 'Loading ring collection…';
  try {
    const result = await apiRequest('/turkey-fishing');
    if (requestId !== turkeyCollectionRequestId) return;
    if (!Array.isArray(result.rings) || result.rings.some((ring) =>
      !ring || !PROFILE_RING_IDS.includes(ring.id) || typeof ring.name !== 'string' ||
      typeof ring.odds !== 'number' ||
      (ring.available !== undefined && typeof ring.available !== 'boolean')
    )) {
      throw new Error('The server returned an invalid ring collection.');
    }
    turkeyRingCatalog = result.rings.map((ring) => {
      if (typeof ring.available === 'boolean') return ring;
      const available = seasonalRingAvailability(ring.id);
      return { ...ring, available, odds: available ? ring.odds : 0 };
    });
    if (result.profile && currentUser) {
      currentProfile = result.profile;
      currentUser = { ...currentUser, ...result.profile };
    }
    elements.turkeyCollectionStatus.textContent = '';
    renderRingCollection();
    renderProfile();
  } catch (error) {
    if (requestId === turkeyCollectionRequestId) {
      elements.turkeyCollectionStatus.textContent = `Ring collection could not be loaded: ${error.message}`;
      renderProfileRings();
    }
  }
}

async function fishForProfileRing() {
  if (!currentUser) {
    openAuthDialog();
    elements.authMessage.textContent = 'Sign in to catch and save profile rings.';
    return;
  }
  turkeyFishingInProgress = true;
  renderRingCollection();
  elements.turkeyFishingStatus.textContent = 'Casting into the ring pond…';
  try {
    const result = await apiRequest('/turkey-fishing/fish', { method: 'POST', body: {} });
    if (!result.caught_ring || typeof result.caught_ring.name !== 'string' || !result.profile) {
      throw new Error('The server returned an invalid catch.');
    }
    currentProfile = result.profile;
    currentUser = { ...currentUser, ...result.profile };
    renderProfile();
    renderRingCollection();
    elements.turkeyFishingStatus.textContent = result.ring_unlocked
      ? `You caught the ${result.caught_ring.name} ring! You can equip it from Profile.`
      : `You caught another ${result.caught_ring.name} ring. It is already in your collection.`;
    void syncOnlineUsers();
    if (activePage === 'chat') void syncChatMessages(true);
  } catch (error) {
    elements.turkeyFishingStatus.textContent = `${seasonalInfoState?.ring_fishing_title ?? 'Turkey fishing'} failed: ${error.message}`;
  } finally {
    window.setTimeout(() => {
      turkeyFishingInProgress = false;
      renderRingCollection();
    }, 3000);
  }
}

async function equipProfileRing(ringId) {
  elements.profileRingStatus.textContent = '';
  try {
    const result = await apiRequest('/profile/ring', {
      method: 'PUT',
      body: { ring_id: ringId }
    });
    currentUser = result.user;
    currentProfile = result.user;
    renderProfile();
    renderRingCollection();
    elements.profileRingStatus.textContent = ringId
      ? `${turkeyRingCatalog.find((ring) => ring.id === ringId)?.name ?? 'Ring'} equipped on your profile.`
      : 'Profile ring cleared.';
    void syncOnlineUsers();
    if (activePage === 'chat') void syncChatMessages(true);
  } catch (error) {
    elements.profileRingStatus.textContent = `Your profile ring could not be changed: ${error.message}`;
  }
}

async function equipProfileTextColor(colorId, statusElement = elements.profileTextColorStatus) {
  statusElement.textContent = '';
  try {
    const result = await apiRequest('/profile/text-color', {
      method: 'PUT',
      body: { color_id: colorId }
    });
    if (!result.user || result.user.equipped_text_color !== colorId) {
      throw new Error('The server did not update your profile text color.');
    }
    currentProfile = result.user;
    currentUser = { ...currentUser, ...result.user };
    renderProfile();
    renderThanksgivingFeast();
    statusElement.textContent = colorId
      ? `${TEXT_COLOR_NAMES[colorId] ?? 'Text color'} equipped on your profile.`
      : 'Profile text color cleared.';
    void syncOnlineUsers();
    if (activePage === 'chat' && chatView === 'chat') void syncChatMessages(true);
  } catch (error) {
    statusElement.textContent = `Your profile text color could not be changed: ${error.message}`;
    return false;
  }
  return true;
}

function renderProfileEmojis() {
  const unlockedEmojiIds = Array.isArray(currentProfile?.unlocked_emojis)
    ? currentProfile.unlocked_emojis
    : [];
  const unlockedEmojis = emojiCatalog.filter((emoji) => unlockedEmojiIds.includes(emoji.id));
  elements.profileEmojiEmpty.hidden = unlockedEmojis.length > 0;
  elements.profileEmojiEmpty.textContent = !currentUser
    ? 'Sign in to see and choose your unlocked emojis.'
    : emojiCatalog.length
      ? 'Unlock emojis by emoji fishing or reaching regular fishing milestones.'
      : 'Loading your unlocked emojis…';

  const options = unlockedEmojis.map((emoji) => {
    const button = document.createElement('button');
    button.className = 'profile-rank-option';
    button.type = 'button';
    button.dataset.equipEmoji = emoji.id;
    button.setAttribute('aria-pressed', String(emoji.id === currentProfile?.equipped_emoji));
    button.disabled = emoji.id === currentProfile?.equipped_emoji;
    const symbol = document.createElement('span');
    symbol.textContent = emoji.symbol;
    symbol.setAttribute('aria-hidden', 'true');
    button.append(symbol, document.createTextNode(emoji.name), createRarityBadge(emoji.rarity));
    return button;
  });
  if (currentUser) {
    const clearButton = document.createElement('button');
    clearButton.className = 'profile-rank-option';
    clearButton.type = 'button';
    clearButton.dataset.equipEmoji = '';
    clearButton.textContent = 'No emoji';
    clearButton.setAttribute('aria-pressed', String(!currentProfile?.equipped_emoji));
    clearButton.disabled = !currentProfile?.equipped_emoji;
    options.push(clearButton);
  }
  elements.profileEmojiList.replaceChildren(...options);
}

function createRarityBadge(rarityName) {
  const badge = document.createElement('span');
  badge.className = `rank-rarity rarity-${rarityName.toLowerCase()}`;
  badge.textContent = rarityName;
  return badge;
}

function renderEmojiCollection() {
  elements.emojiCollection.replaceChildren(...emojiCatalog.map((emoji) => {
    const card = document.createElement('article');
    card.className = 'emoji-card';
    const icon = document.createElement('span');
    icon.className = 'emoji-card-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = emoji.symbol;
    const title = document.createElement('h3');
    title.textContent = emoji.name;
    const rarity = createRarityBadge(emoji.rarity);
    const unlockInfo = document.createElement('p');
    if (emoji.holiday_only) {
      unlockInfo.textContent = 'Available only from Holiday fishing.';
    } else if (emoji.fish_required) {
      const progress = currentProfile?.fish_caught ?? 0;
      unlockInfo.textContent = emoji.unlocked
        ? `Guaranteed at ${emoji.fish_required.toLocaleString()} regular fishing trips.`
        : `Unlock at ${emoji.fish_required.toLocaleString()} regular fishing trips (${Math.min(progress, emoji.fish_required).toLocaleString()} / ${emoji.fish_required.toLocaleString()}).`;
    } else {
      unlockInfo.textContent = `${emoji.odds}% chance per emoji-fishing cast.`;
    }
    const button = document.createElement('button');
    button.className = 'primary-button';
    button.type = 'button';
    if (emoji.equipped) {
      button.textContent = 'Equipped';
    } else if (emoji.unlocked) {
      button.textContent = 'Equip';
      button.dataset.equipEmoji = emoji.id;
    } else {
      button.textContent = currentUser ? 'Locked' : 'Sign in to equip';
      button.disabled = true;
    }
    button.disabled = !currentUser || !emoji.unlocked || emoji.equipped;
    card.append(icon, title, rarity, unlockInfo, button);
    return card;
  }));
  elements.emojiFishButton.disabled = !currentUser || emojiFishingInProgress;
  elements.emojiSignInButton.hidden = Boolean(currentUser);
  elements.clearEmojiButton.hidden = !currentUser || !currentProfile?.equipped_emoji;
  if (!currentUser) {
    elements.emojiStatus.textContent = 'Sign in to unlock and equip emojis. You can browse their odds and rarities.';
    elements.emojiFishingStatus.textContent = 'Emoji fishing is separate from regular rank fishing.';
  } else {
    elements.emojiStatus.textContent = `Regular fishing trips: ${(currentProfile?.fish_caught ?? 0).toLocaleString()}.`;
    elements.emojiFishingStatus.textContent = 'Emoji fishing is separate from regular fishing. Duplicate catches are possible.';
  }
}

async function loadEmojiCollection() {
  const requestId = ++emojiCollectionRequestId;
  const status = activePage === 'profile' ? elements.profileEmojiStatus : elements.emojiStatus;
  status.textContent = 'Loading emoji collection…';
  try {
    const result = await apiRequest('/emojis');
    if (requestId !== emojiCollectionRequestId) return;
    if (!Array.isArray(result.emojis)) {
      throw new Error('The server returned an invalid emoji collection.');
    }
    emojiCatalog = result.emojis;
    if (result.profile && currentUser) {
      currentProfile = result.profile;
      currentUser = { ...currentUser, ...result.profile };
    }
    elements.profileEmojiStatus.textContent = '';
    renderProfile();
    renderEmojiCollection();
  } catch (error) {
    if (requestId === emojiCollectionRequestId) {
      status.textContent = `Emoji collection could not be loaded: ${error.message}`;
    }
  }
}

async function equipEmoji(emojiId) {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  try {
    const result = await apiRequest('/profile/emoji', {
      method: 'PUT',
      body: { emoji_id: emojiId }
    });
    if (!result.user || !Array.isArray(result.user.unlocked_emojis)) {
      throw new Error('The server returned an invalid profile.');
    }
    currentProfile = result.user;
    currentUser = { ...currentUser, ...result.user };
    emojiCatalog = emojiCatalog.map((emoji) => ({
      ...emoji,
      equipped: emoji.id === result.user.equipped_emoji
    }));
    renderProfile();
    renderEmojiCollection();
    const status = emojiId
      ? `${emojiCatalog.find((emoji) => emoji.id === emojiId)?.name ?? 'Emoji'} equipped beside your name.`
      : 'Your profile emoji was cleared.';
    elements.emojiStatus.textContent = status;
    elements.profileEmojiStatus.textContent = status;
    void syncOnlineUsers();
    if (activePage === 'chat' && chatView === 'chat') void syncChatMessages(true);
  } catch (error) {
    elements.emojiStatus.textContent = `Emoji could not be equipped: ${error.message}`;
  }
}

async function fishForEmoji() {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  emojiFishingInProgress = true;
  elements.emojiFishingStatus.textContent = 'Casting for a seasonal emoji…';
  renderEmojiCollection();
  try {
    const result = await apiRequest('/emojis/fish', { method: 'POST', body: {} });
    if (!result.caught_emoji || !result.profile) {
      throw new Error('The server returned an invalid emoji catch.');
    }
    currentProfile = result.profile;
    currentUser = { ...currentUser, ...result.profile };
    emojiCatalog = emojiCatalog.map((emoji) => ({
      ...emoji,
      unlocked: result.profile.unlocked_emojis.includes(emoji.id),
      equipped: result.profile.equipped_emoji === emoji.id
    }));
    updateCalendarControls();
    renderEmojiCollection();
    const caughtEmoji = result.caught_emoji;
    elements.emojiFishingStatus.textContent = result.emoji_unlocked
      ? `You unlocked ${caughtEmoji.symbol} ${caughtEmoji.name} · ${caughtEmoji.rarity}!`
      : `You found ${caughtEmoji.symbol} ${caughtEmoji.name} · ${caughtEmoji.rarity} again.`;
  } catch (error) {
    elements.emojiFishingStatus.textContent = `Emoji fishing failed: ${error.message}`;
  } finally {
    emojiFishingInProgress = false;
    elements.emojiFishButton.disabled = !currentUser;
  }
}

function updateChatControls() {
  const signedIn = Boolean(currentUser);
  const showingChat = chatView === 'chat';
  elements.chatTab.setAttribute('aria-selected', String(showingChat));
  elements.chatOnlineTab.setAttribute('aria-selected', String(!showingChat));
  elements.chatMessagesPanel.hidden = !showingChat;
  elements.chatOnlinePanel.hidden = showingChat;
  elements.chatOnlinePrompt.hidden = signedIn;
  elements.chatSignInPrompt.hidden = signedIn || !showingChat;
  elements.chatMessages.hidden = !signedIn || !showingChat;
  elements.chatForm.hidden = !signedIn || !showingChat;
  elements.chatClearButton.hidden = !signedIn;
  updateChatNotificationButton();
  if (!signedIn) {
    chatRenderEpoch += 1;
    lastChatMessageId = 0;
    chatGeneration = null;
    chatUnreadCount = 0;
    updateChatUnreadBadge();
    elements.chatMessages.replaceChildren();
    elements.chatConnectionStatus.textContent = 'Sign in to join';
    elements.chatStatus.textContent = '';
  }
}

function selectCommunityView(view) {
  communityView = view;
  elements.communityCalendarTab.setAttribute('aria-selected', String(view === 'calendar'));
  elements.communityOnlineTab.setAttribute('aria-selected', String(view === 'online'));
  elements.calendar.hidden = view === 'online';
  elements.monthSummary.hidden = view === 'online';
  elements.communityOnlineView.hidden = view !== 'online';
  if (view === 'online' && currentUser) void syncOnlineUsers();
}

function selectChatView(view) {
  chatView = view;
  if (view === 'chat') {
    chatUnreadCount = 0;
    updateChatUnreadBadge();
  }
  updateChatControls();
  if (view === 'online' && currentUser) void syncOnlineUsers();
  if (view === 'chat' && currentUser) void syncChatMessages();
}

function updateChatNotificationButton() {
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'unsupported';
  elements.chatNotificationButton.hidden = !currentUser || !supported;
  elements.chatNotificationButton.disabled = permission !== 'default';
  elements.chatNotificationButton.textContent = permission === 'granted'
    ? 'Notifications on'
    : permission === 'denied'
      ? 'Notifications blocked'
      : 'Enable chat notifications';
  elements.chatNotificationButton.title = permission === 'denied'
    ? 'Allow notifications in your browser settings.'
    : 'Receive a browser notification for every new chat message and game update.';
}

function updateChatUnreadBadge() {
  elements.chatUnreadBadge.hidden = chatUnreadCount === 0;
  elements.chatUnreadBadge.textContent = chatUnreadCount > 99 ? '99+' : String(chatUnreadCount);
  elements.chatUnreadBadge.title = `${chatUnreadCount} unread chat message${chatUnreadCount === 1 ? '' : 's'}`;
  elements.homeChatUnreadBadge.hidden = chatUnreadCount === 0;
  elements.homeChatUnreadBadge.textContent = chatUnreadCount > 99 ? '99+' : String(chatUnreadCount);
}

async function enableChatNotifications() {
  if (!('Notification' in window)) {
    elements.chatStatus.textContent = 'Browser notifications are not supported here.';
    return;
  }
  try {
    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
    updateChatNotificationButton();
    elements.chatStatus.textContent = permission === 'granted'
      ? 'Chat and update notifications are enabled.'
      : permission === 'denied'
        ? 'Notifications are blocked by your browser. Allow them in browser settings to receive chat alerts.'
        : 'Notification permission was not granted.';
  } catch (error) {
    elements.chatStatus.textContent = `Chat notifications could not be enabled: ${error.message}`;
  }
}

function notifyNewChatMessage(message) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const body = `${message.rank} · ${message.content}`;
  try {
    const notification = new Notification(`New message from ${message.username}`, {
      body: body.length > 220 ? `${body.slice(0, 217)}…` : body,
      icon: './icon.svg',
      tag: `dayglow-chat-${message.id}`
    });
    showNotificationBanner(`New message from ${message.username}`, body, 'Messages');
    notification.addEventListener('click', () => {
      window.focus();
      setActivePage('chat');
      notification.close();
    });
  } catch (error) {
    elements.chatStatus.textContent = `A new chat message notification could not be shown: ${error.message}`;
  }
}

function appendChatMessage(message) {
  const item = document.createElement('li');
  item.className = 'chat-message';
  if (message.username === currentUser?.username) item.classList.add('is-mine');

  const meta = document.createElement('div');
  meta.className = 'chat-message-meta';
  const avatar = createUserAvatar(message.avatar_url, 'chat-avatar', message.equipped_ring, message.username);
  if (avatar) meta.append(avatar);
  const username = document.createElement('strong');
  setUsernameText(username, message.username, message.equipped_emoji_symbol, message.equipped_text_color);
  appendAdminBadge(username, message.username);
  meta.append(username);
  if (message.is_bot) meta.append(createBotBadge());
  const rank = document.createElement('span');
  rank.className = `chat-message-rank ${rankClass(message.rank)}`;
  rank.textContent = message.rank;
  const timestamp = document.createElement('time');
  const date = new Date(message.created_at * 1000);
  timestamp.dateTime = date.toISOString();
  timestamp.textContent = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
  meta.append(rank, timestamp);

  const content = document.createElement('p');
  content.className = 'chat-message-content';
  content.textContent = message.content;
  item.append(meta, content);
  elements.chatMessages.append(item);
  lastChatMessageId = Math.max(lastChatMessageId, message.id);
}

function showChatEmptyMessage() {
  const emptyMessage = document.createElement('li');
  emptyMessage.className = 'chat-empty';
  emptyMessage.textContent = 'No messages yet. Start the conversation!';
  elements.chatMessages.replaceChildren(emptyMessage);
}

async function syncChatMessages(reset = false) {
  if (!currentUser || chatRequestInProgress) return;
  chatRequestInProgress = true;
  const requestEpoch = chatRenderEpoch;
  if (reset) {
    lastChatMessageId = 0;
    elements.chatMessages.replaceChildren();
    elements.chatConnectionStatus.textContent = 'Connecting…';
  }

  const shouldNotify = !reset && lastChatMessageId > 0;
  const shouldScrollToBottom = activePage === 'chat' && chatView === 'chat' && (
    reset ||
    elements.chatMessages.scrollHeight - elements.chatMessages.scrollTop - elements.chatMessages.clientHeight < 64
  );
  try {
    const cursor = lastChatMessageId ? `?after=${lastChatMessageId}` : '';
    const response = await apiRequest(`/chat/messages${cursor}`);
    if (
      !currentUser ||
      requestEpoch !== chatRenderEpoch ||
      !Number.isInteger(response.generation) ||
      !Array.isArray(response.messages)
    ) {
      if (currentUser && requestEpoch === chatRenderEpoch) {
        throw new Error('The server returned an invalid chat history.');
      }
      return;
    }
    if (chatGeneration !== null && response.generation !== chatGeneration) {
      elements.chatMessages.replaceChildren();
      lastChatMessageId = 0;
      chatUnreadCount = 0;
      updateChatUnreadBadge();
    }
    chatGeneration = response.generation;
    for (const message of response.messages) {
      if (message.id > lastChatMessageId) {
        appendChatMessage(message);
        if (shouldNotify && message.username !== currentUser.username) {
          notifyNewChatMessage(message);
          if (activePage !== 'chat' || chatView !== 'chat' || document.hidden) {
            chatUnreadCount += 1;
            updateChatUnreadBadge();
          }
        }
      }
    }
    if (!lastChatMessageId) showChatEmptyMessage();
    else elements.chatMessages.querySelector('.chat-empty')?.remove();
    elements.chatConnectionStatus.textContent = '● Live';
    elements.chatStatus.textContent = '';
    if (shouldScrollToBottom) elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  } catch (error) {
    elements.chatConnectionStatus.textContent = 'Reconnecting…';
    elements.chatStatus.textContent = `Chat could not be loaded: ${error.message}`;
  } finally {
    chatRequestInProgress = false;
  }
}

function showAppUpdateNotice(update, installed = false) {
  if (installed) {
    elements.updateDialogTitle.textContent = update.title;
    elements.updateDialogDescription.textContent = update.description;
    if (!elements.updateDialog.open) elements.updateDialog.showModal();
    return;
  }
  elements.updateNoticeLabel.textContent = installed ? 'UPDATE INSTALLED' : 'NEW UPDATE · REFRESHING WHEN SAFE';
  elements.updateNoticeTitle.textContent = update.title;
  elements.updateNoticeDescription.textContent = update.description;
  elements.updateNotice.hidden = false;
}

function canAutomaticallyRefresh() {
  return document.visibilityState === 'visible' &&
    !document.querySelector('dialog[open]') &&
    elements.settingsOverlay.hidden &&
    !elements.chatMessageInput.value.trim();
}

function attemptAutomaticRefresh() {
  if (!appUpdateReloadPending) return;
  if (canAutomaticallyRefresh()) {
    appUpdateReloadPending = false;
    window.location.reload();
    return;
  }
  window.setTimeout(attemptAutomaticRefresh, 1000);
}

async function checkForAppUpdate() {
  if (appUpdateCheckInProgress) return;
  appUpdateCheckInProgress = true;
  try {
    const update = await apiRequest('/update');
    if (
      typeof update.version !== 'string' ||
      typeof update.title !== 'string' ||
      typeof update.description !== 'string'
    ) {
      throw new Error('The server returned invalid update information.');
    }

    const savedVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY);
    if (!savedVersion) {
      localStorage.setItem(APP_VERSION_STORAGE_KEY, update.version);
      return;
    }
    if (savedVersion === update.version) return;

    const pendingUpdate = {
      version: update.version,
      title: update.title,
      description: update.description
    };
    localStorage.setItem(APP_VERSION_STORAGE_KEY, update.version);
    localStorage.setItem(PENDING_UPDATE_STORAGE_KEY, JSON.stringify(pendingUpdate));
    showAppUpdateNotice(pendingUpdate);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Hoilday update: ${update.title}`, {
          body: update.description,
          icon: './icon.svg',
          tag: `dayglow-update-${update.version}`
        });
        showNotificationBanner(update.title, update.description, 'Hoilday Updates');
      } catch (error) {
        elements.errorMessage.textContent = `The update notification could not be shown: ${error.message}`;
      }
    }
    appUpdateReloadPending = true;
    attemptAutomaticRefresh();
  } catch (error) {
    elements.errorMessage.textContent = `App updates could not be checked: ${error.message}`;
  } finally {
    appUpdateCheckInProgress = false;
  }
}

function restoreAppUpdateNotice() {
  try {
    const savedNotice = localStorage.getItem(PENDING_UPDATE_STORAGE_KEY);
    if (!savedNotice) return;
    const update = JSON.parse(savedNotice);
    if (
      !update ||
      typeof update.version !== 'string' ||
      typeof update.title !== 'string' ||
      typeof update.description !== 'string'
    ) {
      throw new Error('Saved update information is not valid.');
    }
    showAppUpdateNotice(update, true);
  } catch (error) {
    elements.errorMessage.textContent = `The saved update notice could not be loaded: ${error.message}`;
  }
}

function updateHomeClock() {
  const now = new Date();
  updateSeasonalAppVisibility();
  document.querySelector('#homeClock').textContent = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
  document.querySelector('#homeDate').textContent = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function renderCountdown(prefix, target, now, completedMessage) {
  const units = document.querySelector(`#${prefix}CountdownUnits`);
  const message = document.querySelector(`#${prefix}CountdownMessage`);
  if (!target) {
    units.hidden = true;
    message.textContent = completedMessage;
    message.hidden = false;
    return;
  }
  const totalSeconds = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
  const values = {
    Days: Math.floor(totalSeconds / 86_400),
    Hours: Math.floor((totalSeconds % 86_400) / 3_600),
    Minutes: Math.floor((totalSeconds % 3_600) / 60),
    Seconds: totalSeconds % 60
  };
  for (const [unit, value] of Object.entries(values)) {
    document.querySelector(`#${prefix}${unit}`).textContent = String(value).padStart(2, '0');
  }
  units.hidden = false;
  message.hidden = true;
}

function updateChristmasCountdown() {
  const now = new Date();
  const christmas = new Date(now.getFullYear(), 11, 25);
  const dayAfterChristmas = new Date(now.getFullYear(), 11, 26);
  let christmasTarget = christmas;
  if (now >= christmas && now < dayAfterChristmas) {
    christmasTarget = null;
  } else if (now >= dayAfterChristmas) {
    christmasTarget = new Date(now.getFullYear() + 1, 11, 25);
  }
  document.querySelector('#christmasTargetDate').textContent = christmasTarget
    ? christmasTarget.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
    : 'December 25';
  renderCountdown('christmas', christmasTarget, now, 'Merry Christmas!');
  renderCountdown(
    'advent',
    now < ADVENT_UPDATE_DATE ? ADVENT_UPDATE_DATE : null,
    now,
    'The Advent Calendar update is here!'
  );
}

async function loadUpdateHistory() {
  elements.updatesStatus.textContent = '';
  elements.updateHistory.replaceChildren();
  try {
    const update = await apiRequest('/update');
    const history = update.history ?? [];
    if (
      typeof update.version !== 'string' ||
      typeof update.title !== 'string' ||
      typeof update.description !== 'string' ||
      !Array.isArray(history) ||
      history.some((entry) =>
        !entry ||
        typeof entry.version !== 'string' ||
        typeof entry.title !== 'string' ||
        typeof entry.description !== 'string'
      )
    ) {
      throw new Error('The server returned invalid update history.');
    }
    const entries = [
      { version: update.version, title: update.title, description: update.description, current: true },
      ...history.slice(0, 30)
    ];
    elements.updateHistory.replaceChildren(...entries.map((entry) => {
      const article = document.createElement('article');
      article.className = `update-entry${entry.current ? ' update-entry-current' : ''}`;
      const heading = document.createElement('div');
      heading.className = 'update-entry-heading';
      const title = document.createElement('h2');
      title.textContent = entry.title;
      const version = document.createElement('span');
      version.className = 'update-version';
      version.textContent = entry.version;
      heading.append(title, version);
      if (entry.current) {
        const badge = document.createElement('span');
        badge.className = 'update-current-badge';
        badge.textContent = 'CURRENT';
        heading.append(badge);
      }
      const description = document.createElement('p');
      description.textContent = entry.description;
      article.append(heading, description);
      return article;
    }));
  } catch (error) {
    elements.updateHistory.replaceChildren();
    elements.updatesStatus.textContent = `Update history could not be loaded: ${error.message}`;
  }
}

async function exportAccountBackup() {
  if (!currentUser) {
    elements.exportStatus.textContent = 'Sign in to download your account backup.';
    openAuthDialog();
    return;
  }
  elements.exportAccountButton.disabled = true;
  elements.exportStatus.textContent = 'Preparing your account backup…';
  try {
    const backup = await apiRequest('/account/export');
    if (
      backup.format !== 'dayglow-account-backup' ||
      backup.version !== 1 ||
      !backup.account ||
      backup.account.username !== currentProfile?.username
    ) {
      throw new Error('The server returned invalid account backup data.');
    }
    backup.exported_at = new Date().toISOString();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const download = document.createElement('a');
    download.href = url;
    download.download = `hoilday-${backup.account.username}-backup.json`;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    elements.exportStatus.textContent = `Backup downloaded for ${backup.account.username}. Keep it somewhere safe.`;
  } catch (error) {
    elements.exportStatus.textContent = `Backup could not be downloaded: ${error.message}`;
  } finally {
    elements.exportAccountButton.disabled = false;
  }
}

async function importAccountBackup(event) {
  event.preventDefault();
  if (!elements.importAccountForm.reportValidity()) return;
  const file = elements.importBackupFile.files?.[0];
  if (!file) return;
  if (file.size > 400 * 1024) {
    elements.importStatus.textContent = 'Choose a backup file smaller than 400 KB.';
    return;
  }
  elements.importAccountButton.disabled = true;
  elements.importStatus.textContent = 'Checking the backup…';
  try {
    const backup = JSON.parse(await file.text());
    if (backup?.format !== 'dayglow-account-backup' || backup.version !== 1) {
      throw new Error('This is not a supported Hoilday account backup.');
    }
    const restoring = currentProfile?.username?.toLowerCase() === backup.account?.username?.toLowerCase();
    if (!restoring && (elements.importAccountPassword.value.length < 8 || elements.importAccountPassword.value.length > 128)) {
      throw new Error('Choose a new password between 8 and 128 characters when creating an account.');
    }
    elements.importStatus.textContent = restoring ? 'Restoring saved progress to your account…' : 'Creating a separate account…';
    const result = await apiRequest('/account/import', {
      method: 'POST',
      body: { backup, password: elements.importAccountPassword.value }
    });
    if (!result.token || !result.user || typeof result.user.username !== 'string') {
      throw new Error('The server returned an invalid imported account.');
    }
    localStorage.setItem(SESSION_STORAGE_KEY, result.token);
    currentUser = result.user;
    currentProfile = result.user;
    emojiCatalog = [];
    applySettings();
    updateCalendarControls();
    render();
    elements.importAccountForm.reset();
    elements.importStatus.textContent = result.restored
      ? `Restored saved progress for ${result.user.username}. Your current password was kept.`
      : `Imported ${result.user.username} as a separate account. Your previous account is still saved and can be signed into later.`;
    void loadEmojiCollection();
    void syncOnlineUsers();
    void syncChatMessages(true);
    void pollAccountWarnings();
    if (result.user.is_admin) void refreshAdminPanel();
  } catch (error) {
    elements.importStatus.textContent = `Account could not be imported: ${error.message}`;
  } finally {
    elements.importAccountButton.disabled = false;
  }
}

function setActivePage(pageName) {
  const pages = {
    home: elements.homeScreen,
    calendar: elements.calendarPage,
    'browser-appearance': elements.browserAppearancePage,
    chat: elements.chatPage,
    notifications: elements.notificationsPage,
    seasonal: elements.seasonalPage,
    profile: elements.profilePage,
    trading: elements.tradingPage,
    emojis: elements.emojisPage,
    'turkey-fishing': elements.turkeyFishingPage,
    'thanksgiving-feast': elements.thanksgivingFeastPage,
    report: elements.reportPage,
    admin: elements.adminPage,
    export: elements.exportPage,
    updates: elements.updatesPage,
    christmas: elements.christmasPage
  };
  if (
    !Object.hasOwn(pages, pageName) ||
    (pageName === 'admin' && !currentProfile?.is_admin) ||
    (pageName === 'report' && currentProfile?.is_admin) ||
    (pageName === 'thanksgiving-feast' && !thanksgivingAppActive())
  ) return;
  activePage = pageName;
  document.querySelector('.app-shell').dataset.activePage = pageName;
  Object.entries(pages).forEach(([name, page]) => {
    page.hidden = name !== pageName;
    page.classList.remove('app-page-opening');
  });
  elements.appTopbar.hidden = pageName === 'home';
  document.querySelectorAll('[data-page]').forEach((link) => {
    const isActive = link.dataset.page === pageName;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titles = {
    calendar: 'Calendar',
    'browser-appearance': 'Browser appearance',
    chat: 'Messages',
    notifications: 'Notifications',
    seasonal: 'Fishing',
    profile: 'Profile',
    trading: 'Gifts & trades',
    emojis: 'Emoji fishing',
    'turkey-fishing': seasonalInfoState?.ring_fishing_title ?? 'Turkey fishing',
    'thanksgiving-feast': 'Thanksgiving Feast',
    report: 'Reporting',
    admin: 'Admin panel',
    export: 'Export / import',
    updates: 'Updates',
    christmas: 'Christmas'
  };
  if (pageName !== 'home') {
    const page = pages[pageName];
    elements.breadcrumbTitle.textContent = titles[pageName];
    void page.offsetWidth;
    page.classList.add('app-page-opening');
  }
  if (pageName === 'emojis' || pageName === 'profile') void loadEmojiCollection();
  if (pageName === 'turkey-fishing' || pageName === 'profile') void loadTurkeyFishing();
  if (pageName === 'thanksgiving-feast') void loadThanksgivingFeast();
  if (pageName === 'trading') void loadTrading();
  if (pageName === 'notifications') populateNotificationForm();
  if (pageName === 'admin') void refreshAdminPanel();
  if (pageName === 'updates') void loadUpdateHistory();
  if (pageName === 'chat') {
    chatUnreadCount = 0;
    updateChatUnreadBadge();
    if (currentUser) {
      void syncChatMessages();
      void syncOnlineUsers();
    } else elements.chatConnectionStatus.textContent = 'Sign in to join';
  }
}

let thanksgivingFeastState = null;
const thanksgivingSelections = new Map();
let thanksgivingCountdownInterval = null;

function updateThanksgivingCountdown() {
  const unlockAt = Date.parse(thanksgivingFeastState?.unlock_at);
  if (!Number.isFinite(unlockAt)) return;
  const remaining = Math.max(0, unlockAt - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  elements.thanksgivingFeastCountdownTimer.textContent = [
    ...(days ? [`${days}d`] : []),
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(seconds).padStart(2, '0')}s`
  ].join(' ');
  if (remaining === 0) {
    window.clearInterval(thanksgivingCountdownInterval);
    thanksgivingCountdownInterval = null;
    void loadThanksgivingFeast();
  }
}

function renderThanksgivingFeast() {
  const state = thanksgivingFeastState;
  const signedIn = Boolean(currentUser);
  const completed = new Set((state?.dishes || []).filter((dish) => dish.completed).map((dish) => dish.id));
  const completedSteps = (state?.dishes || []).reduce(
    (count, dish) => count + dish.steps.filter((step) => step.completed).length,
    0
  );
  const totalSteps = (state?.dishes || []).reduce((count, dish) => count + dish.steps.length, 0);
  const locked = Boolean(state?.available && !state?.unlocked);
  elements.thanksgivingFeastCountdown.hidden = !locked;
  if (locked) {
    updateThanksgivingCountdown();
    if (!thanksgivingCountdownInterval) {
      thanksgivingCountdownInterval = window.setInterval(updateThanksgivingCountdown, 1000);
    }
  } else if (thanksgivingCountdownInterval) {
    window.clearInterval(thanksgivingCountdownInterval);
    thanksgivingCountdownInterval = null;
  }
  elements.thanksgivingSignInButton.hidden = signedIn;
  elements.thanksgivingFeastProgress.textContent = !state?.available
    ? 'The Thanksgiving Feast app is closed.'
    : locked
      ? 'The kitchen is locked until 4:00 PM Eastern on November 23.'
    : state?.complete
      ? 'Your feast is complete!'
      : `${completedSteps} of ${totalSteps} steps · ${completed.size} of ${state?.dishes?.length ?? 8} dishes finished${signedIn ? '.' : ' · Sign in to save progress.'}`;
  elements.thanksgivingFeastReward.hidden = !state?.complete;
  elements.thanksgivingFeastRewardSummary.textContent = state?.complete
    ? 'Feast complete! Rewards: Thanksgiving text color, Harvest Feast profile ring, Turkey and Pumpkin emojis, 75 Candy Canes, 10 Gummy Bears, 5 Gingerbread people, and 25 regular fish.'
    : '';
  const thanksgivingColorEquipped =
    currentProfile?.holiday?.equipped_text_color === 'thanksgiving_text_color';
  elements.thanksgivingEquipColorButton.textContent = thanksgivingColorEquipped
    ? 'Thanksgiving text color equipped'
    : 'Equip Thanksgiving text color';
  elements.thanksgivingEquipColorButton.disabled = !signedIn || thanksgivingColorEquipped;
  elements.thanksgivingDishes.replaceChildren(...(state?.dishes || []).map((dish) => {
    const card = document.createElement('article');
    card.className = `feast-dish${dish.completed ? ' feast-dish-done' : ''}`;
    const title = document.createElement('h3');
    title.textContent = dish.name;
    const steps = document.createElement('div');
    steps.className = 'feast-steps';
    const activeStep = dish.steps.findIndex((step) => !step.completed);
    dish.steps.forEach((step, stepIndex) => {
      const stepCard = document.createElement('section');
      stepCard.className = 'feast-step';
      const stepTitle = document.createElement('h4');
      stepTitle.textContent = step.completed ? `${step.title} · Done` : step.title;
      const clue = document.createElement('p');
      clue.textContent = step.completed ? 'Step finished.' : step.clue;
      const choices = document.createElement('div');
      choices.className = 'feast-choices';
      const selectionKey = `${dish.id}:${stepIndex}`;
      for (const choice of step.choices) {
        const button = document.createElement('button');
        button.className = 'feast-choice';
        button.type = 'button';
        button.textContent = choice.name;
        button.dataset.feastSelect = dish.id;
        button.dataset.stepIndex = String(stepIndex);
        button.dataset.choiceId = choice.id;
        button.setAttribute('aria-pressed', String(thanksgivingSelections.get(selectionKey) === choice.id));
        button.disabled = (
          !signedIn || !state?.unlocked || dish.completed || state?.complete ||
          step.completed || stepIndex !== activeStep
        );
        choices.append(button);
      }
      const cookButton = document.createElement('button');
      cookButton.className = 'primary-button';
      cookButton.type = 'button';
      cookButton.dataset.feastCook = dish.id;
      cookButton.dataset.stepIndex = String(stepIndex);
      cookButton.textContent = step.completed ? 'Finished ✓' : `Complete ${step.title.toLowerCase()}`;
      cookButton.disabled = (
        !signedIn || !state?.unlocked || dish.completed || state?.complete ||
        step.completed || stepIndex !== activeStep || !thanksgivingSelections.has(selectionKey)
      );
      stepCard.append(stepTitle, clue, choices, cookButton);
      steps.append(stepCard);
    });
    card.append(title, steps);
    return card;
  }));
}

async function loadThanksgivingFeast() {
  elements.thanksgivingFeastStatus.textContent = 'Loading your kitchen…';
  try {
    const result = await apiRequest('/thanksgiving/feast');
    if (!Array.isArray(result.dishes) || result.dishes.length !== 8 ||
        result.dishes.some((dish) => !dish || typeof dish.id !== 'string' ||
          !Array.isArray(dish.steps) || dish.steps.length !== 3 ||
          dish.steps.some((step) => !step || typeof step.clue !== 'string' || !Array.isArray(step.choices)))) {
      throw new Error('The server returned an invalid Thanksgiving kitchen.');
    }
    thanksgivingFeastState = result;
    if (result.profile && currentUser) {
      currentProfile = result.profile;
      currentUser = { ...currentUser, ...result.profile };
      renderProfile();
    }
    elements.thanksgivingFeastStatus.textContent = '';
    renderThanksgivingFeast();
  } catch (error) {
    elements.thanksgivingFeastStatus.textContent = `The Thanksgiving kitchen could not load: ${error.message}`;
  }
}

async function cookThanksgivingStep(dishId, stepIndex) {
  const selectionKey = `${dishId}:${stepIndex}`;
  const choiceId = thanksgivingSelections.get(selectionKey);
  if (!choiceId || !currentUser) return;
  elements.thanksgivingFeastStatus.textContent = 'Cooking…';
  try {
    const result = await apiRequest('/thanksgiving/feast/cook', {
      method: 'POST',
      body: { dish_id: dishId, step_index: stepIndex, choice_id: choiceId }
    });
    thanksgivingFeastState = {
      ...thanksgivingFeastState,
      dishes: result.dishes,
      complete: result.complete,
      signed_in: true
    };
    if (!result.profile) throw new Error('The server did not return your updated collection.');
    currentProfile = result.profile;
    currentUser = { ...currentUser, ...result.profile };
    if (result.complete) {
      thanksgivingSelections.clear();
      elements.thanksgivingFeastStatus.textContent = 'You cooked the whole feast! Your rewards are saved.';
    } else {
      thanksgivingSelections.delete(selectionKey);
      const dish = result.dishes.find((item) => item.id === dishId);
      const step = dish?.steps[stepIndex];
      elements.thanksgivingFeastStatus.textContent = dish?.completed
        ? `${dish.name} is ready!`
        : `${step?.title ?? 'Cooking step'} finished. Continue with the next step.`;
    }
    renderThanksgivingFeast();
    renderProfile();
  } catch (error) {
    elements.thanksgivingFeastStatus.textContent = `That cooking step could not be completed: ${error.message}`;
  }
}

async function equipThanksgivingTextColor() {
  elements.thanksgivingColorStatus.textContent = '';
  elements.thanksgivingEquipColorButton.disabled = true;
  const equipped = await equipProfileTextColor(
    'thanksgiving_text_color',
    elements.thanksgivingColorStatus
  );
  if (equipped) {
    elements.thanksgivingColorStatus.textContent =
      'Your username now has the Thanksgiving color and turkey decorations.';
  } else {
    elements.thanksgivingEquipColorButton.disabled = false;
  }
}

async function setCalendarMode(nextMode) {
  const sameMode = nextMode === calendarMode;
  if (sameMode && (nextMode !== 'community' || !elements.calendarStatus.textContent)) return;
  const modeRequestId = ++calendarModeRequestId;
  const fetchRequestId = ++communityFetchRequestId;
  elements.calendarStatus.textContent = '';
  if (!sameMode) {
    calendarMode = nextMode;
    events = nextMode === 'personal' ? loadEvents() : [];
    updateCalendarControls();
    render();
  }
  if (nextMode === 'community') {
    subscribeToCommunityEvents();
    if (currentUser) void syncOnlineUsers();
    try {
      const communityEvents = await fetchCommunityEvents();
      if (
        modeRequestId !== calendarModeRequestId ||
        nextMode !== calendarMode ||
        fetchRequestId !== communityFetchRequestId
      ) return;
      events = communityEvents;
      subscribeToCommunityEvents();
      updateCalendarControls();
      render();
      elements.calendarStatus.textContent = 'Shared updates are live. Sign in to add or edit events.';
      notify(currentUser
        ? 'Public calendar loaded. You can manage shared events.'
        : 'Public calendar loaded. Sign in to add or edit events.');
    } catch (error) {
      if (
        modeRequestId !== calendarModeRequestId ||
        nextMode !== calendarMode ||
        fetchRequestId !== communityFetchRequestId
      ) return;
      elements.calendarStatus.textContent = `The public calendar could not load: ${error.message}`;
    }
    return;
  }

  elements.calendarStatus.textContent = '';
  updateCalendarControls();
  render();
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatLongDate(dateKey, includeYear = false) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {})
  }).format(fromDateKey(dateKey));
}

function formatTime(time) {
  if (!time) return '';
  const [hour, minute] = time.split(':').map(Number);
  const use24Hour = settings.timeFormat === '24-hour';
  return new Intl.DateTimeFormat('en', {
    hour: use24Hour ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  }).format(new Date(2000, 0, 1, hour, minute));
}

function sortedEvents(list) {
  return [...list].sort((first, second) =>
    first.date.localeCompare(second.date) ||
    (first.time || '99:99').localeCompare(second.time || '99:99') ||
    first.title.localeCompare(second.title)
  );
}

function getEventCategory(event) {
  return Object.hasOwn(categoryNames, event.category) ? event.category : 'violet';
}

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  elements.monthTitle.textContent = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric'
  }).format(displayedMonth);

  const firstDay = new Date(year, month, 1);
  const weekStart = settings.weekStartsOn === 'sunday' ? 0 : 1;
  const firstDayOffset = (firstDay.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cellCount = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
  const cells = [];
  const visibleRangeStart = new Date(year, month, 1);
  const visibleRangeEnd = new Date(year, month + 1, 0);
  const monthEvents = getExpandedEventsForRange(visibleRangeStart, visibleRangeEnd);

  elements.weekdays.replaceChildren(...Array.from({ length: 7 }, (_, index) => {
    const weekday = new Date(2023, 0, 1 + ((weekStart + index) % 7));
    const label = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(weekday).toUpperCase();
    const element = document.createElement('span');
    element.textContent = label;
    return element;
  }));

  for (let index = 0; index < cellCount; index += 1) {
    let date;
    let isOutsideMonth = false;

    if (index < firstDayOffset) {
      date = new Date(year, month - 1, daysInPreviousMonth - firstDayOffset + index + 1);
      isOutsideMonth = true;
    } else if (index >= firstDayOffset + daysInMonth) {
      date = new Date(year, month + 1, index - firstDayOffset - daysInMonth + 1);
      isOutsideMonth = true;
    } else {
      date = new Date(year, month, index - firstDayOffset + 1);
    }

    const dateKey = toDateKey(date);
    const dayEvents = sortedEvents(monthEvents.filter((event) => event.date === dateKey));
    const classes = [
      'calendar-day',
      isOutsideMonth ? 'outside-month' : '',
      dateKey === toDateKey(today) ? 'is-today' : '',
      dateKey === selectedDate ? 'is-selected' : '',
      dayEvents.length ? 'has-events' : ''
    ].filter(Boolean).join(' ');
    const eventPreview = dayEvents.slice(0, 2).map((event) => {
      const category = getEventCategory(event);
      return `<span class="day-event-chip chip-${category}"><i></i>${escapeHTML(event.title)}</span>`;
    }).join('');
    const extraEvents = dayEvents.length > 2
      ? `<span class="more-events">+${dayEvents.length - 2} more</span>`
      : '';
    const eventLabel = dayEvents.length
      ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`
      : '';

    cells.push(`
      <button class="${classes}" type="button" role="gridcell" data-date="${dateKey}" aria-label="${formatLongDate(dateKey, true)}${eventLabel}" aria-pressed="${dateKey === selectedDate}">
        <span class="day-number">${date.getDate()}</span>
        <span class="day-event-list">${eventPreview}${extraEvents}</span>
      </button>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join('');
}

function eventCard(event, compact = false) {
  const category = getEventCategory(event);
  const time = formatTime(event.time);
  const notes = event.notes ? `<p class="event-notes">${escapeHTML(event.notes)}</p>` : '';
  const recurrence = event.recurrence && event.recurrence !== 'none' ? `<span class="event-repeat-chip">${recurrenceNames[event.recurrence]}</span>` : '';
  const canEdit = calendarMode !== 'community' || currentUser;

  return `
    <article class="event-card event-${category}${compact ? ' compact-event' : ''}">
      <span class="event-color-bar" aria-hidden="true"></span>
      <div class="event-card-content">
        <div class="event-card-topline">
          <span class="event-category"><span class="event-category-icon" aria-hidden="true">${categoryIcons[category]}</span>${categoryNames[category]}</span>
          ${canEdit ? `<button class="event-menu-button" type="button" data-edit-event="${event.id}" data-event-date="${event.date}" aria-label="Edit ${escapeHTML(event.title)}">···</button>` : ''}
        </div>
        <h3>${escapeHTML(event.title)}</h3>
        <p class="event-card-meta">${compact ? `${formatLongDate(event.date)}, ` : ''}${time ? `<span class="event-clock" aria-hidden="true">◷</span> ${time}` : (compact ? 'All day' : 'All day')}${recurrence ? ` · ${recurrenceNames[event.recurrence]}` : ''}</p>
        ${notes}
      </div>
      ${canEdit ? `<button class="event-delete-button" type="button" data-delete-event="${event.id}" aria-label="Delete ${escapeHTML(event.title)}">×</button>` : ''}
    </article>
  `;
}

function renderSidePanel() {
  const visibleEvents = getExpandedEventsForRange(new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 12, 31));
  const selectedEvents = sortedEvents(visibleEvents.filter((event) => event.date === selectedDate));
  const selectedDateObject = fromDateKey(selectedDate);
  const isSelectedDayToday = selectedDate === toDateKey(today);
  const upcomingEvents = sortedEvents(visibleEvents.filter((event) =>
    event.date >= toDateKey(today) && event.date !== selectedDate
  )).slice(0, 4);

  elements.selectedDayLabel.textContent = isSelectedDayToday ? 'YOUR DAY · TODAY' : 'YOUR DAY';
  elements.selectedDateTitle.textContent = new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric'
  }).format(selectedDateObject);
  elements.dayEventCount.textContent = String(selectedEvents.length);
  elements.dayEvents.innerHTML = selectedEvents.length
    ? selectedEvents.map((event) => eventCard(event)).join('')
    : `
      <div class="empty-day">
        <span class="empty-orbit" aria-hidden="true"><span>✳</span></span>
        <strong>No plans just yet</strong>
        <p>A little breathing room. Add something lovely?</p>
      </div>
    `;

  elements.upcomingCount.textContent = String(upcomingEvents.length);
  elements.upcomingList.innerHTML = upcomingEvents.length
    ? upcomingEvents.map((event) => {
      const category = getEventCategory(event);
      return `
      <button class="upcoming-item" type="button" data-select-date="${event.date}">
        <span class="upcoming-date upcoming-${category}">
          <strong>${fromDateKey(event.date).getDate()}</strong>
          <small>${new Intl.DateTimeFormat('en', { month: 'short' }).format(fromDateKey(event.date))}</small>
        </span>
        <span class="upcoming-copy">
          <strong>${escapeHTML(event.title)}</strong>
          <small>${formatTime(event.time) || categoryNames[category]}</small>
        </span>
        <span class="upcoming-arrow" aria-hidden="true">↗</span>
      </button>
    `;
    }).join('')
    : '<p class="upcoming-empty">Your next little adventure will show up here.</p>';
}

function renderSummary() {
  const monthPrefix = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthEvents = getExpandedEventsForRange(
    new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1),
    new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0)
  );
  const dayCount = monthEvents.filter((event) => event.date === selectedDate).length;
  elements.monthEventCount.textContent = String(monthEvents.length).padStart(2, '0');
  elements.dayEventCount.textContent = String(dayCount).padStart(2, '0');
}

function render() {
  renderCalendar();
  renderSidePanel();
  renderSummary();
}

function openEventDialog(dateKey = selectedDate, event = null) {
  if (calendarMode === 'community' && !currentUser) {
    openAuthDialog();
    elements.authMessage.textContent = 'Sign in or create an account to add and edit public calendar events.';
    return;
  }
  editingEventId = event?.id ?? null;
  elements.form.reset();
  elements.formError.textContent = '';
  elements.dialogTitle.textContent = event ? 'Edit your event' : 'Add an event';
  elements.dialogEyebrow.textContent = event ? 'A LITTLE UPDATE' : 'MAKE A LITTLE PLAN';
  elements.saveButtonText.textContent = event ? 'Save changes' : 'Save event';
  elements.deleteButton.hidden = !event;
  elements.titleInput.value = event?.title ?? '';
  elements.dateInput.value = event?.date ?? dateKey;
  elements.timeInput.value = event?.time ?? '';
  elements.categoryInput.value = event?.category ?? settings.defaultEventCategory;
  elements.recurrenceInput.value = event?.recurrence ?? 'none';
  elements.notesInput.value = event?.notes ?? '';
  elements.dialog.showModal();
  elements.titleInput.focus();
}

function closeEventDialog() {
  elements.dialog.close();
  editingEventId = null;
}

function notify(message) {
  elements.liveMessage.textContent = '';
  requestAnimationFrame(() => {
    elements.liveMessage.textContent = message;
  });
}

function showNotificationBanner(title, message, source = 'Hoilday') {
  const banner = document.createElement('article');
  banner.className = 'notification-banner';
  const icon = document.createElement('span');
  icon.className = 'notification-banner-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '✦';

  const copy = document.createElement('div');
  copy.className = 'notification-banner-copy';
  const meta = document.createElement('div');
  meta.className = 'notification-banner-meta';
  const sender = document.createElement('span');
  sender.textContent = source;
  const time = document.createElement('time');
  time.dateTime = new Date().toISOString();
  time.textContent = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date());
  meta.append(sender, time);

  const heading = document.createElement('h2');
  heading.className = 'notification-banner-title';
  heading.textContent = title;
  const body = document.createElement('p');
  body.className = 'notification-banner-message';
  body.textContent = message;
  copy.append(meta, heading, body);

  const dismiss = document.createElement('button');
  dismiss.className = 'notification-banner-dismiss';
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss notification');
  dismiss.textContent = '×';
  let dismissTimer;
  let removeTimer;
  const removeBanner = () => {
    window.clearTimeout(dismissTimer);
    if (banner.classList.contains('is-leaving')) return;
    banner.classList.add('is-leaving');
    removeTimer = window.setTimeout(() => banner.remove(), 380);
  };
  dismiss.addEventListener('click', removeBanner);
  banner.addEventListener('mouseenter', () => window.clearTimeout(dismissTimer));
  banner.addEventListener('mouseleave', () => {
    dismissTimer = window.setTimeout(removeBanner, 1600);
  });
  banner.addEventListener('animationend', (event) => {
    if (event.animationName === 'notification-banner-leave') {
      window.clearTimeout(removeTimer);
      banner.remove();
    }
  });
  banner.append(icon, copy, dismiss);
  elements.notificationBannerHost.prepend(banner);
  while (elements.notificationBannerHost.childElementCount > 3) {
    elements.notificationBannerHost.lastElementChild.remove();
  }
  dismissTimer = window.setTimeout(removeBanner, 5200);
}

function updateNotificationPermissionStatus() {
  const status = elements.notificationPermissionStatus;
  if (!('Notification' in window)) {
    status.dataset.state = 'denied';
    status.textContent = 'Browser notifications are not supported';
    return;
  }
  const permission = Notification.permission;
  status.dataset.state = permission;
  status.textContent = permission === 'granted'
    ? 'Browser notifications are allowed'
    : permission === 'denied'
      ? 'Notifications are blocked in browser settings'
      : 'Browser permission has not been requested';
}

function reminderDueAt(event, reminder) {
  const [year, month, day] = event.date.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  if (reminder.days) {
    due.setHours(3, 0, 0, 0);
    due.setDate(due.getDate() - reminder.days);
    return due;
  }
  if (!event.time) return null;
  const [hour, minute] = event.time.split(':').map(Number);
  due.setHours(hour, minute, 0, 0);
  due.setTime(due.getTime() - reminder.hours * 60 * 60 * 1000);
  return due;
}

function playReminderSound(force = false) {
  if ((!settings.notificationSound && !force) || !audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.setValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.12 * (settings.soundVolume / 100)), now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.36);
}

function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  checkWeeklySummary(now);
  if (!settings.notificationsEnabled) return;

  const sentReminders = new Set();
  try {
    const savedReminders = JSON.parse(localStorage.getItem(SENT_REMINDERS_KEY) || '[]');
    if (!Array.isArray(savedReminders) || savedReminders.some((item) => typeof item !== 'string')) {
      throw new Error('Saved reminder history is not valid.');
    }
    savedReminders.forEach((item) => sentReminders.add(item));
  } catch (error) {
    elements.errorMessage.textContent = `Your reminder history could not be loaded: ${error.message}`;
    return;
  }

  for (const event of events) {
    const [year, month, day] = event.date.split('-').map(Number);
    const eventStartsAt = new Date(year, month - 1, day);
    if (event.time) {
      const [hour, minute] = event.time.split(':').map(Number);
      eventStartsAt.setHours(hour, minute, 0, 0);
    }
    if (eventStartsAt <= now) continue;

    for (const reminder of reminderTypes) {
      if (!settings[reminder.key]) continue;
      const due = reminderDueAt(event, reminder);
      if (!due || due > now || due < now.getTime() - 10 * 60 * 1000) continue;

      const reminderId = `${event.id}:${reminder.key}:${event.date}:${event.time}`;
      if (sentReminders.has(reminderId)) continue;

      try {
        const title = `Hoilday · ${reminder.label}`;
        const body = `${event.title}${event.time ? ` · ${formatTime(event.time)}` : ''}`;
        const notification = new Notification(title, {
          body,
          tag: reminderId
        });
        showNotificationBanner(title, body, 'Calendar reminder');
        notification.addEventListener('click', () => {
          window.focus();
          notification.close();
        });
        sentReminders.add(reminderId);
        localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify([...sentReminders]));
        playReminderSound();
      } catch (error) {
        elements.errorMessage.textContent = `A reminder could not be shown: ${error.message}`;
      }
    }
  }
}

function checkWeeklySummary(now) {
  if (!settings.weeklySummaryEnabled || now.getHours() !== 16 || now.getMinutes() < 30 || now.getMinutes() >= 40) return;

  const todayKey = toDateKey(now);
  if (weeklySummarySentDate === todayKey) return;

  try {
    if (localStorage.getItem(DAILY_WEEKLY_SUMMARY_KEY) === todayKey) {
      weeklySummarySentDate = todayKey;
      return;
    }

    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const endKey = toDateKey(endDate);
    const weekEvents = sortedEvents(events.filter((event) => event.date >= todayKey && event.date < endKey));
    const body = weekEvents.length
      ? `${weekEvents.length} event${weekEvents.length === 1 ? '' : 's'} in the next 7 days: ${weekEvents.slice(0, 3).map((event) => `${event.title.slice(0, 32)} (${formatLongDate(event.date)})`).join('; ')}${weekEvents.length > 3 ? `; and ${weekEvents.length - 3} more` : ''}.`
      : 'Nothing scheduled in the next 7 days. Enjoy the breathing room.';
    const title = 'Hoilday · Your week ahead';
    const notification = new Notification(title, {
      body,
      tag: `weekly-summary-${todayKey}`
    });
    showNotificationBanner(title, body, 'Your week ahead');
    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
    });
    weeklySummarySentDate = todayKey;
    localStorage.setItem(DAILY_WEEKLY_SUMMARY_KEY, todayKey);
    playReminderSound();
  } catch (error) {
    elements.errorMessage.textContent = `Your daily week-ahead notification could not be shown: ${error.message}`;
  }
}

async function prepareReminderSound() {
  if (!settings.notificationSound) return;
  if (!window.AudioContext) {
    elements.notificationStatus.textContent = 'Sound notifications are not supported by this browser.';
    return;
  }
  try {
    audioContext ??= new window.AudioContext();
    await audioContext.resume();
  } catch (error) {
    elements.notificationStatus.textContent = `Sound notifications could not be enabled: ${error.message}`;
  }
}

function makeId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openAuthDialog() {
  authMode = 'sign-in';
  elements.authTitle.textContent = 'Sign in';
  elements.authDescription.textContent = 'Sign in with your username to join the chat, save your rank, and edit public calendar events.';
  elements.authModeButton.textContent = 'Create an account';
  elements.authSubmitButton.innerHTML = 'Sign in <span aria-hidden="true">↗</span>';
  elements.authPassword.autocomplete = 'current-password';
  elements.authPassword.minLength = 8;
  elements.authMessage.textContent = 'Your account works across devices on the shared Hoilday server.';
  elements.authDialog.showModal();
  elements.authUsername.focus();
}

elements.createAccountButton.addEventListener('click', () => {
  openAuthDialog();
  elements.authModeButton.click();
});

elements.accountButton.addEventListener('click', async () => {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  try {
    await apiRequest('/auth/logout', { method: 'POST', body: {} });
    localStorage.removeItem(SESSION_STORAGE_KEY);
    currentUser = null;
    currentProfile = null;
    emojiCatalog = [];
    tradingData = null;
    renderProfile();
    updateTradingSelects();
    renderTradeOffers();
    applySettings();
    updateCalendarControls();
    render();
    void loadEmojiCollection();
    notify('Signed out of your Hoilday account.');
  } catch (error) {
    elements.errorMessage.textContent = `You could not be signed out: ${error.message}`;
  }
});

document.querySelector('#closeAuthButton').addEventListener('click', () => elements.authDialog.close());
elements.authModeButton.addEventListener('click', () => {
  authMode = authMode === 'sign-in' ? 'sign-up' : 'sign-in';
  const isSignUp = authMode === 'sign-up';
  elements.authTitle.textContent = isSignUp ? 'Create your account' : 'Sign in';
  elements.authDescription.textContent = isSignUp
    ? 'Choose a unique username and password. Your username is how other anglers will find you.'
    : 'Sign in with the username you chose when you created your account.';
  elements.authModeButton.textContent = isSignUp ? 'Already have an account? Sign in' : 'Create an account';
  elements.authSubmitButton.innerHTML = `${isSignUp ? 'Create account' : 'Sign in'} <span aria-hidden="true">↗</span>`;
  elements.authPassword.autocomplete = isSignUp ? 'new-password' : 'current-password';
  elements.authMessage.textContent = '';
});

elements.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.authForm.reportValidity()) return;

  elements.authSubmitButton.disabled = true;
  elements.authMessage.textContent = '';
  const username = elements.authUsername.value.trim().toLowerCase();
  const password = elements.authPassword.value;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    elements.authMessage.textContent = 'Use 3–20 letters, numbers, or underscores for your username.';
    elements.authSubmitButton.disabled = false;
    return;
  }
  try {
    const result = await apiRequest(authMode === 'sign-up' ? '/auth/register' : '/auth/login', {
      method: 'POST',
      body: { username, password }
    });
    localStorage.setItem(SESSION_STORAGE_KEY, result.token);
    currentUser = result.user;
    currentProfile = result.user;
    tradingData = null;
    renderProfile();
    applySettings();
    updateCalendarControls();
    render();
    if (activePage === 'emojis' || activePage === 'profile') void loadEmojiCollection();
    if (activePage === 'turkey-fishing' || activePage === 'profile') void loadTurkeyFishing();
    if (activePage === 'thanksgiving-feast') void loadThanksgivingFeast();
    if (activePage === 'trading') void loadTrading();
    void syncOnlineUsers();
    void syncChatMessages(true);
    void pollAccountWarnings();
    if (result.user.is_admin) void refreshAdminPanel();
    if (!elements.questsPanel.hidden) void loadSideQuests();

    elements.authDialog.close();
    elements.authForm.reset();
    notify(authMode === 'sign-up' ? 'Your account is ready.' : 'Welcome back.');
  } catch (error) {
    if (error.autoBan) showAutomaticBan(error.autoBan);
    else elements.authMessage.textContent = `Account request failed: ${error.message}`;
  } finally {
    elements.authSubmitButton.disabled = false;
  }
});

async function catchSeasonalFish() {
  if (!currentUser) {
    openAuthDialog();
    elements.authMessage.textContent = 'Sign in to fish and save your seasonal rank.';
    return;
  }
  elements.catchFishButton.disabled = true;
  elements.catchStatus.textContent = 'The line is in the water…';
  try {
    const result = await apiRequest('/fish', { method: 'POST', body: {} });
    currentProfile = result.profile;
    currentUser = { ...currentUser, fish_caught: result.profile.fish_caught };
    updateCalendarControls();
    elements.catchStatus.textContent = result.rank_unlocked
      ? `You unlocked ${result.caught_rank}! Choose it in your profile.`
      : `You caught ${result.caught_rank} again. Choose your favorite unlocked rank in your profile.`;
    if (calendarMode === 'community') void syncOnlineUsers();
  } catch (error) {
    elements.catchStatus.textContent = `Fishing failed: ${error.message}`;
  } finally {
    window.setTimeout(() => {
      elements.catchFishButton.disabled = !currentUser;
    }, 3000);
  }
}

async function chooseProfileRank(rank) {
  elements.profileRankStatus.textContent = '';
  try {
    const result = await apiRequest('/profile/rank', {
      method: 'PUT',
      body: { rank }
    });
    currentUser = result.user;
    currentProfile = result.user;
    renderProfile();
    elements.profileRankStatus.textContent = `${rank} is now your profile rank.`;
    if (calendarMode === 'community') void syncOnlineUsers();
  } catch (error) {
    elements.profileRankStatus.textContent = `Your rank could not be changed: ${error.message}`;
  }
}

async function loadSideQuests() {
  if (!currentUser) {
    elements.harvestStartButton.disabled = true;
    elements.drumstickStartButton.disabled = true;
    elements.questsStatus.textContent = 'Sign in to play side quests and save your rewards.';
    return;
  }
  if (sideQuestLoadInProgress) return;
  sideQuestLoadInProgress = true;
  elements.questsStatus.textContent = '';
  try {
    const result = await apiRequest('/quests');
    currentProfile = result.profile;
    currentUser = { ...currentUser, rank: result.profile.rank, fish_caught: result.profile.fish_caught };
    const harvest = result.quests.find((quest) => quest.id === 'harvest');
    const drumstick = result.quests.find((quest) => quest.id === 'drumstick');
    const target = seasonalInfoState?.ring_fishing_target ?? 'turkey';
    elements.harvestStartButton.disabled = harvest.completed;
    elements.drumstickStartButton.disabled = drumstick.completed;
    if (harvest.completed) {
      elements.harvestGame.hidden = true;
      elements.harvestStartButton.textContent = 'Quest complete';
      elements.harvestQuestStatus.textContent = `You found it and unlocked ${harvest.reward}!`;
    } else {
      elements.harvestStartButton.textContent = 'Start the hunt';
      elements.harvestQuestStatus.textContent = seasonalInfoState?.christmas_enabled
        ? 'Three guesses to find the present.'
        : 'Three guesses to find the golden leaf.';
    }
    if (drumstick.completed) {
      window.clearTimeout(drumstickReadyTimer);
      elements.drumstickGame.hidden = true;
      elements.drumstickStartButton.textContent = 'Quest complete';
      elements.drumstickStartButton.disabled = true;
      elements.drumstickQuestStatus.textContent = `Quick reflexes! You unlocked ${drumstick.reward}.`;
    } else {
      elements.drumstickStartButton.textContent = 'Start the dash';
      elements.drumstickQuestStatus.textContent = `Wait for the ${target}, then tap quickly.`;
    }
    renderProfile();
  } catch (error) {
    elements.questsStatus.textContent = `Side quests could not be loaded: ${error.message}`;
  } finally {
    sideQuestLoadInProgress = false;
  }
}

async function startHarvestHunt() {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  elements.harvestStartButton.disabled = true;
  try {
    const result = await apiRequest('/quests/harvest/start', { method: 'POST', body: {} });
    elements.harvestGame.hidden = false;
    elements.harvestClue.textContent = seasonalInfoState?.christmas_enabled
      ? `Find the present. You have ${result.attempts_left} guesses.`
      : `Find the golden leaf. You have ${result.attempts_left} guesses.`;
    elements.harvestQuestStatus.textContent = 'Choose a spot to search.';
    elements.harvestChoices.querySelectorAll('[data-harvest-choice]').forEach((button) => {
      button.disabled = false;
    });
  } catch (error) {
    elements.harvestQuestStatus.textContent = `The hunt could not start: ${error.message}`;
  } finally {
    elements.harvestStartButton.disabled = false;
  }
}

async function chooseHarvestFind(button) {
  if (!currentUser || button.disabled) return;
  elements.harvestChoices.querySelectorAll('[data-harvest-choice]').forEach((choice) => {
    choice.disabled = true;
  });
  try {
    const result = await apiRequest('/quests/harvest/claim', {
      method: 'POST',
      body: { choice: Number(button.dataset.harvestChoice) }
    });
    if (result.completed) {
      currentProfile = result.profile;
      currentUser = { ...currentUser, rank: result.profile.rank, unlocked_ranks: result.profile.unlocked_ranks };
      elements.harvestQuestStatus.textContent = `You found it! ${result.reward} is now in your rank collection.`;
      elements.harvestGame.hidden = true;
      updateCalendarControls();
      void loadSideQuests();
      return;
    }
    button.disabled = true;
    elements.harvestClue.textContent = result.attempts_left
      ? `${result.message} ${result.attempts_left} guesses left.`
      : result.message;
    elements.harvestQuestStatus.textContent = result.attempts_left ? 'Keep looking!' : 'Try starting a fresh hunt.';
    if (!result.attempts_left) elements.harvestGame.hidden = true;
    else {
      elements.harvestChoices.querySelectorAll('[data-harvest-choice]:not(:disabled)').forEach((choice) => {
        choice.disabled = false;
      });
    }
  } catch (error) {
    elements.harvestQuestStatus.textContent = `That find could not be checked: ${error.message}`;
    elements.harvestChoices.querySelectorAll('[data-harvest-choice]:not(:disabled)').forEach((choice) => {
      choice.disabled = false;
    });
    if (error.message.includes('expired')) elements.harvestGame.hidden = true;
  }
}

async function startDrumstickDash() {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  elements.drumstickStartButton.disabled = true;
  window.clearTimeout(drumstickReadyTimer);
  try {
    const result = await apiRequest('/quests/drumstick/start', { method: 'POST', body: {} });
    elements.drumstickGame.hidden = false;
    elements.drumstickSignal.hidden = true;
    elements.drumstickReactButton.hidden = true;
    elements.drumstickReactButton.disabled = true;
    elements.drumstickStartButton.hidden = true;
    elements.drumstickQuestStatus.textContent = 'Get ready… don’t tap early!';
    drumstickReadyTimer = window.setTimeout(() => {
      elements.drumstickSignal.hidden = false;
      elements.drumstickReactButton.hidden = false;
      elements.drumstickReactButton.disabled = false;
      elements.drumstickQuestStatus.textContent = `Now! Tap the ${seasonalInfoState?.ring_fishing_target ?? 'turkey'}!`;
    }, result.ready_in_ms);
  } catch (error) {
    elements.drumstickQuestStatus.textContent = `The dash could not start: ${error.message}`;
  } finally {
    elements.drumstickStartButton.disabled = false;
  }
}

async function tapDrumstick() {
  elements.drumstickReactButton.disabled = true;
  try {
    const result = await apiRequest('/quests/drumstick/claim', { method: 'POST', body: {} });
    currentProfile = result.profile;
    currentUser = { ...currentUser, rank: result.profile.rank, unlocked_ranks: result.profile.unlocked_ranks };
    elements.drumstickQuestStatus.textContent = `Great catch! You unlocked ${result.reward}.`;
    elements.drumstickGame.hidden = true;
    elements.drumstickStartButton.hidden = false;
    updateCalendarControls();
    void loadSideQuests();
  } catch (error) {
    elements.drumstickQuestStatus.textContent = error.message.includes('Wait until')
      ? `Too early! Wait for the ${seasonalInfoState?.ring_fishing_target ?? 'turkey'} to appear before tapping.`
      : error.message.includes('got away')
        ? 'Too slow! Start another dash and try again.'
        : `The dash could not be finished: ${error.message}`;
    if (error.message.includes('got away')) {
      elements.drumstickGame.hidden = true;
      elements.drumstickStartButton.hidden = false;
    } else {
      window.setTimeout(() => {
        elements.drumstickReactButton.disabled = false;
      }, 120);
    }
  }
}

elements.catchFishButton.addEventListener('click', catchSeasonalFish);
elements.emojiFishButton.addEventListener('click', fishForEmoji);
elements.emojiSignInButton.addEventListener('click', openAuthDialog);
elements.clearEmojiButton.addEventListener('click', () => equipEmoji(''));
elements.emojiCollection.addEventListener('click', (event) => {
  const button = event.target.closest('[data-equip-emoji]');
  if (button) void equipEmoji(button.dataset.equipEmoji);
});
elements.turkeyFishButton.addEventListener('click', fishForProfileRing);
elements.turkeySignInButton.addEventListener('click', openAuthDialog);
elements.thanksgivingSignInButton.addEventListener('click', openAuthDialog);
elements.thanksgivingEquipColorButton.addEventListener('click', equipThanksgivingTextColor);
elements.thanksgivingDishes.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-feast-select]');
  if (choice && !choice.disabled) {
    const stepIndex = Number(choice.dataset.stepIndex);
    thanksgivingSelections.set(
      `${choice.dataset.feastSelect}:${stepIndex}`,
      choice.dataset.choiceId
    );
    renderThanksgivingFeast();
    return;
  }
  const cookButton = event.target.closest('[data-feast-cook]');
  if (cookButton && !cookButton.disabled) {
    void cookThanksgivingStep(cookButton.dataset.feastCook, Number(cookButton.dataset.stepIndex));
  }
});
elements.profileRingList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-equip-ring]');
  if (button && !button.disabled) void equipProfileRing(button.dataset.equipRing);
});
elements.profileTextColorList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-equip-text-color]');
  if (button && !button.disabled) void equipProfileTextColor(button.dataset.equipTextColor);
});
elements.profileEmojiList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-equip-emoji]');
  if (button && !button.disabled) void equipEmoji(button.dataset.equipEmoji);
});
elements.adminOnlineList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-admin-profile]');
  if (button) void viewAdminProfile(button.dataset.adminProfile);
});
elements.adminBanList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-unban-user]');
  if (button) void unbanAdminTarget(button.dataset.unbanUser);
});
elements.adminAccountsList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-account]');
  if (button) void deleteAdminAccount(button.dataset.deleteAccount, button);
});
elements.adminEventList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-admin-event]');
  if (editButton) {
    editAdminEvent(editButton.dataset.editAdminEvent);
    return;
  }
  const deleteButton = event.target.closest('[data-delete-admin-event]');
  if (deleteButton) void deleteAdminEvent(deleteButton.dataset.deleteAdminEvent, deleteButton);
});
elements.adminMailList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-mark-report-read]');
  if (button) void markAdminReportRead(button.dataset.markReportRead, button);
});
elements.adminTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    selectAdminTab(tab.dataset.adminTab);
    if (tab.dataset.adminTab === 'advent') void loadAdminAdventPreview();
    if (tab.dataset.adminTab === 'tools') void loadAdminTools();
  });
});
elements.adminAccountsSearch.addEventListener('input', renderAdminAccounts);
elements.adminRewardForm.addEventListener('submit', submitAdminReward);
elements.adminRewardType.addEventListener('change', renderAdminRewardControls);
elements.adminAnnouncementForm.addEventListener('submit', submitAdminAnnouncement);
elements.adminAnnouncementClear.addEventListener('click', clearAdminAnnouncement);
elements.adminEventForm.addEventListener('submit', submitAdminEvent);
elements.adminEventCancelEdit.addEventListener('click', resetAdminEventForm);
elements.dismissGlobalAnnouncement.addEventListener('click', () => {
  if (currentGlobalAnnouncement) {
    localStorage.setItem('dayglowDismissedAnnouncementId', String(currentGlobalAnnouncement.id));
  }
  elements.globalAnnouncement.hidden = true;
});
elements.adminWarnButton.addEventListener('click', sendAdminWarning);
elements.adminWinterToggle.addEventListener('click', toggleGlobalWinterMode);
elements.adminBanButton.addEventListener('click', banAdminTarget);
elements.adminCamelWeatherToggle.addEventListener('click', toggleCamelWeather);
elements.adminChristmasWeatherToggle.addEventListener('click', toggleChristmasWeather);
elements.reportForm.addEventListener('submit', submitReport);
elements.reportSignInButton.addEventListener('click', openAuthDialog);
elements.closeWarningButton.addEventListener('click', () => elements.warningDialog.close());
elements.closeAutoBanButton.addEventListener('click', () => elements.autoBanDialog.close());
elements.warningDialog.addEventListener('close', () => {
  window.setTimeout(showNextWarning, 0);
});
elements.profileFishButton.addEventListener('click', () => {
  setActivePage('seasonal');
  elements.fishingTab.click();
});
elements.profileAvatarInput.addEventListener('change', () => {
  const [file] = elements.profileAvatarInput.files ?? [];
  if (file) void uploadSelectedProfilePicture(file);
});
elements.removeProfileAvatarButton.addEventListener('click', removeProfilePicture);
elements.openProfileButton.addEventListener('click', () => setActivePage('profile'));
function selectSeasonalTab(tabName) {
  const tabs = {
    fishing: [elements.fishingTab, elements.fishingPanel],
    ranks: [elements.ranksTab, elements.ranksPanel],
    quests: [elements.questsTab, elements.questsPanel]
  };
  Object.entries(tabs).forEach(([name, [tab, panel]]) => {
    tab.setAttribute('aria-selected', String(name === tabName));
    panel.hidden = name !== tabName;
  });
  if (tabName === 'quests') void loadSideQuests();
}
elements.fishingTab.addEventListener('click', () => selectSeasonalTab('fishing'));
elements.ranksTab.addEventListener('click', () => selectSeasonalTab('ranks'));
elements.questsTab.addEventListener('click', () => selectSeasonalTab('quests'));
elements.harvestStartButton.addEventListener('click', startHarvestHunt);
elements.harvestChoices.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-harvest-choice]');
  if (choice) void chooseHarvestFind(choice);
});
elements.drumstickStartButton.addEventListener('click', startDrumstickDash);
elements.drumstickReactButton.addEventListener('click', tapDrumstick);
elements.profileRankList.addEventListener('click', (event) => {
  const rankButton = event.target.closest('[data-select-rank]');
  if (rankButton && !rankButton.disabled) void chooseProfileRank(rankButton.dataset.selectRank);
});

elements.personalCalendarButton.addEventListener('click', () => setCalendarMode('personal'));
elements.communityCalendarButton.addEventListener('click', () => setCalendarMode('community'));
elements.communityCalendarTab.addEventListener('click', () => selectCommunityView('calendar'));
elements.communityOnlineTab.addEventListener('click', () => selectCommunityView('online'));
elements.chatTab.addEventListener('click', () => selectChatView('chat'));
elements.chatOnlineTab.addEventListener('click', () => selectChatView('online'));
elements.chatSignInButton.addEventListener('click', openAuthDialog);
elements.chatNotificationButton.addEventListener('click', enableChatNotifications);
elements.chatClearButton.addEventListener('click', async () => {
  if (!currentUser || !window.confirm('This permanently deletes the shared chat history for everyone. This cannot be undone. Continue?')) return;
  elements.chatClearButton.disabled = true;
  elements.chatStatus.textContent = '';
  try {
    const result = await apiRequest('/chat/messages', { method: 'DELETE' });
    if (!Number.isInteger(result.generation)) {
      throw new Error('The server returned an invalid chat history version.');
    }
    chatRenderEpoch += 1;
    chatGeneration = result.generation;
    lastChatMessageId = 0;
    chatUnreadCount = 0;
    updateChatUnreadBadge();
    elements.chatMessages.replaceChildren();
    showChatEmptyMessage();
    elements.chatStatus.textContent = 'Shared chat history cleared for everyone.';
  } catch (error) {
    elements.chatStatus.textContent = `Chat history could not be cleared: ${error.message}`;
  } finally {
    elements.chatClearButton.disabled = false;
  }
});
elements.chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = elements.chatMessageInput.value.trim();
  if (!message) {
    elements.chatMessageInput.focus();
    return;
  }
  elements.chatSendButton.disabled = true;
  elements.chatStatus.textContent = '';
  try {
    await apiRequest('/chat/messages', { method: 'POST', body: { message } });
    elements.chatMessageInput.value = '';
    elements.chatStatus.textContent = 'Message sent.';
    void syncChatMessages();
  } catch (error) {
    if (error.autoBan) showAutomaticBan(error.autoBan);
    else elements.chatStatus.textContent = `Message could not be sent: ${error.message}`;
  } finally {
    elements.chatSendButton.disabled = false;
  }
});
elements.chatMessageInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  elements.chatForm.requestSubmit();
});
elements.updateRefreshButton.addEventListener('click', () => {
  if (!canAutomaticallyRefresh()) {
    elements.updateNoticeLabel.textContent = 'SAVE YOUR MESSAGE OR CLOSE EDITORS TO REFRESH';
    return;
  }
  window.location.reload();
});
elements.updateDismissButton.addEventListener('click', () => {
  elements.updateNotice.hidden = true;
});
elements.closeUpdateDialogButton.addEventListener('click', () => elements.updateDialog.close());
elements.updateDialog.addEventListener('close', () => {
  try {
    localStorage.removeItem(PENDING_UPDATE_STORAGE_KEY);
  } catch (error) {
    elements.errorMessage.textContent = `The update notice could not be dismissed: ${error.message}`;
  }
});
elements.giftType.addEventListener('change', updateTradingSelects);
elements.giftRecipient.addEventListener('change', updateTradingSelects);
elements.tradeRecipient.addEventListener('change', updateTradingSelects);
elements.tradeOfferedType.addEventListener('change', updateTradingSelects);
elements.tradeRequestedType.addEventListener('change', updateTradingSelects);
elements.giftForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const type = elements.giftType.value;
  const itemId = elements.giftItem.value;
  const recipient = elements.giftRecipient.value;
  const item = tradingItems(type, true, recipient).find((candidate) => candidate.id === itemId);
  if (!item) {
    elements.giftStatus.textContent = 'Choose an item from your collection first.';
    return;
  }
  const itemName = tradingItemLabel(type, item);
  if (!window.confirm(`Gift ${itemName} to ${recipient}? This transfer cannot be undone.`)) return;
  elements.giftSubmitButton.disabled = true;
  elements.giftStatus.textContent = 'Sending gift…';
  try {
    const result = await apiRequest('/gifts', {
      method: 'POST',
      body: {
        recipient,
        item_type: type,
        item_id: itemId
      }
    });
    currentProfile = result.profile;
    currentUser = { ...currentUser, ...result.profile };
    elements.giftStatus.textContent = `Gifted ${result.item_name} to ${result.recipient}.`;
    render();
    await loadTrading();
  } catch (error) {
    elements.giftStatus.textContent = `Gift could not be sent: ${error.message}`;
  } finally {
    updateTradingSelects();
  }
});
elements.tradeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.tradeSubmitButton.disabled = true;
  elements.tradeStatus.textContent = 'Sending trade offer…';
  try {
    const result = await apiRequest('/trades', {
      method: 'POST',
      body: {
        recipient: elements.tradeRecipient.value.trim(),
        offered_type: elements.tradeOfferedType.value,
        offered_item_id: elements.tradeOfferedItem.value,
        requested_type: elements.tradeRequestedType.value,
        requested_item_id: elements.tradeRequestedItem.value
      }
    });
    elements.tradeStatus.textContent = result.status === 'accepted'
      ? 'Trade completed with the bot.'
      : result.status === 'declined'
        ? 'The bot declined this trade.'
        : 'Trade offer sent.';
    await loadTrading();
  } catch (error) {
    elements.tradeStatus.textContent = `Trade offer could not be sent: ${error.message}`;
  } finally {
    updateTradingSelects();
  }
});
elements.tradeOfferList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-trade-action]');
  if (!button) return;
  const { tradeAction: action, offerId } = button.dataset;
  if (action === 'accept' && !window.confirm('Accept this trade? Both items will be transferred immediately.')) return;
  button.disabled = true;
  elements.tradingStatus.textContent = 'Updating trade offer…';
  try {
    const result = await apiRequest(`/trades/${encodeURIComponent(offerId)}/${action}`, {
      method: 'POST',
      body: {}
    });
    if (result.profile) {
      currentProfile = result.profile;
      currentUser = { ...currentUser, ...result.profile };
      render();
    }
    elements.tradingStatus.textContent = `Trade ${result.status}.`;
    await loadTrading();
  } catch (error) {
    elements.tradingStatus.textContent = `Trade could not be updated: ${error.message}`;
    button.disabled = false;
  }
});
document.querySelectorAll('[data-page]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (link.dataset.appUrl) {
      window.location.assign(link.dataset.appUrl);
      return;
    }
    setActivePage(link.dataset.page);
  });
});
document.querySelector('#homeButton').addEventListener('click', () => setActivePage('home'));
document.querySelector('#appCloseButton').addEventListener('click', () => setActivePage('home'));
elements.homeAppOrderList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-order-move]');
  if (!button || button.disabled) return;
  const appId = button.closest('[data-app-id]').dataset.appId;
  const direction = button.dataset.orderMove;
  const visibleOrder = settings.appOrder.filter((id) => !homeAppButtons.get(id)?.hidden);
  const visibleIndex = visibleOrder.indexOf(appId);
  const nextIndex = visibleIndex + (direction === 'up' ? -1 : 1);
  if (visibleIndex < 0 || nextIndex < 0 || nextIndex >= visibleOrder.length) return;
  [visibleOrder[visibleIndex], visibleOrder[nextIndex]] = [visibleOrder[nextIndex], visibleOrder[visibleIndex]];
  let visibleSlot = 0;
  const visibleIds = new Set(visibleOrder);
  const nextOrder = settings.appOrder.map((id) => visibleIds.has(id) ? visibleOrder[visibleSlot++] : id);
  if (saveHomeAppOrder(nextOrder)) {
    elements.homeAppOrderList
      .querySelector(`li[data-app-id="${appId}"] button[data-order-move="${direction}"]`)
      ?.focus();
  }
});
elements.homeBackgroundInput.addEventListener('change', async () => {
  const [file] = elements.homeBackgroundInput.files ?? [];
  if (!file) return;
  elements.homeBackgroundStatus.textContent = 'Preparing your background image…';
  elements.homeBackgroundInput.disabled = true;
  try {
    const blob = await resizeHomeBackground(file);
    await saveHomeBackground(blob);
    elements.homeBackgroundStatus.textContent = 'Home-screen background saved in this browser.';
  } catch (error) {
    elements.homeBackgroundStatus.textContent = `Background image could not be saved: ${error.message}`;
  } finally {
    elements.homeBackgroundInput.disabled = false;
    elements.homeBackgroundInput.value = '';
  }
});
elements.removeHomeBackgroundButton.addEventListener('click', removeHomeBackground);
elements.resetHomeAppOrderButton.addEventListener('click', () => {
  if (saveHomeAppOrder([...DEFAULT_HOME_APP_ORDER])) {
    elements.resetHomeAppOrderButton.focus();
  }
});
elements.exportAccountButton.addEventListener('click', exportAccountBackup);
elements.importAccountForm.addEventListener('submit', importAccountBackup);
elements.calendarGrid.addEventListener('click', (event) => {
  const dayButton = event.target.closest('[data-date]');
  if (!dayButton) return;

  selectedDate = dayButton.dataset.date;
  const date = fromDateKey(selectedDate);
  displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  render();
});

document.querySelector('#previousMonth').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  render();
});

document.querySelector('#nextMonth').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  render();
});

document.querySelector('#todayButton').addEventListener('click', () => {
  displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedDate = toDateKey(today);
  render();
});

document.querySelector('#addEventButton').addEventListener('click', () => openEventDialog());
document.querySelector('#addDayEventButton').addEventListener('click', () => openEventDialog(selectedDate));
document.querySelector('#closeDialogButton').addEventListener('click', closeEventDialog);
function selectSettingsTab(tabName, focusTab = false) {
  elements.settingsTabs.forEach((tab) => {
    const isSelected = tab.dataset.settingsTab === tabName;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    if (isSelected && focusTab) tab.focus();
  });
  elements.settingsPanels.forEach((panel) => {
    panel.hidden = panel.dataset.settingsPanel !== tabName;
  });
}

elements.settingsTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectSettingsTab(tab.dataset.settingsTab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? elements.settingsTabs.length - 1
        : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + elements.settingsTabs.length) % elements.settingsTabs.length;
    const nextTab = elements.settingsTabs[nextIndex];
    selectSettingsTab(nextTab.dataset.settingsTab, true);
  });
});

function openSettings() {
  elements.settingsError.textContent = '';
  renderHomeAppOrder();
  populateSettingsForm();
  selectSettingsTab('appearance');
  elements.settingsOverlay.hidden = false;
  elements.settingsPanel.focus();
}
document.querySelector('#openSettingsButton').addEventListener('click', openSettings);
document.querySelector('[data-open-settings]').addEventListener('click', openSettings);
function closeSettings() {
  elements.settingsOverlay.hidden = true;
  document.querySelector('[data-open-settings]').focus();
}

document.querySelector('#closeSettingsButton').addEventListener('click', closeSettings);

elements.soundVolume.addEventListener('input', () => {
  elements.soundVolumeValue.value = `${elements.soundVolume.value}%`;
});

elements.previewSoundButton.addEventListener('click', async () => {
  elements.audioStatus.textContent = '';
  if (!window.AudioContext) {
    elements.audioStatus.textContent = 'Sound previews are not supported by this browser.';
    return;
  }
  try {
    audioContext ??= new window.AudioContext();
    await audioContext.resume();
    settings.soundVolume = Number(elements.soundVolume.value);
    playReminderSound(true);
    elements.audioStatus.textContent = 'Previewing your reminder chime.';
  } catch (error) {
    elements.audioStatus.textContent = `The sound preview could not be played: ${error.message}`;
  }
});

elements.emailSummaryButton.addEventListener('click', () => {
  const recipient = elements.reminderEmail.value.trim();
  if (!recipient) {
    elements.emailSummaryStatus.textContent = 'Enter an email address above first.';
    elements.reminderEmail.focus();
    return;
  }
  if (!elements.reminderEmail.checkValidity()) {
    elements.emailSummaryStatus.textContent = 'Enter a valid email address first.';
    elements.reminderEmail.focus();
    return;
  }

  const todayKey = toDateKey(new Date());
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() + 7);
  const endKey = toDateKey(endDate);
  const upcomingEvents = sortedEvents(events.filter((item) => item.date >= todayKey && item.date < endKey));
  const body = upcomingEvents.length
    ? `Here are your Hoilday plans for the next 7 days:\n\n${upcomingEvents.map((item) =>
      `• ${formatLongDate(item.date)}${item.time ? ` at ${formatTime(item.time)}` : ''}: ${item.title}`
    ).join('\n')}\n\nSee you soon!\nHoilday`
    : 'Nothing scheduled in the next 7 days. Enjoy the breathing room!\n\nHoilday';
  const draftUrl = new URL('https://outlook.office.com/mail/deeplink/compose');
  draftUrl.search = new URLSearchParams({
    to: recipient,
    subject: 'Hoilday notification: your week ahead',
    body
  }).toString();

  const draftWindow = window.open(draftUrl.href, '_blank');
  if (draftWindow) {
    draftWindow.opener = null;
    elements.emailSummaryStatus.textContent = 'Outlook draft opened. Review it and press Send to email it.';
  } else {
    elements.emailSummaryStatus.textContent = 'Outlook could not be opened. Allow pop-ups for this site and try again.';
  }
});
elements.notificationsEnabled.addEventListener('change', updateReminderControls);
elements.testNotificationButton.addEventListener('click', async () => {
  elements.testNotificationButton.disabled = true;
  elements.testNotificationStatus.textContent = '';

  try {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported here. Open Hoilday in a browser that supports notifications over HTTPS or localhost.');
    }

    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error(permission === 'denied'
        ? 'Notifications are blocked. Allow them for this site in your browser settings, then try again.'
        : 'Notification permission was not granted.');
    }

    const registration = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistration()
      : null;
    if (registration) {
      await registration.showNotification('Hoilday · Test notification', {
        body: 'Your browser can show Hoilday notifications.',
        icon: './icon.svg',
        tag: 'dayglow-test-notification'
      });
    } else {
      const notification = new Notification('Hoilday · Test notification', {
        body: 'Your browser can show Hoilday notifications.',
        tag: 'dayglow-test-notification'
      });
      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
      });
    }

    showNotificationBanner('Hoilday · Test notification', 'Your browser can show Hoilday notifications.', 'Test notification');
    elements.testNotificationStatus.textContent = 'Test notification sent.';
  } catch (error) {
    elements.testNotificationStatus.textContent = `Test notification failed: ${error.message}`;
  } finally {
    elements.testNotificationButton.disabled = false;
    updateNotificationPermissionStatus();
  }
});

elements.previewBannerButton.addEventListener('click', () => {
  showNotificationBanner('A little reminder', 'Your notification banners slide in at the top, then fade away.', 'Hoilday Preview');
});

elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeEventDialog();
});

elements.settingsOverlay.addEventListener('click', (event) => {
  if (event.target === elements.settingsOverlay) closeSettings();
});

document.addEventListener('keydown', (event) => {
  if (elements.settingsOverlay.hidden) return;
  if (event.key === 'Escape') {
    closeSettings();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusableElements = [...elements.settingsPanel.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.closest('[hidden]') && element.tabIndex >= 0);
  if (!focusableElements.length) return;
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);
  const focusIsOutsidePanel = !elements.settingsPanel.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === firstElement || focusIsOutsidePanel || document.activeElement === elements.settingsPanel)) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutsidePanel)) {
    event.preventDefault();
    firstElement.focus();
  }
});

elements.notificationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.notificationForm.reportValidity()) return;

  elements.notificationStatus.textContent = '';
  elements.audioStatus.textContent = '';
  settings = {
    ...settings,
    weeklySummaryEnabled: elements.weeklySummaryEnabled.checked,
    notificationsEnabled: elements.notificationsEnabled.checked,
    reminderFiveDays: elements.reminderControls[0].checked,
    reminderOneDay: elements.reminderControls[1].checked,
    reminderFiveHours: elements.reminderControls[2].checked,
    reminderOneHour: elements.reminderControls[3].checked,
    email: elements.reminderEmail.value.trim(),
    notificationSound: elements.notificationSound.checked,
    soundVolume: Number(elements.soundVolume.value)
  };

  let settingsWarning = '';
  const hasReminders = reminderTypes.some((reminder) => settings[reminder.key]);
  if (settings.weeklySummaryEnabled || (settings.notificationsEnabled && hasReminders)) {
    if (!('Notification' in window)) {
      settingsWarning = 'Browser notifications are not supported here. Your preferences were saved, but reminders are unavailable.';
    } else if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          settingsWarning = 'Notification permission was not granted. Your preferences were saved; allow notifications in your browser settings to receive reminders.';
        }
      } catch (error) {
        settingsWarning = `Notification permission could not be requested: ${error.message}. Your preferences were saved.`;
      }
    } else if (Notification.permission === 'denied') {
      settingsWarning = 'Notifications are blocked by your browser. Your preferences were saved; allow them in browser settings to receive reminders.';
    }
  }

  await prepareReminderSound();
  if (!saveSettings()) {
    elements.notificationStatus.textContent = elements.errorMessage.textContent;
    return;
  }
  render();
  updateNotificationPermissionStatus();
  if (settingsWarning) {
    elements.notificationStatus.textContent = settingsWarning;
    return;
  }
  if (elements.notificationStatus.textContent) return;
  elements.notificationStatus.textContent = 'Notification settings saved on this device.';
  notify('Notification settings saved on this device.');
  checkReminders();
});

elements.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.settingsForm.reportValidity()) return;

  elements.settingsError.textContent = '';
  settings = {
    ...settings,
    theme: elements.backgroundTheme.value,
    weekStartsOn: elements.weekStartsOn.value,
    timeFormat: elements.timeFormat.value,
    density: elements.calendarDensity.value,
    highContrast: elements.highContrast.checked,
    reduceMotion: elements.reduceMotion.checked,
    defaultEventCategory: elements.defaultEventCategory.value,
    appOrder: settings.appOrder
  };
  applySettings();
  if (!saveSettings()) {
    elements.settingsError.textContent = elements.errorMessage.textContent;
    return;
  }
  render();
  if (elements.settingsError.textContent) return;
  closeSettings();
  notify('Settings saved on this device.');
  checkReminders();
});

elements.upcomingList.addEventListener('click', (event) => {
  const upcomingButton = event.target.closest('[data-select-date]');
  if (!upcomingButton) return;

  selectedDate = upcomingButton.dataset.selectDate;
  const date = fromDateKey(selectedDate);
  displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  render();
});

document.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-event]');
  if (editButton) {
    const selectedEvent = events.find((item) => item.id === editButton.dataset.editEvent);
    if (selectedEvent) openEventDialog(editButton.dataset.eventDate || selectedEvent.date, {
      ...selectedEvent,
      date: editButton.dataset.eventDate || selectedEvent.date
    });
    return;
  }

  const deleteButton = event.target.closest('[data-delete-event]');
  if (deleteButton) {
    const deletedEvent = events.find((item) => item.id === deleteButton.dataset.deleteEvent);
    if (!deletedEvent) return;
    try {
      await removeCalendarEvent(deletedEvent);
    } catch (error) {
      elements.errorMessage.textContent = `The event could not be deleted: ${error.message}`;
      return;
    }
    render();
    notify(`Deleted ${deletedEvent.title}.`);
  }
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;

  const title = elements.titleInput.value.trim();
  const date = elements.dateInput.value;
  if (!title || !date) {
    elements.formError.textContent = 'Add a name and a date for your event.';
    return;
  }

  const existingEvent = events.find((item) => item.id === editingEventId);
  const updatedEvent = {
    id: editingEventId ?? makeId(),
    title,
    date,
    time: elements.timeInput.value,
    category: elements.categoryInput.value,
    recurrence: elements.recurrenceInput.value,
    notes: elements.notesInput.value.trim()
  };
  const submitButton = elements.form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    await saveCalendarEvent(updatedEvent, existingEvent);
  } catch (error) {
    elements.formError.textContent = `The event could not be saved: ${error.message}`;
    submitButton.disabled = false;
    return;
  }
  submitButton.disabled = false;
  selectedDate = date;
  const selectedDateObject = fromDateKey(date);
  displayedMonth = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth(), 1);
  closeEventDialog();
  render();
  notify(existingEvent ? `Updated ${title}.` : `Added ${title}.`);
});

elements.deleteButton.addEventListener('click', async () => {
  const deletedEvent = events.find((item) => item.id === editingEventId);
  if (!deletedEvent) return;

  elements.deleteButton.disabled = true;
  try {
    await removeCalendarEvent(deletedEvent);
  } catch (error) {
    elements.formError.textContent = `The event could not be deleted: ${error.message}`;
    elements.deleteButton.disabled = false;
    return;
  }
  elements.deleteButton.disabled = false;
  selectedDate = deletedEvent.date;
  closeEventDialog();
  render();
  notify(`Deleted ${deletedEvent.title}.`);
});

elements.eventSearchInput.addEventListener('input', render);
elements.eventCategoryFilter.addEventListener('change', render);

render();
applySettings();
populateSettingsForm();
populateNotificationForm();
updateCalendarControls();
updateHomeClock();
window.setInterval(updateHomeClock, 60 * 1000);
updateChristmasCountdown();
window.setInterval(updateChristmasCountdown, 1000);
checkReminders();
restoreAppUpdateNotice();
void checkForAppUpdate();
void syncGlobalTheme();
void syncGlobalAnnouncement();
void loadSeasonalInfo();
window.setInterval(() => { void loadSeasonalInfo(); }, 60 * 1000);
window.setInterval(() => { void syncGlobalAnnouncement(); }, 30 * 1000);
window.setInterval(checkReminders, 30 * 1000);
window.setInterval(checkForAppUpdate, 30 * 1000);
const savedSessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
if (savedSessionToken) {
  apiRequest('/auth/me')
    .then(({ user }) => {
      currentUser = user;
      currentProfile = user;
      renderProfile();
      applySettings();
      updateCalendarControls();
      render();
      if (activePage === 'emojis' || activePage === 'profile') void loadEmojiCollection();
      void syncOnlineUsers();
      void syncChatMessages(true);
      void pollAccountWarnings();
      if (user.is_admin) void refreshAdminPanel();
      if (!elements.questsPanel.hidden) void loadSideQuests();
    })
    .catch((error) => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      elements.calendarStatus.textContent = `Your saved sign-in could not be restored: ${error.message}`;
    });
}
window.setInterval(() => {
  void syncGlobalTheme();
  if (calendarMode === 'community') void syncCommunityEvents();
  if (currentUser) void syncOnlineUsers();
  if (currentUser) void pollAccountWarnings();
  if (activePage === 'admin' && currentProfile?.is_admin) void refreshAdminPanel();
}, 5000);
window.setInterval(() => {
  if (currentUser) void syncChatMessages();
}, 4000);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(import.meta.url, { type: 'module' }).catch((error) => {
    elements.errorMessage.textContent = `Offline app support could not be enabled: ${error.message}`;
  });
}


}
