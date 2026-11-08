import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TaskCard } from '@/components/shared/TaskCard';
import { Search, Filter, Users, Zap, SlidersHorizontal, RefreshCcw } from 'lucide-react';

interface TasksPageProps {
  searchParams?: {
    search?: string;
    taskModel?: string;
    category?: string;
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const search = searchParams?.search || '';
  const taskModel = searchParams?.taskModel || '';

  const { data: tasks } = await api.getTasks({
    search,
    taskModel,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Open Task Marketplace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse high-capacity campaigns and competitive bounties. Zero gatekeeping — claim any open slot.
          </p>
        </div>

        <Link
          href="/buyer/tasks/new"
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors self-start md:self-auto"
        >
          Post a Campaign
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-4 shadow-sm space-y-4">
        <form method="GET" action="/tasks" className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Filter by title, keywords or requirements..."
              className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white text-xs pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              name="taskModel"
              defaultValue={taskModel}
              className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-teal-500"
            >
              <option value="">All Execution Models</option>
              <option value="MULTI_WORKER">Multi-Worker (Collaborative)</option>
              <option value="FIRST_APPROVED">First-Approved (Bounty)</option>
            </select>

            <button
              type="submit"
              className="bg-navy-900 hover:bg-navy-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </button>

            {(search || taskModel) && (
              <Link
                href="/tasks"
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-2.5 flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" /> Clear
              </Link>
            )}
          </div>
        </form>

        {/* Quick Model Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-navy-800/80 text-xs">
          <span className="text-slate-400 font-medium">Quick Filter:</span>
          <Link
            href="/tasks"
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              !taskModel
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Tasks
          </Link>
          <Link
            href="/tasks?taskModel=MULTI_WORKER"
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              taskModel === 'MULTI_WORKER'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3 h-3" /> Multi-Worker
          </Link>
          <Link
            href="/tasks?taskModel=FIRST_APPROVED"
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              taskModel === 'FIRST_APPROVED'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" /> First-Approved Bounty
          </Link>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing {tasks.length} active marketplace campaign(s)
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-12 text-center space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">No tasks match your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or resetting execution model filters.
            </p>
            <Link
              href="/tasks"
              className="inline-block bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
