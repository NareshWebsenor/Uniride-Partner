import { IMAGES } from '@/assets';

export { ASYNC_KEYS } from '@/constants/storage';

export const COMMON_KEYS = Object.freeze({
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  APP_NAME: 'GlimpZik',
  PRESS_ID: 'PRESS_ID',
  CURRENCY: '$',
});

export const languageList = [
  { name: 'Arabic', code: 'ar', flag: IMAGES.logoWithoutName },
  { name: 'Spanish', code: 'es', flag: IMAGES.logoWithoutName },
  { name: 'French', code: 'fr', flag: IMAGES.logoWithoutName },
  { name: 'Hindi', code: 'hi', flag: IMAGES.logoWithoutName },
  { name: 'Korean', code: 'ko', flag: IMAGES.logoWithoutName },
  { name: 'Vietnamese', code: 'vi', flag: IMAGES.logoWithoutName },
  { name: 'English', code: 'en', flag: IMAGES.logoWithoutName },
  { name: 'German', code: 'de', flag: IMAGES.logoWithoutName },
  { name: 'Italian', code: 'it', flag: IMAGES.logoWithoutName },
  { name: 'Japanese', code: 'ja', flag: IMAGES.logoWithoutName },
  { name: 'Chinese', code: 'zh', flag: IMAGES.logoWithoutName },
  { name: 'Russian', code: 'ru', flag: IMAGES.logoWithoutName },
];

export const DURATION_OPTIONS = ['Daily', 'Weekly', 'Monthly'];

export const DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Pre-calculated time in 30 minutes interval
export const TIME_OPTIONS = (() => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour === 0 || hour === 12 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const m = minute === 0 ? '00' : '30';
      options.push(`${h}:${m} ${ampm}`);
    }
  }
  return options;
})();

// Pre-calculated date from 1 to 30
export const DATE_OPTIONS = Array.from({ length: 30 }, (_, i) =>
  (i + 1).toString(),
);


export const quickActionsData = [
  {
    id: 1,
    title: 'wallet.add_money',
    subtitle: 'home.add_money_subtitle',
    icon: 'add',
    iconType: 'Ionicons',
    route: 'AddMoneyInitial',
    iconBg: 'secondary', // Black
    iconColor: 'white',
  },
  {
    id: 2,
    title: 'wallet.withdraw',
    subtitle: 'home.withdraw_subtitle',
    icon: 'arrow-up-right',
    iconType: 'Feather',
    route: 'Withdraw',
    iconBg: 'white',
    iconColor: 'secondary', // Black
  },
  {
    id: 3,
    title: 'tabs.invest',
    subtitle: 'home.invest_subtitle',
    icon: 'shopping-bag',
    iconType: 'Feather',
    route: 'Invest',
    isSpecial: true,
    iconBg: 'white',
    iconColor: 'secondary',
  },
];

export const recentActivityData = [
  {
    id: 1,
    type: 'BOUGHT',
    title: 'home.bought_gold',
    subtitle: '0.320 g • Live price',
    amount: '₹ 1,984',
    time: 'Today • 10:42 AM',
    icon: 'cart-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 2,
    type: 'INTEREST',
    title: 'home.interest_credited',
    subtitle: 'home.weekly_earnings',
    amount: '+ ₹ 46.60',
    time: 'Mon • 9:00 AM',
    icon: 'cash-outline',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    id: 3,
    type: 'ADDED',
    title: 'home.added_money',
    subtitle: 'UPI • HDFC Bank',
    amount: '₹ 5,000',
    time: 'Sat • 6:18 PM',
    icon: 'arrow-down-outline',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
  },
];
