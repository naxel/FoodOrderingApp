const tintColorLight = '#EA580C';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    muted: '#6E6E73',
    placeholder: '#8E8E93',
    inputBackground: '#FFFFFF',
    border: '#E5E5EA',
    error: '#D93025',
    authBackground: 'linear-gradient(180deg, #FFE3C2 0%, #FFF6EC 40%, #FFFFFF 100%)',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    muted: '#98989F',
    placeholder: '#8E8E93',
    inputBackground: '#1C1C1E',
    border: '#2C2C2E',
    error: '#FF6B6B',
    authBackground: 'linear-gradient(180deg, #3D2611 0%, #1A110A 40%, #000000 100%)',
  },
};
