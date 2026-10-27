// ছোট stroke icon set। সব icon এ একই stroke স্টাইল, তাই UI এ মিল থাকে
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const make = (children) => function Icon({ size, className }) {
  return <svg {...base} width={size} height={size} className={className}>{children}</svg>;
};

export const IconBox = make(<><path d="m3.5 7.5 8.5-4 8.5 4-8.5 4-8.5-4Z" /><path d="M3.5 7.5V17l8.5 4 8.5-4V7.5M12 11.5V21" /></>);
export const IconHome = make(<><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9h12v-9" /></>);
export const IconSend = make(<><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4 18-7Z" /></>);
export const IconSearch = make(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>);
export const IconWallet = make(<><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="3" y="7" width="18" height="13" rx="3" /><circle cx="16.5" cy="13.5" r="1.2" /></>);
export const IconUser = make(<><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></>);
export const IconUsers = make(<><circle cx="9" cy="8.5" r="3.3" /><path d="M2.8 19.5c.7-3.2 3.1-4.8 6.2-4.8s5.5 1.6 6.2 4.8" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M18.5 15.2c1.6.7 2.4 2.2 2.7 4.3" /></>);
export const IconList = make(<><path d="M8 6.5h12M8 12h12M8 17.5h12" /><circle cx="4" cy="6.5" r=".8" /><circle cx="4" cy="12" r=".8" /><circle cx="4" cy="17.5" r=".8" /></>);
export const IconCard = make(<><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M3 10h18M7 15h3" /></>);
export const IconGrid = make(<><rect x="4" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" /></>);
export const IconLogout = make(<><path d="M10 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H10" /><path d="m15 8 4 4-4 4M19 12H9.5" /></>);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconShield = make(<><path d="M12 3.5 5 6v5.5c0 4.4 2.8 7.6 7 9 4.2-1.4 7-4.6 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>);
export const IconVideo = make(<><rect x="3" y="6.5" width="12.5" height="11" rx="3" /><path d="m15.5 11 5.5-3v8l-5.5-3" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const IconPlane = make(<path d="M21 4 3 11l7 2.5L12.5 21 21 4ZM10 13.5 21 4" />);
export const IconPhone = make(<path d="M5.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L15 13l4 1.5v3a2 2 0 0 1-2 2A13.5 13.5 0 0 1 3.5 6a2 2 0 0 1 2-2Z" />);
export const IconAlert = make(<><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.2M12 17h.01" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>);
export const IconX = make(<path d="m6 6 12 12M18 6 6 18" />);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconRefresh = make(<><path d="M20 11a8 8 0 0 0-14.4-4.2L4 9" /><path d="M4 4v5h5M4 13a8 8 0 0 0 14.4 4.2L20 15" /><path d="M20 20v-5h-5" /></>);
export const IconChevron = make(<path d="m6 9 6 6 6-6" />);
export const IconCoins = make(<><ellipse cx="9" cy="7" rx="5.5" ry="2.8" /><path d="M3.5 7v5c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V7" /><path d="M14.5 10.5c3 0 6 .9 6 2.5v4c0 1.5-2.6 2.8-5.6 2.8-1.9 0-3.6-.5-4.6-1.3" /></>);
export const IconLock = make(<><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>);
