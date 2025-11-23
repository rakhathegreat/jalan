import { memo } from 'react';
import { Leaf } from 'lucide-react';

type WelcomeHeaderProps = {
  firstName: string;
  points: number;
};

const WelcomeHeader = memo(({ firstName, points }: WelcomeHeaderProps) => (
  <section className="px-4">
    <div className="flex items-center justify-between">
      <span className="text-xl font-semibold text-brand-700">Welcome, {firstName} !</span>
      <div className="flex gap-4">
        <div className="items-center flex">
          <div className="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-gray-300">
            <Leaf strokeWidth={2.5} className="text-brand-500 w-4 h-4" />
            <span className="text-sm text-brand-700 font-semibold">{points}</span>
          </div>
        </div>
        {/* <div className="rounded-full h-10 w-10 bg-gray-500 ring-2 ring-brand-600" aria-hidden /> */}
      </div>
    </div>
  </section>
));

WelcomeHeader.displayName = 'WelcomeHeader';

export default WelcomeHeader;
