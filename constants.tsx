import React from 'react';

// Authentic color palette
export const COLORS = {
  WIN_GRAY: '#c0c0c0',
  WIN_BLUE: '#000080',
  ICQ_GREEN: '#008000',
  ICQ_RED: '#FF0000',
  ICQ_ORANGE: '#FFA500',
  WHITE: '#ffffff',
  BLACK: '#000000'
};

export const FLOWER_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C13.1 2 14 2.9 14 4V9.17C14.83 8.64 15.93 8.64 16.76 9.17L21.09 6.67C22.04 6.12 23.26 6.45 23.81 7.4C24.36 8.35 24.03 9.57 23.08 10.12L18.75 12.62C18.75 13.6 18.75 14.58 18.75 15.56L23.08 18.06C24.03 18.61 24.36 19.83 23.81 20.78C23.26 21.73 22.04 22.06 21.09 21.51L16.76 19.01C15.93 19.54 14.83 19.54 14 19.01V24.18C14 25.28 13.1 26.18 12 26.18C10.9 26.18 10 25.28 10 24.18V19.01C9.17 19.54 8.07 19.54 7.24 19.01L2.91 21.51C1.96 22.06 0.74 21.73 0.19 20.78C-0.36 19.83 -0.03 18.61 0.92 18.06L5.25 15.56C5.25 14.58 5.25 13.6 5.25 12.62L0.92 10.12C-0.03 9.57 -0.36 8.35 0.19 7.4C0.74 6.45 1.96 6.12 2.91 6.67L7.24 9.17C8.07 8.64 9.17 8.64 10 9.17V4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
  </svg>
);

export const STATUS_ICONS = {
  ONLINE: (
    <div className="text-green-700 drop-shadow-md">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
         <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="1" fill="#00FF00" />
       </svg>
    </div>
  ),
  AWAY: (
    <div className="text-yellow-600 drop-shadow-md">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
         <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="1" fill="#FFA500" />
         <rect x="7" y="11" width="10" height="2" fill="black" />
       </svg>
    </div>
  ),
  OFFLINE: (
    <div className="text-red-700 drop-shadow-md">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
         <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="1" fill="#FF0000" />
         <path d="M8 8L16 16M16 8L8 16" stroke="black" strokeWidth="3" />
       </svg>
    </div>
  ),
  BOT: (
    <div className="text-blue-700 drop-shadow-md">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
         <rect x="4" y="4" width="16" height="16" stroke="black" strokeWidth="1" fill="#00FFFF" />
         <circle cx="9" cy="9" r="2" fill="black" />
         <circle cx="15" cy="9" r="2" fill="black" />
         <rect x="8" y="15" width="8" height="2" fill="black" />
       </svg>
    </div>
  )
};

export const SOUND_ICON = (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);
