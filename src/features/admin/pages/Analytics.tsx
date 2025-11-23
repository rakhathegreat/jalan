import { useState } from 'react';
import { cn } from '@shared/lib/cn';

import OverviewTab from '../tabs/OverviewTab';

type ReportTab =
  | 'overview'
  | 'users'
  | 'trees'
  | 'scans'
  | 'geospatial'

const NAVBAR_HEIGHT = 70;

const tabOrder: ReportTab[] = [
  'overview',
  'users',
  'trees',
  'scans',
  'geospatial',
];

const renderTab = (tab: ReportTab) => {
  switch (tab) {
    case 'overview':
      return <OverviewTab />
    case 'users':
      return <OverviewTab />
    case 'trees':
      return <OverviewTab />
    case 'scans':
      return <OverviewTab />
    case 'geospatial':
      return <OverviewTab />
    default:
      return <></>
  }
}

const Analytics = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  return (
    <div className="bg-geist-50" style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
      <div className="relative mx-auto w-full space-y-6">
        <header className="m-0 border-b border-gray-300">
          <div className="mx-auto flex px-6 lg:px-0 max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 py-7 md:py-10">
              <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">Analytics Console</h1>
              <p className="text-sm text-gray-600">Inspect users, trees, scans, missions, fraud, geospatial, and ops.</p>
            </div>
          </div>
        </header>

        <section
          style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          className="sticky top-0 z-20"
        >
          <div className="grid h-full grid-cols-4 ">
            <div className="sticky col-span-4 top-16 z-20 bg-geist-50 sm:hidden">
              <div className="flex flex-nowrap overflow-x-auto border-b border-gray-300 no-scrollbar">
                {tabOrder.map((tabKey) => {
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={cn(
                        'flex flex-none items-center px-4 py-3 text-left text-sm capitalize font-medium whitespace-nowrap border-b-2 transition',
                        isActive
                          ? 'border-brand-600 text-brand-700'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      <span>{tabKey}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden sm:flex h-full flex-col overflow-y-auto border-r border-gray-300">

              <div className='border-b border-gray-300 px-8 py-4'>
                <h2 className="text-lg font-semibold text-gray-800">
                  Tabs
                </h2>
              </div>

              <div className=" overflow-y-auto px-4 py-3">
                {tabOrder.map((tabKey) => {
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={cn(
                        'flex w-full items-center rounded-md px-4 py-3 text-left transition capitalize font-medium',
                        isActive
                          ? 'border-brand-600 text-brand-700 bg-brand-100'
                          : 'border-transparent text-gray-500 hover:text-gray-800',
                      )}
                    >
                      <div className="space-y-1">
                        <p className="text-xs">{tabKey}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="col-span-4 sm:col-span-3 h-full sm:overflow-y-auto bg-geist-50 px-6 py-8">
              <div className="flex flex-wrap flex-col gap-4 pb-6">
                <div className=''>
                  <h2 className="text-2xl font-medium capitalize text-gray-900">{tabOrder.find(tab => tab === activeTab)}</h2>
                </div>
                <div>
                  {renderTab(activeTab)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
