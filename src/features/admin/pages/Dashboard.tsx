import { SectionCards } from './dashboard/components/SectionCards';
import { ChartAreaInteractive } from './dashboard/components/SectionChart';
import { DataTable } from '@/components/data-table';
import { useDashboardData } from './dashboard/hooks/useDashboardData';

const Dashboard = () => (
  <DashboardContent />
);

const DashboardContent = () => {
  const { metrics, chartData, reports, loading, error, markReportDone, markingId } =
    useDashboardData();

  return (
    <div className="flex flex-col gap-4 px-6 py-4 md:gap-6 md:py-6">
      <SectionCards metrics={metrics} loading={loading} />
      <ChartAreaInteractive data={chartData} loading={loading} />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <DataTable data={reports} loading={loading} onMarkDone={markReportDone} markingId={markingId} />
    </div>
  );
};

export default Dashboard;
