import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import StudyPlanTab from '@/components/features/StudyPlanTab';
import GPACalculatorTab from '@/components/features/GPACalculatorTab';
import MaterialsExamsTab from '@/components/features/MaterialsExamsTab';
import AdminTab from '@/pages/AdminPage';

type Tab = 'plan' | 'resources' | 'gpa' | 'admin';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const tabs = [
    { id: 'plan'      as Tab, label: t('studyPlan'),                                      icon: '📚' },
    { id: 'resources' as Tab, label: lang === 'ar' ? 'المواد والأسئلة' : 'Resources',    icon: '🗂️' },
    { id: 'gpa'       as Tab, label: t('gpaCalc'),                                        icon: '📊' },
    ...(user?.isAdmin ? [{ id: 'admin' as Tab, label: t('adminPanel'), icon: '👑' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Welcome bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            {t('welcome')},{' '}
            <span className="font-bold text-green-800">{user?.fullName}</span>
            {' — '}
            <span className="text-gray-400">{t('studentId')}: {user?.universityId}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-6xl mx-auto flex gap-2 py-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeTab === 'plan'      && <StudyPlanTab />}
        {activeTab === 'resources' && <MaterialsExamsTab />}
        {activeTab === 'gpa'       && <GPACalculatorTab />}
        {activeTab === 'admin'     && user?.isAdmin && <AdminTab />}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        {t('copyright')}
      </footer>
    </div>
  );
}
