import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Upload, FileText, X, Plus, Users, Paperclip, File } from 'lucide-react';
import { MeetingData, Participant, ClassifiedItem } from '../App';
import { buildApiUrl, getApiEndpoint } from '../config/api';

interface UploadScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

// Participants will be fetched from API

export function UploadScreen({
  meetingData,
  setMeetingData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: UploadScreenProps) {
  const [dragOver, setDragOver] = useState(false);
  const [attachmentDragOver, setAttachmentDragOver] = useState(false);
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  // Fetch participants from API
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoadingParticipants(true);
        const response = await fetch(buildApiUrl(getApiEndpoint('GET_PARTICIPANTS')));
        if (!response.ok) {
          throw new Error(`Failed to fetch participants: ${response.status}`);
        }
        const data = await response.json();
        setAvailableParticipants(data);
      } catch (err: any) {
        setParticipantsError(err.message || 'Failed to fetch participants');
        // Fallback to empty array
        setAvailableParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, []);



  const handleFileUpload = (file: File) => {
    setMeetingData({
      ...meetingData,
      transcriptFile: file,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const addParticipant = (participant: Participant) => {
    if (!meetingData.participants.find(p => p.id === participant.id)) {
      setMeetingData({
        ...meetingData,
        participants: [...meetingData.participants, participant],
      });
    }
    setShowParticipantDropdown(false);
  };

  const removeParticipant = (participantId: string) => {
    setMeetingData({
      ...meetingData,
      participants: meetingData.participants.filter(p => p.id !== participantId),
    });
  };

  const handleAttachmentUpload = (files: FileList) => {
    const newAttachments = Array.from(files);
    setMeetingData({
      ...meetingData,
      attachments: [...meetingData.attachments, ...newAttachments],
    });
  };

  const handleAttachmentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAttachmentDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAttachmentUpload(files);
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleAttachmentUpload(files);
    }
  };

  const removeAttachment = (index: number) => {
    setMeetingData({
      ...meetingData,
      attachments: meetingData.attachments.filter((_, i) => i !== index),
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProceed = meetingData.transcriptFile && meetingData.participants.length > 0 && meetingData.meetingTitle.trim();



  const handleGenerateMinutes = async () => {
    if (!canProceed || submitting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('meetingTitle', meetingData.meetingTitle);
      form.append('meetingDate', meetingData.meetingDate);
      form.append('participants', JSON.stringify(meetingData.participants));
      if (meetingData.transcriptFile) {
        form.append('transcriptFile', meetingData.transcriptFile, meetingData.transcriptFile.name);
      }
      for (const file of meetingData.attachments) {
        form.append('attachments', file, file.name);
      }

      // Debug log: summarize payload being sent
      try {
        const summarized = Array.from(form.entries()).map(([key, value]) => {
          if (typeof File !== 'undefined' && value instanceof File) {
            const f = value as File;
            return [key, { name: f.name, size: f.size, type: f.type }];
          }
          return [key, value];
        });
        // eslint-disable-next-line no-console
        console.log('POST /api/upload_meeting_files payload', {
          url: buildApiUrl(getApiEndpoint('UPLOAD_MEETING_FILES')),
          formData: summarized,
        });
      } catch {}
      
      // Log the complete payload as it will be received by the backend
      console.log('=== BACKEND PAYLOAD DEBUG ===');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('UPLOAD_MEETING_FILES')));
      console.log('Request Method: POST');
      console.log('Content-Type: multipart/form-data');
      console.log('');
      console.log('FormData entries:');
      const entries = Array.from(form.entries());
      console.log('Total entries found:', entries.length);
      
      // Log each entry with try-catch to prevent errors
      entries.forEach(([key, value], index) => {
        try {
          console.log(`Entry ${index + 1} - Key: "${key}"`);
          // Check if it's a file by looking for file properties
          if (value && typeof value === 'object' && 'name' in value && 'size' in value) {
            const f = value as any;
            console.log(`  Value: File(${f.name}, ${f.size} bytes, ${f.type || 'unknown'})`);
          } else {
            console.log(`  Value: ${value}`);
          }
        } catch (error) {
          console.log(`  Error processing entry ${index + 1}:`, error);
        }
      });
      console.log('');
      console.log('Form fields:');
      console.log('  meetingTitle:', meetingData.meetingTitle);
      console.log('  meetingDate:', meetingData.meetingDate);
      console.log('  participants:', JSON.stringify(meetingData.participants));
      console.log('FormData:', form);
      console.log('=== END BACKEND PAYLOAD DEBUG ===');
      console.log('');

      const response = await fetch(buildApiUrl(getApiEndpoint('UPLOAD_MEETING_FILES')), {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload meeting files (${response.status})`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Update meetingData with the classified items from the API response
      setMeetingData({
        ...meetingData,
        classifiedItems: data.map((item: any, index: number) => ({
          id: index.toString(),
          type: item.category?.toLowerCase() || 'discussion',
          content: item.notes || item.raw_transcript_line || '',
          speaker: undefined, // API doesn't provide speaker info
          confidence: item.confidence,
          needsReview: item.needs_review,
          tags: item.tags || [],
          rawTranscriptLine: item.raw_transcript_line
        }))
      });

      onNext();
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error while uploading meeting files');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {submitting && (
        <div 
          className="fixed inset-0 bg-white z-[99999] flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 99999
          }}
        >
          <div className="text-center max-w-lg mx-4">
            {/* Enhanced Spinner */}
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-200 mx-auto"></div>
              <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary border-t-transparent mx-auto absolute inset-0"></div>
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Meeting Transcript
            </h3>
            
            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-6">
              Please wait while our AI model analyzes and processes your meeting transcript. This may take a few minutes...
            </p>
            
            {/* Progress indicator */}
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-xl mb-2">Upload Meeting Transcript & Select Participants</h2>
        <p className="text-muted-foreground">
          Upload your Teams meeting transcript file and select the meeting participants to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meetingTitle">Meeting Title</Label>
              <Input
                id="meetingTitle"
                placeholder="Enter meeting title..."
                value={meetingData.meetingTitle}
                onChange={(e) => setMeetingData({ ...meetingData, meetingTitle: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="meetingDate">Meeting Date</Label>
              <Input
                id="meetingDate"
                type="date"
                value={meetingData.meetingDate}
                onChange={(e) => setMeetingData({ ...meetingData, meetingDate: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {meetingData.transcriptFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <p className="font-medium">{meetingData.transcriptFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(meetingData.transcriptFile.size)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMeetingData({ ...meetingData, transcriptFile: null })}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your transcript file here</p>
                    <p className="text-sm text-muted-foreground">
                      Supports .txt, .docx, .pdf files
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="transcript-upload"
                      className="hidden"
                      accept=".txt,.docx,.pdf"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('transcript-upload')?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attachments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Meeting Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              attachmentDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDrop={handleAttachmentDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setAttachmentDragOver(true);
            }}
            onDragLeave={() => setAttachmentDragOver(false)}
          >
            <div className="space-y-3">
              <File className="w-10 h-10 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Drop additional files here</p>
                <p className="text-sm text-muted-foreground">
                  Presentations, documents, or other meeting materials
                </p>
              </div>
              <div>
                <input
                  type="file"
                  id="attachments-upload"
                  className="hidden"
                  multiple
                  onChange={handleAttachmentSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('attachments-upload')?.click()}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          </div>

          {/* Uploaded Attachments */}
          {meetingData.attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Attachments ({meetingData.attachments.length})</Label>
              <div className="space-y-2">
                {meetingData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Meeting Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Participant */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowParticipantDropdown(!showParticipantDropdown)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Participant
            </Button>

            {showParticipantDropdown && (
              <Card className="absolute top-full left-0 mt-2 w-80 z-10 max-h-60 overflow-y-auto">
                <CardContent className="p-2">
                  {loadingParticipants ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading participants...</p>
                    </div>
                  ) : participantsError ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-red-600 mb-2">{participantsError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : availableParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No participants available</p>
                  ) : (
                    <>
                      {availableParticipants
                        .filter(p => !meetingData.participants.find(selected => selected.id === p.id))
                        .map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                            onClick={() => addParticipant(participant)}
                          >
                            <div>
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-sm text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                        ))}
                      {availableParticipants.filter(p => !meetingData.participants.find(selected => selected.id === p.id)).length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">All participants added</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selected Participants */}
          <div className="space-y-2">
            <Label>Selected Participants ({meetingData.participants.length})</Label>
            <div className="flex flex-wrap gap-2">
              {meetingData.participants.map((participant) => (
                <Badge
                  key={participant.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <span>{participant.name}</span>
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {meetingData.participants.length === 0 && (
                <p className="text-sm text-muted-foreground">No participants selected</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-2"
        >
          Previous
        </Button>

        <Button
          onClick={handleGenerateMinutes}
          disabled={!canProceed || submitting}
          className="flex items-center gap-2"
        >
          {submitting ? 'Generating…' : 'Generate Minutes'}
          {!submitting && (
            <span className="text-xs">({canProceed ? 'Ready' : 'Missing requirements'})</span>
          )}
        </Button>
      </div>

      {submitError && (
        <div className="text-sm text-red-600 pt-2">{submitError}</div>
      )}

      {/* Click overlay to close dropdown */}
      {showParticipantDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowParticipantDropdown(false)}
        />
      )}
    </div>
  );
}