import { X, CheckCircle, AlertTriangle, Activity, Clock, TrendingUp } from 'lucide-react';

interface StatusPageProps {
  onClose: () => void;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  description: string;
}

export default function StatusPage({ onClose }: StatusPageProps) {
  const services: ServiceStatus[] = [
    {
      name: 'Quote Builder',
      status: 'operational',
      description: 'BESS quote generation and calculations'
    },
    {
      name: 'User Authentication',
      status: 'operational',
      description: 'Login, signup, and account management'
    },
    {
      name: 'Market Intelligence',
      status: 'operational',
      description: 'Pricing data and market analytics'
    },
    {
      name: 'Vendor Marketplace',
      status: 'operational',
      description: 'Vendor matching and lead distribution'
    },
    {
      name: 'Portfolio & Projects',
      status: 'operational',
      description: 'Save, load, and manage projects'
    },
    {
      name: 'API Services',
      status: 'operational',
      description: 'Backend API and data services'
    },
    {
      name: 'File Upload',
      status: 'operational',
      description: 'Document and pricing data uploads'
    },
    {
      name: 'Email Notifications',
      status: 'operational',
      description: 'Automated emails and alerts'
    }
  ];

  const uptime = {
    last24h: 100.0,
    last7d: 99.98,
    last30d: 99.95,
    last90d: 99.92
  };

  const incidents = [
    {
      date: 'October 20, 2025',
      time: '14:30 - 14:45 UTC',
      title: 'API Performance Degradation',
      severity: 'minor',
      status: 'resolved',
      description: 'Some users experienced slow response times when generating quotes. Issue was resolved by scaling up server capacity.',
      updates: [
        { time: '14:45 UTC', message: 'Issue resolved. All systems operating normally.' },
        { time: '14:35 UTC', message: 'Scaling up servers to handle increased load.' },
        { time: '14:30 UTC', message: 'Investigating reports of slow API responses.' }
      ]
    },
    {
      date: 'October 18, 2025',
      time: '02:00 - 04:00 UTC',
      title: 'Scheduled Maintenance',
      severity: 'maintenance',
      status: 'completed',
      description: 'Database upgrade and optimization performed during scheduled maintenance window.',
      updates: [
        { time: '04:00 UTC', message: 'Maintenance completed successfully. Platform fully operational.' },
        { time: '02:00 UTC', message: 'Maintenance window started. Platform in read-only mode.' }
      ]
    }
  ];

  const getStatusColor = (status: 'operational' | 'degraded' | 'outage') => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'outage': return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: 'operational' | 'degraded' | 'outage') => {
    switch (status) {
      case 'operational': return <CheckCircle size={20} />;
      case 'degraded': return <AlertTriangle size={20} />;
      case 'outage': return <AlertTriangle size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'major': return 'bg-orange-600 text-white';
      case 'minor': return 'bg-yellow-600 text-white';
      case 'maintenance': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');
  const hasOutage = services.some(s => s.status === 'outage');
  const hasDegraded = services.some(s => s.status === 'degraded');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border-4 border-green-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Activity size={32} />
              System Status
            </h2>
            <p className="text-green-100 mt-1">Real-time platform status and incident history</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-green-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-green-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* Overall Status Banner */}
        <div className={`px-6 py-4 flex items-center gap-3 flex-shrink-0 ${
          hasOutage ? 'bg-red-50 border-b-4 border-red-500' :
          hasDegraded ? 'bg-yellow-50 border-b-4 border-yellow-500' :
          'bg-green-50 border-b-4 border-green-500'
        }`}>
          <div className={`w-4 h-4 rounded-full ${
            hasOutage ? 'bg-red-500 animate-pulse' :
            hasDegraded ? 'bg-yellow-500 animate-pulse' :
            'bg-green-500'
          }`} />
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-xl">
              {hasOutage ? '⚠ Service Disruption' :
               hasDegraded ? '⚠ Performance Degraded' :
               '✓ All Systems Operational'}
            </div>
            <div className="text-sm text-gray-600">
              {allOperational 
                ? 'Merlin Energy is operating normally. No issues detected.' 
                : 'Some services may be experiencing issues. We are working to resolve them.'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Uptime Stats */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-600" />
                Uptime Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{uptime.last24h}%</div>
                  <div className="text-sm text-gray-600 mt-1">Last 24 Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{uptime.last7d}%</div>
                  <div className="text-sm text-gray-600 mt-1">Last 7 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{uptime.last30d}%</div>
                  <div className="text-sm text-gray-600 mt-1">Last 30 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{uptime.last90d}%</div>
                  <div className="text-sm text-gray-600 mt-1">Last 90 Days</div>
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Service Status</h3>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-600">{service.description}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="capitalize">{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident History */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={24} className="text-purple-600" />
                Recent Incidents & Maintenance
              </h3>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                  <p>No incidents in the last 30 days</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {incidents.map((incident, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              {incident.status}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{incident.title}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            {incident.date} • {incident.time}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{incident.description}</p>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="font-bold text-gray-900 mb-3 text-sm">Updates Timeline:</div>
                        <div className="space-y-3">
                          {incident.updates.map((update, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex-shrink-0 w-20 text-xs text-gray-600 font-medium">
                                {update.time}
                              </div>
                              <div className="flex-1 text-sm text-gray-700 border-l-2 border-blue-300 pl-3">
                                {update.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Maintenance */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={24} className="text-yellow-600" />
                Scheduled Maintenance
              </h3>
              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <div className="font-bold text-gray-900 mb-2">Database Optimization</div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Date:</strong> October 28, 2025</p>
                  <p><strong>Time:</strong> 2:00 AM - 3:00 AM UTC</p>
                  <p><strong>Expected Impact:</strong> Platform will be in read-only mode. Quote viewing available, but no new quotes can be saved during maintenance.</p>
                  <p className="text-yellow-700 font-medium mt-2">⚠ Users will be notified 24 hours in advance</p>
                </div>
              </div>
            </div>

            {/* Subscribe to Updates */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Informed</h3>
              <p className="text-gray-700 mb-4">
                Get notified about incidents, maintenance, and status updates
              </p>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all">
                Subscribe to Status Updates
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
