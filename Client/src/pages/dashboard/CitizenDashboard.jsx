import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import apiService from '../../services/api';
import { AlertTriangle, Shield, BookOpen, Activity } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CitizenDashboard = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [safetyGuides, setSafetyGuides] = useState([]);
  const [loading, setLoading] = useState({
    alerts: true,
    incidents: true,
    guides: true,
  });
  const [error, setError] = useState({
    alerts: null,
    incidents: null,
    guides: null,
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active alerts
        const alerts = await apiService.getPublicActiveAlerts();
        setActiveAlerts(alerts.results || []);
      } catch (err) {
        setError(prev => ({ ...prev, alerts: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, alerts: false }));
      }

      try {
        // Fetch citizen's incident reports
        const incidents = await apiService.getMyIncidentReports();
        setIncidentReports(incidents.results || []);
      } catch (err) {
        setError(prev => ({ ...prev, incidents: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, incidents: false }));
      }

      try {
        // Fetch public safety guides (with fallback)
        const guides = await apiService.getPublicSafetyTips().catch(() => ({ results: [] }));
        // Process the guides data to match the structure in PublicSafetyGuides
        const processedGuides = Array.isArray(guides.results) ? guides.results : [];
        setSafetyGuides(processedGuides);
      } catch (err) {
        setError(prev => ({ ...prev, guides: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, guides: false }));
      }
    };

    fetchData();
  }, []);

  // Prepare data for charts
  const alertTypes = [...new Set(activeAlerts.map(alert => alert.alert_type))];
  const alertCounts = alertTypes.map(type =>
    activeAlerts.filter(alert => alert.alert_type === type).length
  );

  const incidentDates = [...new Set(incidentReports.map(incident => new Date(incident.created_at).toLocaleDateString()))];
  const incidentCounts = incidentDates.map(date =>
    incidentReports.filter(incident => new Date(incident.created_at).toLocaleDateString() === date).length
  );

  // Process safety guides data for the pie chart
  const guideCategories = safetyGuides.length > 0
    ? [...new Set(safetyGuides.map(guide => guide.category || 'Uncategorized'))]
    : ['No Data'];
  const guideCounts = guideCategories.map(category =>
    safetyGuides.filter(guide => (guide.category || 'Uncategorized') === category).length
  );

  // Chart data
  const activeAlertsData = {
    labels: alertTypes.length > 0 ? alertTypes : ['No Data'],
    datasets: [
      {
        label: 'Active Alerts by Type',
        data: alertTypes.length > 0 ? alertCounts : [1],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const incidentReportsData = {
    labels: incidentDates.length > 0 ? incidentDates : ['No Data'],
    datasets: [
      {
        label: 'Incident Reports Over Time',
        data: incidentDates.length > 0 ? incidentCounts : [1],
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1,
      },
    ],
  };

  const safetyGuidesData = {
    labels: guideCategories,
    datasets: [
      {
        label: 'Safety Guides by Category',
        data: guideCounts.length > 0 ? guideCounts : [1],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, font: { size: 16 } },
    },
  };

  // Helper function to render a chart or fallback
  const renderChart = (Component, data, title, icon, loadingKey, errorKey) => {
    if (loading[loadingKey]) return <div className="p-4 text-center">Loading {title}...</div>;
    if (error[errorKey]) return <div className="p-4 text-center text-red-500">Error loading {title}: {error[errorKey]}</div>;
    return <Component data={data} options={chartOptions} />;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Shield className="mr-2 text-red-500" /> Citizen Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Alerts Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-red-500" /> Active Alerts
          </h2>
          {renderChart(Bar, activeAlertsData, 'Active Alerts', AlertTriangle, 'alerts', 'alerts')}
        </div>

        {/* Incident Reports Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 text-blue-500" /> Incident Reports
          </h2>
          {renderChart(Line, incidentReportsData, 'Incident Reports', Activity, 'incidents', 'incidents')}
        </div>

        {/* Safety Guides Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2 text-green-500" /> Safety Guides
          </h2>
          {renderChart(Pie, safetyGuidesData, 'Safety Guides', BookOpen, 'guides', 'guides')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <AlertTriangle className="text-red-500" />
          </div>
          <div>
            <p className="text-gray-500">Active Alerts</p>
            <p className="text-2xl font-bold">
              {loading.alerts ? '...' : error.alerts ? 'Error' : activeAlerts.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Activity className="text-blue-500" />
          </div>
          <div>
            <p className="text-gray-500">Your Reports</p>
            <p className="text-2xl font-bold">
              {loading.incidents ? '...' : error.incidents ? 'Error' : incidentReports.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <BookOpen className="text-green-500" />
          </div>
          <div>
            <p className="text-gray-500">Safety Guides</p>
            <p className="text-2xl font-bold">
              {loading.guides ? '...' : error.guides ? 'Error' : safetyGuides.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
