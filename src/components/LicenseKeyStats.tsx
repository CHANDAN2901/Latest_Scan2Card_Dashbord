import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LicenseKeyStatsProps {
  maxLicenseKeys?: number;
  currentLicenseKeyCount?: number;
  maxTotalActivations?: number;
  currentTotalActivations?: number;
}

export const LicenseKeyStats = ({
  maxLicenseKeys,
  currentLicenseKeyCount = 0,
  maxTotalActivations,
  currentTotalActivations = 0,
}: LicenseKeyStatsProps) => {
  // Calculate remaining and percentages
  const remainingKeys = maxLicenseKeys !== undefined ? maxLicenseKeys - currentLicenseKeyCount : Infinity;
  const remainingActivations = maxTotalActivations !== undefined ? maxTotalActivations - currentTotalActivations : Infinity;

  const keysPercentage = maxLicenseKeys !== undefined ? (currentLicenseKeyCount / maxLicenseKeys) * 100 : 0;
  const activationsPercentage = maxTotalActivations !== undefined ? (currentTotalActivations / maxTotalActivations) * 100 : 0;

  // Determine colors based on usage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const keysColor = getStatusColor(keysPercentage);
  const activationsColor = getStatusColor(activationsPercentage);

  // Calculate stats for display
  const stats = [
    {
      title: 'License Keys Created',
      current: currentLicenseKeyCount,
      max: maxLicenseKeys,
      remaining: remainingKeys,
      percentage: keysPercentage,
      color: keysColor,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      title: 'Total Activations Allocated',
      current: currentTotalActivations,
      max: maxTotalActivations,
      remaining: remainingActivations,
      percentage: activationsPercentage,
      color: activationsColor,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${
                stat.color === 'red' ? 'bg-red-100 text-red-600' :
                stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                {stat.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Main Stats */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.current}
                    {stat.max !== undefined && (
                      <span className="text-xl text-gray-500 ml-1">/ {stat.max}</span>
                    )}
                    {stat.max === undefined && (
                      <span className="text-xl text-blue-600 ml-2">∞</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {stat.max !== undefined ? (
                      <>
                        <span className={`font-semibold ${
                          stat.color === 'red' ? 'text-red-600' :
                          stat.color === 'yellow' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {stat.remaining}
                        </span> remaining
                      </>
                    ) : (
                      <span className="text-blue-600 font-medium">Unlimited</span>
                    )}
                  </div>
                </div>

                {stat.max !== undefined && (
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      stat.color === 'red' ? 'text-red-600' :
                      stat.color === 'yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {Math.round(stat.percentage)}%
                    </div>
                    <div className="text-xs text-gray-500">used</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {stat.max !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      stat.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      stat.color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  />
                </div>
              )}

              {/* Warning Badge */}
              {stat.percentage >= 75 && stat.percentage < 100 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-yellow-700 font-medium">Approaching limit</span>
                </div>
              )}

              {stat.percentage >= 100 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-red-700 font-medium">Limit reached - Contact admin</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
