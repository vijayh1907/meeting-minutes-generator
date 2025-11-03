import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { CheckSquare, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { MeetingData, ActionItem } from '../App';
import { buildApiUrl, getApiEndpoint } from '../config/api';

interface AssignmentScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function AssignmentScreen({
  meetingData,
  setMeetingData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: AssignmentScreenProps) {
  useEffect(() => {
    // Generate action items from classified items
    if (meetingData.actionItems.length === 0) {
      const actionItems: ActionItem[] = meetingData.classifiedItems
        .filter(item => item.type === 'action')
        .map(item => ({
          id: item.id,
          content: item.content,
          assignedTo: meetingData.participants[0]?.id || '', // Default to first participant
          assigneeName: meetingData.participants[0]?.name || 'Unassigned',
          dueDate: '',
        }));
      
      setMeetingData({
        ...meetingData,
        actionItems,
      });
    }
  }, [meetingData.classifiedItems, meetingData.participants]);

  const handleAssigneeChange = (actionId: string, participantId: string) => {
    const participant = meetingData.participants.find(p => p.id === participantId);
    if (participant) {
      setMeetingData({
        ...meetingData,
        actionItems: meetingData.actionItems.map(action =>
          action.id === actionId
            ? { ...action, assignedTo: participantId, assigneeName: participant.name }
            : action
        ),
      });
    }
  };

  const handleDueDateChange = (actionId: string, dueDate: string) => {
    setMeetingData({
      ...meetingData,
      actionItems: meetingData.actionItems.map(action =>
        action.id === actionId ? { ...action, dueDate } : action
      ),
    });
  };

  const getAssignmentSummary = () => {
    const summary: { [key: string]: { name: string; count: number; actions: ActionItem[] } } = {};
    
    meetingData.actionItems.forEach(action => {
      if (!summary[action.assignedTo]) {
        summary[action.assignedTo] = {
          name: action.assigneeName,
          count: 0,
          actions: [],
        };
      }
      summary[action.assignedTo].count++;
      summary[action.assignedTo].actions.push(action);
    });

    return summary;
  };

  const assignmentSummary = getAssignmentSummary();
  const allAssigned = meetingData.actionItems.every(action => action.assignedTo);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleGenerateEmailDraft = async () => {
    if (submitting || !allAssigned) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Get the original API response structure to extract original action items data
      const originalResponse = meetingData.lastApiResponse;
      
      if (!originalResponse || !originalResponse.identified_action_items) {
        throw new Error('Missing original API response data. Please go back and submit the review again.');
      }

      // Get original action items from the nested structure
      const originalActionItems = originalResponse.identified_action_items?.action_items?.action_items || [];
      
      // Build the new simplified payload structure
      // New structure: { action_items: [...], meeting_date: "...", total_items: N }
      const actionItems = meetingData.actionItems.map((userAction) => {
        // Find the original action item to get fields like priority, status, tags
        const originalItem = originalActionItems.find((item: any) => item.id === userAction.id);
        
        // Find the participant to get email
        const participant = meetingData.participants.find(p => p.id === userAction.assignedTo);
        
        // Format due_date
        let dueDate = 'Not specified';
        if (userAction.dueDate) {
          const date = new Date(userAction.dueDate);
          const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
          dueDate = weekday; // Just the weekday name like "Friday"
        }
        
        // Build the action item with user's changes
        return {
          id: userAction.id,
          description: userAction.content,
          owner: {
            name: participant?.name || userAction.assigneeName || 'Not specified',
            email: participant?.email || null,
          },
          due_date: dueDate,
          priority: originalItem?.priority || 'medium', // Preserve original priority or default
          status: originalItem?.status || 'pending', // Preserve original status or default
          tags: originalItem?.tags || [], // Preserve original tags or default to empty array
        };
      });
      
      // Get meeting date from original response or use meetingData.meetingDate
      const meetingDate = originalResponse.identified_action_items?.action_items?.meeting_date || 
                          meetingData.meetingDate ||
                          'Not specified';
      
      // Construct the new simplified payload
      const payload = {
        action_items: actionItems,
        meeting_date: meetingDate,
        total_items: actionItems.length,
      };

      // Debug log: summarize payload being sent
      console.log('=== API REQUEST PAYLOAD DEBUG ===');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('REVIEW_AND_ASSIGN_ACTION_ITEMS')));
      console.log('Request Method: POST');
      console.log('Content-Type: application/json');
      console.log('');
      console.log('Payload (Full):', payload);
      console.log('');
      console.log('Payload (Formatted JSON):', JSON.stringify(payload, null, 2));
      console.log('');
      console.log('Action Items Count:', payload.action_items.length);
      console.log('Action Items:', payload.action_items);
      console.log('Meeting Date:', payload.meeting_date);
      console.log('Total Items:', payload.total_items);
      console.log('=== END API REQUEST PAYLOAD DEBUG ===');
      console.log('');

      const response = await fetch(buildApiUrl(getApiEndpoint('REVIEW_AND_ASSIGN_ACTION_ITEMS')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `Failed to submit assigned action items (${response.status} ${response.statusText})`;
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
      console.log('Endpoint: POST /review_and_assign_action_items');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('REVIEW_AND_ASSIGN_ACTION_ITEMS')));
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('');
      console.log('Response Data (Full Object):', responseData);
      console.log('');
      console.log('Response Data (Formatted JSON):', JSON.stringify(responseData, null, 2));
      console.log('');
      console.log('Response Data Keys:', Object.keys(responseData));
      console.log('');
      
      // Log nested structure if it exists
      if (responseData.identified_action_items) {
        console.log('identified_action_items keys:', Object.keys(responseData.identified_action_items));
        if (responseData.identified_action_items.action_items) {
          console.log('identified_action_items.action_items keys:', Object.keys(responseData.identified_action_items.action_items));
          if (responseData.identified_action_items.action_items.action_items) {
            console.log('Action Items Count:', responseData.identified_action_items.action_items.action_items.length);
            console.log('Action Items:', responseData.identified_action_items.action_items.action_items);
          }
        }
      }
      
      // Log other potential top-level keys for planning
      if (responseData.email_draft) {
        console.log('email_draft found:', responseData.email_draft);
      }
      if (responseData.email_content) {
        console.log('email_content found:', responseData.email_content);
      }
      if (responseData.minutes_of_meeting) {
        console.log('minutes_of_meeting found:', responseData.minutes_of_meeting);
      }
      if (responseData.summary) {
        console.log('summary found:', responseData.summary);
      }
      
      console.log('=== END API RESPONSE DEBUG ===');
      console.log('');
      console.log('📧 RESPONSE RECEIVED - Ready to integrate in EmailPreviewScreen');
      console.log('💡 Use this response structure to populate the email preview screen');
      console.log('');

      // Store the response in meetingData for use in EmailPreviewScreen
      setMeetingData({
        ...meetingData,
        emailDraftResponse: responseData,
      });

      // Navigate to the next screen (EmailPreviewScreen)
      onNext();
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error while submitting assigned action items');
      console.error('Error submitting assigned action items:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl mb-2">Assign Action Items</h2>
        <p className="text-muted-foreground">
          Assign each action item to the appropriate meeting participant and set due dates if needed.
        </p>
      </div>

      {/* Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assignment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(assignmentSummary).map(([participantId, data]) => (
              <div key={participantId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{data.name}</h4>
                  <Badge variant="secondary">{data.count} actions</Badge>
                </div>
                <div className="space-y-1">
                  {data.actions.map(action => (
                    <div key={action.id} className="text-sm text-muted-foreground truncate">
                      {action.content.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          <h3 className="text-lg font-medium">Action Items ({meetingData.actionItems.length})</h3>
        </div>

        {meetingData.actionItems.map((action, index) => (
          <Card key={action.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Action number and content */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{action.content}</p>
                  </div>
                </div>

                {/* Assignment controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                  <div>
                    <Label htmlFor={`assignee-${action.id}`}>Assigned To</Label>
                    <Select
                      value={action.assignedTo}
                      onValueChange={(value) => handleAssigneeChange(action.id, value)}
                    >
                      <SelectTrigger id={`assignee-${action.id}`}>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetingData.participants.map(participant => (
                          <SelectItem key={participant.id} value={participant.id}>
                            {participant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`due-date-${action.id}`}>Due Date (Optional)</Label>
                    <Input
                      id={`due-date-${action.id}`}
                      type="date"
                      value={action.dueDate}
                      onChange={(e) => handleDueDateChange(action.id, e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Assignment status */}
                <div className="pl-12">
                  <div className="flex items-center gap-2 text-sm">
                    {action.assignedTo ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600">Assigned to {action.assigneeName}</span>
                        {action.dueDate && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Due: {new Date(action.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600">Not assigned</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {meetingData.actionItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No action items found in the meeting transcript.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
          onClick={handleGenerateEmailDraft}
          disabled={!canGoNext || !allAssigned || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Generate Email Draft
              {!allAssigned && (
                <span className="text-xs ml-2">(All actions must be assigned)</span>
              )}
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