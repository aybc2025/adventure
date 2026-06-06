export const ROUTES = {
  // Public
  LANDING: '/',

  // Player
  PLAY_HOME: '/play',
  HERO_CREATE: '/play/hero/create',
  HERO_PROFILE: '/play/hero',
  ADVENTURE_SELECT: '/play/adventures',
  ROOM_VIEW: '/play/room/:sessionId',
  LEVEL_UP: '/play/level-up/:sessionId',
  GAME_OVER: '/play/game-over/:sessionId',
  PLAYER_HISTORY: '/play/history',

  // GM
  GM_DASHBOARD: '/gm',
  GM_TEMPLATES: '/gm/templates',
  GM_TEMPLATE_EDIT: '/gm/templates/:id',
  GM_TEMPLATE_NEW: '/gm/templates/new',
  GM_ITEMS: '/gm/items',
  GM_ITEM_EDIT: '/gm/items/:id',
  GM_ITEM_NEW: '/gm/items/new',
  GM_ADVENTURES: '/gm/adventures',
  GM_ADVENTURE_EDIT: '/gm/adventures/:id',
  GM_ADVENTURE_NEW: '/gm/adventures/new',
  GM_ROOM_EDIT: '/gm/adventures/:advId/rooms/:roomId',
  GM_ROOM_NEW: '/gm/adventures/:advId/rooms/new',
  GM_HISTORY: '/gm/history',
  GM_IMPORT: '/gm/import'
};

// Route builders for parameterized paths
export const buildRoute = {
  roomView: (sessionId) => `/play/room/${sessionId}`,
  levelUp: (sessionId) => `/play/level-up/${sessionId}`,
  gameOver: (sessionId) => `/play/game-over/${sessionId}`,
  gmTemplateEdit: (id) => `/gm/templates/${id}`,
  gmItemEdit: (id) => `/gm/items/${id}`,
  gmAdventureEdit: (id) => `/gm/adventures/${id}`,
  gmRoomEdit: (advId, roomId) => `/gm/adventures/${advId}/rooms/${roomId}`,
  gmRoomNew: (advId) => `/gm/adventures/${advId}/rooms/new`
};
