import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Mail, Copy, Edit, Eye, FileText, Calendar, Users, CheckSquare, Loader2 } from 'lucide-react';
import { MeetingData } from '../App';
import { toast } from 'sonner@2.0.3';
import { buildApiUrl, getApiEndpoint } from '../config/api';

interface EmailPreviewScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onBackToDashboard?: () => void;
}

export function EmailPreviewScreen({
  meetingData,
  setMeetingData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  onBackToDashboard,
}: EmailPreviewScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Meeting Minutes - ${meetingData.meetingTitle}`);
  const [emailBody, setEmailBody] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  React.useEffect(() => {
    generateEmailBody();
  }, [meetingData]);

  const generateEmailBody = () => {
    // Check if we have the API response with updated_mom_content
    if (meetingData.emailDraftResponse?.updated_mom_content) {
      let content = meetingData.emailDraftResponse.updated_mom_content;
      
      // Remove markdown code fences if present (triple backticks)
      content = content.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
      
      // Trim any leading/trailing whitespace
      content = content.trim();
      
      setEmailBody(content);
      return;
    }

    // Fallback to generating email body from meeting data
    const discussions = meetingData.classifiedItems.filter(item => item.type === 'discussion');
    const questions = meetingData.classifiedItems.filter(item => item.type === 'question');
    const actions = meetingData.actionItems;

    const formattedDate = new Date(meetingData.meetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let body = `Dear Team,

Please find below the minutes from our meeting "${meetingData.meetingTitle}" held on ${formattedDate}.

## Meeting Participants
${meetingData.participants.map(p => `• ${p.name}`).join('\n')}

`;

    if (discussions.length > 0) {
      body += `## Key Discussions
${discussions.map((item, index) => `${index + 1}. ${item.content}`).join('\n\n')}

`;
    }

    if (questions.length > 0) {
      body += `## Questions Raised
${questions.map((item, index) => `${index + 1}. ${item.content}`).join('\n\n')}

`;
    }

    if (actions.length > 0) {
      body += `## Action Items
${actions.map((action, index) => {
        let actionText = `${index + 1}. ${action.content}\n   👤 Assigned to: ${action.assigneeName}`;
        if (action.dueDate) {
          actionText += `\n   📅 Due: ${new Date(action.dueDate).toLocaleDateString()}`;
        }
        return actionText;
      }).join('\n\n')}

`;
    }

    body += `---

Please review your assigned action items and reach out if you have any questions or concerns.

Best regards,
Meeting Host`;

    setEmailBody(body);
  };

  const handleCopyToClipboard = () => {
    const fullEmail = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmail).then(() => {
      toast.success('Email content copied to clipboard!');
    });
  };

  const handleSaveAndSendNotification = async () => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Get the API response data
      const emailDraftResponse = meetingData.emailDraftResponse;
      
      if (!emailDraftResponse) {
        throw new Error('Missing email draft data. Please go back and generate the email draft again.');
      }

      // Extract mom_content and action_items from the response
      const momContent = emailDraftResponse.updated_mom_content || emailBody;
      const actionItems = emailDraftResponse.action_items || [];

      // Remove markdown code fences if present in mom_content
      let cleanedMomContent = momContent;
      if (typeof cleanedMomContent === 'string') {
        cleanedMomContent = cleanedMomContent.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
        cleanedMomContent = cleanedMomContent.trim();
      }

      // Build the payload
      const payload = {
        mom_content: cleanedMomContent,
        action_items: actionItems,
      };

      // Debug log: summarize payload being sent
      console.log('=== API REQUEST PAYLOAD DEBUG ===');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('REVIEW_AND_FINALIZE_MOM')));
      console.log('Request Method: POST');
      console.log('Content-Type: application/json');
      console.log('');
      console.log('Payload (Full):', payload);
      console.log('');
      console.log('Payload (Formatted JSON):', JSON.stringify(payload, null, 2));
      console.log('');
      console.log('mom_content length:', cleanedMomContent.length);
      console.log('action_items count:', actionItems.length);
      console.log('=== END API REQUEST PAYLOAD DEBUG ===');
      console.log('');

      const response = await fetch(buildApiUrl(getApiEndpoint('REVIEW_AND_FINALIZE_MOM')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `Failed to save and send notification (${response.status} ${response.statusText})`;
        try {
          const errorText = await response.text();
          console.error('API Error Response (raw text):', errorText);
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              console.error('API Error Response (parsed JSON):', errorData);
              
              if (errorData.detail && Array.isArray(errorData.detail)) {
                const validationErrors = errorData.detail.map((err: any) => {
                  const field = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : 'unknown';
                  return `${field}: ${err.msg || err.message || 'validation error'}`;
                }).join(', ');
                errorMessage += `: ${validationErrors}`;
              } else if (errorData.message) {
                errorMessage += `: ${errorData.message}`;
              } else if (errorData.error) {
                errorMessage += `: ${errorData.error}`;
              } else if (errorData.detail) {
                errorMessage += `: ${errorData.detail}`;
              } else {
                errorMessage += `: ${errorText}`;
              }
            } catch (parseError) {
              errorMessage += `: ${errorText}`;
            }
          }
        } catch (e) {
          console.error('Could not read error response:', e);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      // Enhanced console logging of API response
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Endpoint: POST /api/review_and_finalize_mom');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('REVIEW_AND_FINALIZE_MOM')));
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('');
      console.log('Response Data (Full Object):', responseData);
      console.log('');
      console.log('Response Data (Formatted JSON):', JSON.stringify(responseData, null, 2));
      console.log('');
      console.log('Response Data Keys:', Object.keys(responseData));
      console.log('=== END API RESPONSE DEBUG ===');
      console.log('');

      // Show success message
      toast.success('Meeting minutes saved and notification sent successfully!');
      
      // Redirect to Dashboard after successful response
      if (onBackToDashboard) {
        // Small delay to ensure the success message is visible
        setTimeout(() => {
          onBackToDashboard();
        }, 1000);
      }
      
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error while saving and sending notification');
      toast.error(err?.message || 'Failed to save and send notification');
      console.error('Error saving and sending notification:', err);
    } finally {
      setSubmitting(false);
    }
  };



  const getAssignmentSummary = () => {
    const summary: { [key: string]: { name: string; count: number } } = {};
    
    meetingData.actionItems.forEach(action => {
      if (!summary[action.assignedTo]) {
        summary[action.assignedTo] = {
          name: action.assigneeName,
          count: 0,
        };
      }
      summary[action.assignedTo].count++;
    });

    return Object.values(summary);
  };

  const assignmentSummary = getAssignmentSummary();

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {submitting && (
        <div
          className="fixed inset-0 bg-white flex items-center justify-center"
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
              Saving MOM and Sending Teams/Slack Message to participants regarding their Action items
            </h3>
            
            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-6">
              Please wait...
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
        <h2 className="text-xl mb-2">Email Draft Preview</h2>
        <p className="text-muted-foreground">
          Review the generated email draft and make any final adjustments before sending.
        </p>
      </div>

      {/* Meeting Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meeting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date</span>
              </div>
              <div className="font-medium">
                {new Date(meetingData.meetingDate).toLocaleDateString()}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Participants</span>
              </div>
              <div className="font-medium">{meetingData.participants.length}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Actions</span>
              </div>
              <div className="font-medium">{meetingData.actionItems.length}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recipients</span>
              </div>
              <div className="font-medium">{meetingData.participants.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Assignment Summary */}
      {assignmentSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Assignment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {assignmentSummary.map((assignee, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {assignee.name}: {assignee.count} action{assignee.count !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Draft */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Draft
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
              >
                {viewMode === 'preview' ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Subject */}
          <div>
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="font-medium"
            />
          </div>

          <Separator />

          {/* Email Body */}
          <div>
            <Label htmlFor="email-body">Email Body</Label>
            {viewMode === 'edit' ? (
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Email content..."
              />
            ) : (
              <div className="border rounded-md p-4 bg-muted/30 min-h-[400px]">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {emailBody}
                </pre>
              </div>
            )}
          </div>

          {/* Email Recipients */}
          <div>
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {meetingData.participants.map(participant => (
                <Badge key={participant.id} variant="secondary">
                  {participant.name} &lt;{participant.email}&gt;
                </Badge>
              ))}
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
        >
          Previous
        </Button>

        <Button 
          variant="outline" 
          onClick={handleSaveAndSendNotification}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Save and Send Notification
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
    </div>
  );
}