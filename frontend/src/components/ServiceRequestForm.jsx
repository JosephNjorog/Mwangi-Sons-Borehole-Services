import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, AlertCircle, X, Image, FileText, File } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const ServiceRequestForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    serviceType: '',
    depth: '',
    location: '',
    preferredDate: '',
    additionalNotes: '',
    sitePhotos: [],
    documents: [],
    landOwnershipProof: null,
    budget: '',
    expectedDuration: '',
    propertySize: '',
    waterUsage: '',
    accessibilityDetails: ''
  });

  const [validation, setValidation] = useState({
    depth: true,
    budget: true,
    propertySize: true
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate numeric fields
    if (field === 'depth' || field === 'budget' || field === 'propertySize') {
      setValidation(prev => ({
        ...prev,
        [field]: !isNaN(value) && value > 0
      }));
    }
  };

  const handleFileUpload = useCallback((e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = {
      sitePhotos: ['image/jpeg', 'image/png', 'image/webp'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      landOwnershipProof: ['application/pdf']
    };

    const validFiles = files.filter(file => {
      const isValidType = validTypes[type].includes(file.type);
      const isValidSize = file.size <= maxSize;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped due to invalid type or size (max 5MB)');
    }

    if (type === 'landOwnershipProof') {
      setFormData(prev => ({
        ...prev,
        [type]: validFiles[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], ...validFiles]
      }));
    }
  }, []);

  const removeFile = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    return (
      formData.serviceType &&
      formData.depth &&
      formData.location &&
      formData.preferredDate &&
      formData.landOwnershipProof &&
      Object.values(validation).every(v => v)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(file => formDataToSend.append(key, file));
        } else if (value instanceof File) {
          formDataToSend.append(key, value);
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = await fetch('/api/v1/service-requests', {
        method: 'POST',
        body: formDataToSend,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create service request');
      }

      navigate(`/service-requests/${data.id}/confirmation`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">New Borehole Service Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => handleInputChange('serviceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRILLING">New Borehole Drilling</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance Service</SelectItem>
                    <SelectItem value="REPAIR">Repair Service</SelectItem>
                    <SelectItem value="CONSULTATION">Technical Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Depth */}
              <div className="space-y-2">
                <Label htmlFor="depth">Required Depth (meters) *</Label>
                <Input
                  id="depth"
                  type="number"
                  value={formData.depth}
                  onChange={(e) => handleInputChange('depth', e.target.value)}
                  className={!validation.depth ? 'border-red-500' : ''}
                  placeholder="Enter required depth"
                />
                {!validation.depth && (
                  <p className="text-red-500 text-sm">Please enter a valid depth</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location Details *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </span>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="rounded-l-none"
                    placeholder="Enter precise location"
                  />
                </div>
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Service Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className={!validation.budget ? 'border-red-500' : ''}
                  placeholder="Enter your budget"
                />
              </div>

              {/* Property Size */}
              <div className="space-y-2">
                <Label htmlFor="propertySize">Property Size (acres)</Label>
                <Input
                  id="propertySize"
                  type="number"
                  value={formData.propertySize}
                  onChange={(e) => handleInputChange('propertySize', e.target.value)}
                  placeholder="Enter property size"
                />
              </div>
            </div>

            {/* Water Usage */}
            <div className="space-y-2">
              <Label htmlFor="waterUsage">Intended Water Usage *</Label>
              <Select
                value={formData.waterUsage}
                onValueChange={(value) => handleInputChange('waterUsage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select water usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMESTIC">Domestic Use</SelectItem>
                  <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Site Photos */}
            <div className="space-y-2">
              <Label>Site Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'sitePhotos')}
                  className="hidden"
                  id="sitePhotos"
                />
                <label
                  htmlFor="sitePhotos"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Image className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    Drop site photos here or click to upload
                  </span>
                </label>
                {formData.sitePhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {formData.sitePhotos.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Site photo ${index + 1}`}
                          className="h-24 w-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('sitePhotos', index)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full -mt-2 -mr-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Land Ownership Proof */}
            <div className="space-y-2">
              <Label>Land Ownership Proof *</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'landOwnershipProof')}
                  className="hidden"
                  id="landOwnershipProof"
                />
                <label
                  htmlFor="landOwnershipProof"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <FileText className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    Upload land ownership document (PDF only)
                  </span>
                </label>
                {formData.landOwnershipProof && (
                  <div className="mt-4 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate">
                      {formData.landOwnershipProof.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('landOwnershipProof', null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                rows={4}
                placeholder="Any additional requirements or special considerations..."
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {uploadProgress > 0 && (
            <div className="w-full">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
          <div className="flex justify-end gap-4 w-full">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !validateForm()}
              className="min-w-[150px]"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ServiceRequestForm;