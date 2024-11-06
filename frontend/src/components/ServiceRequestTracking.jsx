import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Timer,
  MessagesSquare,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const statusConfig = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    progress: 20
  },
  APPROVED: {
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    progress: 40
  },
  IN_PROGRESS: {
    color: 'bg-purple-100 text-purple-800',
    icon: Timer,
    progress: 60
  },
  COMPLETED: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    progress: 100
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
    progress: 0
  }
};

const ServiceRequestTracking = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/v1/service-requests');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests');
      }

      setRequests(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (requestId) => {
    try {
      const response = await fetch(`/api/v1/service-requests/${requestId}/messages`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }

      setMessages(data.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleRequestSelect = (request) => {
    setSelectedRequest(request);
    fetchMessages(request.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      const response = await fetch(`/api/v1/service-requests/${selectedRequest.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      fetchMessages(selectedRequest.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const RequestCard = ({ request }) => {
    const status = statusConfig[request.status];
    const StatusIcon = status.icon;

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {request.serviceType} - {request.location}
              </h3>
              <p className="text-sm text-gray-500">
                Request ID: {request.id}
              </p>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {request.status.replace('_', ' ')}
            </Badge>
          </div>

          <Progress value={status.progress} className="mb-4" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Submitted: {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Documents: {request.documents?.length || 0}
              </span>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="timeline">
              <AccordionTrigger>View Timeline</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {request.timeline?.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => handleRequestSelect(request)}
              className="flex items-center gap-2"
            >
              <MessagesSquare className="h-4 w-4" />
              Communication
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchRequests}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Service Requests</h2>
        <Button onClick={() => navigate('/service-requests/new')}>
          New Request
        </Button>