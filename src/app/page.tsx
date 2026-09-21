import MobileHomeView from '@/components/landing/MobileHomeView';
import DesktopHomeView from '@/components/landing/DesktopHomeView';

export default function Home() {
  return (
    <>
      {/* Mobile Home View */}
      <div className="block md:hidden">
        <MobileHomeView />
      </div>

      {/* Desktop Home View — same structure as mobile, proper desktop layout */}
      <DesktopHomeView />
    </>
  );
}
