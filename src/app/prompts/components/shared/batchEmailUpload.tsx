"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, CheckCircle, AlertCircle, X } from "lucide-react";
import { parseCsvFile, downloadSampleCsv, type CsvParseResult } from "@/utils/csvParser";

interface BatchEmailUploadProps {
  onEmailsAdd: (emails: string[], permission: 'view' | 'edit') => void;
  disabled?: boolean;
}

const BatchEmailUpload: React.FC<BatchEmailUploadProps> = ({
  onEmailsAdd,
  disabled = false
}) => {
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await parseCsvFile(file);
      setParseResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('File processing error:', error);
      setParseResult({
        success: false,
        emails: [],
        validEmails: [],
        invalidEmails: [],
        totalCount: 0,
        validCount: 0,
        error: 'Failed to process file'
      });
      setShowPreview(true);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleConfirmAdd = useCallback(() => {
    if (parseResult?.success && parseResult.validEmails.length > 0) {
      onEmailsAdd(parseResult.validEmails, selectedPermission);
      setParseResult(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [parseResult, selectedPermission, onEmailsAdd]);

  const handleCancel = useCallback(() => {
    setParseResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDownloadSample = useCallback(() => {
    downloadSampleCsv();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!showPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Batch Upload Emails</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Sample CSV
            </Button>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
              disabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
            }`}
            onDragOver={handleDragOver}
            onDrop={disabled ? undefined : handleDrop}
            onClick={disabled ? undefined : () => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
            
            <Upload className={`h-6 w-6 mx-auto mb-2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {isProcessing 
                ? 'Processing file...' 
                : 'Drop CSV file here or click to browse'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Support CSV files with email addresses in the first column
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Permission:</span>
            <Select
              value={selectedPermission}
              onValueChange={(value: 'view' | 'edit') => setSelectedPermission(value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-20 h-8 min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="edit" disabled>Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {showPreview && parseResult && (
        <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Upload Preview</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {parseResult.success ? (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{parseResult.validCount} valid emails</span>
                </div>
                {parseResult.invalidEmails.length > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{parseResult.invalidEmails.length} invalid emails</span>
                  </div>
                )}
              </div>

              {/* Valid Emails Preview */}
              {parseResult.validEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valid emails to be added:</p>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                    {parseResult.validEmails.slice(0, 10).map((email, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        {email}
                      </div>
                    ))}
                    {parseResult.validEmails.length > 10 && (
                      <div className="text-sm text-gray-500 italic">
                        ... and {parseResult.validEmails.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invalid Emails Warning */}
              {parseResult.invalidEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-600">Invalid emails (will be skipped):</p>
                  <div className="max-h-24 overflow-y-auto border rounded p-2 bg-orange-50">
                    {parseResult.invalidEmails.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-sm text-orange-700">
                        {item.email}
                      </div>
                    ))}
                    {parseResult.invalidEmails.length > 5 && (
                      <div className="text-sm text-orange-600 italic">
                        ... and {parseResult.invalidEmails.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmAdd}
                  disabled={parseResult.validCount === 0}
                >
                  Add {parseResult.validCount} Emails
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Upload Failed</span>
              </div>
              <p className="text-sm text-red-700">{parseResult.error}</p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchEmailUpload;