import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Droplet, 
  Clock, 
  AlertCircle,
  CheckCircle, 
  BarChart 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeRequests, setActiveRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    completedRequests: 0,
    pendingPayments: 0
  });

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-2 text-gray-600">Monitor your borehole service requests and manage payments.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Button
          onClick={() => navigate('/service-requests/new')}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-4"
        >
          <Settings className="w-5 h-5" />
          <span>New Service Request</span>
        </Button>

        <Button
          onClick={() => navigate('/payments')}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white p-4"
        >
          <Droplet className="w-5 h-5" />
          <span>View Pending Payments</span>
        </Button>

        <Button
          onClick={() => navigate('/history')}
          className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white p-4"
        >
          <Clock className="w-5 h-5" />
          <span>Service History</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              <span>Total Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.completedRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span>Pending Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Requests</h2>
        <div className="space-y-4">
          {activeRequests.length > 0 ? (
            activeRequests.map((request) => (
              <Card key={request._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h3 className="font-medium">Service Request #{request.requestNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {request.location.address.street}, {request.location.address.city}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={request.status} />
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/service-requests/${request._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert>
              <AlertDescription>
                No active service requests. Create a new request to get started.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;