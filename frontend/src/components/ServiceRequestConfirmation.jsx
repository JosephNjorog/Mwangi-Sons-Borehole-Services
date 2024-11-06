import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardCopy, Calendar, MapPin, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ServiceRequestConfirmation = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await fetch(`/api/v1/service-requests/${requestId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch request details');
        }

        setRequestData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handleCopyRequestId = () => {
    navigator.clipboard.writeText(requestId);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/v1/service-requests/${requestId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service-request-${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF');
    }
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
                onClick={() => navigate('/service-requests/new')}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl font-bold text-green-800">
            Service Request Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request ID Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="text-lg font-mono">{requestId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRequestId}
                className="flex items-center gap-2"
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy ID
              </Button>
            </div>
          </div>

          {/* Request Details */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2}>Request Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Service Type</TableCell>
                <TableCell>{requestData?.serviceType}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Location</TableCell>
                <TableCell className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {requestData?.location}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Preferred Date</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {new Date(requestData?.preferredDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Estimated Budget</TableCell>
                <TableCell>${requestData?.budget.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Next Steps */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Our team will review your request within 24 hours</li>
              <li>You will receive an email confirmation with detailed pricing</li>
              <li>A site visit will be scheduled for assessment</li>
              <li>Final quotation will be provided after site assessment</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            onClick={() => navigate('/service-requests')}
            className="flex items-center gap-2"
          >
            View All Requests
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ServiceRequestConfirmation;