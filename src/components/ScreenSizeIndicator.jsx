import { useWindowSize } from '../hooks/useWindowSize';

export const ScreenSizeIndicator = () => {
  const { width, isMobile, isTablet, isDesktop } = useWindowSize();

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
    }}>
      {width}px | {isMobile && '📱 모바일'} {isTablet && '📱 태블릿'} {isDesktop && '💻 PC'}
    </div>
  );
};
