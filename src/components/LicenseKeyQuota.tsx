import { Card } from '@/components/ui/card';

interface LicenseKeyQuotaProps {
  maxLicenseKeys?: number;
  currentLicenseKeyCount?: number;
  maxTotalActivations?: number;
  currentTotalActivations?: number;
}

export const LicenseKeyQuota = ({
  maxLicenseKeys,
  currentLicenseKeyCount = 0,
  maxTotalActivations,
  currentTotalActivations = 0,
}: LicenseKeyQuotaProps) => {
  // Calculate remaining quotas
  const remainingKeys = maxLicenseKeys !== undefined ? maxLicenseKeys - currentLicenseKeyCount : Infinity;
  const remainingActivations = maxTotalActivations !== undefined ? maxTotalActivations - currentTotalActivations : Infinity;

  // Calculate percentages
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

  return (
    <Card className="p-6 bg-gradient-to-br from-[#854AE6]/5 to-[#854AE6]/10 border-[#854AE6]/20">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        License Key Quota
      </h3>

      <div className="space-y-4">
        {/* License Keys Quota */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">License Keys</span>
            <span className="text-sm font-semibold text-gray-900">
              {maxLicenseKeys !== undefined ? (
                <>
                  {currentLicenseKeyCount} / {maxLicenseKeys}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    keysColor === 'red' ? 'bg-red-100 text-red-700' :
                    keysColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {remainingKeys} left
                  </span>
                </>
              ) : (
                <span className="text-blue-600">Unlimited</span>
              )}
            </span>
          </div>
          {maxLicenseKeys !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  keysColor === 'red' ? 'bg-red-600' :
                  keysColor === 'yellow' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(keysPercentage, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Total Activations Quota */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Total Activations</span>
            <span className="text-sm font-semibold text-gray-900">
              {maxTotalActivations !== undefined ? (
                <>
                  {currentTotalActivations} / {maxTotalActivations}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    activationsColor === 'red' ? 'bg-red-100 text-red-700' :
                    activationsColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {remainingActivations} left
                  </span>
                </>
              ) : (
                <span className="text-blue-600">Unlimited</span>
              )}
            </span>
          </div>
          {maxTotalActivations !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  activationsColor === 'red' ? 'bg-red-600' :
                  activationsColor === 'yellow' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(activationsPercentage, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Warnings */}
        {(keysPercentage >= 75 || activationsPercentage >= 75) && (
          <div className={`mt-3 p-3 rounded-lg ${
            keysPercentage >= 100 || activationsPercentage >= 100
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm font-medium flex items-center gap-2 ${
              keysPercentage >= 100 || activationsPercentage >= 100
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {keysPercentage >= 100 || activationsPercentage >= 100 ? (
                'You have reached your quota limit. Contact admin to increase your limits.'
              ) : (
                'You are approaching your quota limit.'
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
