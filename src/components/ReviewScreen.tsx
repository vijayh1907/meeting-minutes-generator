import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageSquare, HelpCircle, CheckSquare, Edit, Save, X, VolumeX, Loader2 } from 'lucide-react';
import { MeetingData, ClassifiedItem, ActionItem } from '../App';
import { buildApiUrl, getApiEndpoint } from '../config/api';

interface ReviewScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

// Classified items are now provided by API via UploadScreen and stored in meetingData

export function ReviewScreen({
  meetingData,
  setMeetingData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: ReviewScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleEdit = (item: ClassifiedItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (itemId: string) => {
    setMeetingData({
      ...meetingData,
      classifiedItems: meetingData.classifiedItems.map(item =>
        item.id === itemId ? { ...item, content: editContent } : item
      ),
    });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleTypeChange = (itemId: string, newType: 'discussion' | 'question' | 'action' | 'noise') => {
    setMeetingData({
      ...meetingData,
      classifiedItems: meetingData.classifiedItems.map(item =>
        item.id === itemId ? { ...item, type: newType } : item
      ),
    });
  };

  const handleContinueToActionAssignment = async () => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Prepare the payload as an array matching the API structure
      // API expects: [{ raw_transcript_line, category, tags, confidence, notes, meeting_id }, ...]
      const payload = meetingData.classifiedItems.map(item => {
        // Capitalize category: "discussion" -> "Discussion", "question" -> "Question", "action" -> "Action", "noise" -> "Noise"
        const category = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        
        return {
          raw_transcript_line: item.rawTranscriptLine || '',
          category: category,
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
          confidence: typeof item.confidence === 'number' ? item.confidence : (item.confidence || 0),
          notes: item.content || '',
          meeting_id: meetingData.meetingTitle || '', // Always include meeting_id
        };
      });

      // Debug log: summarize payload being sent
      console.log('=== API REQUEST PAYLOAD DEBUG ===');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('SUBMIT_REVIEWED_DATA')));
      console.log('Request Method: POST');
      console.log('Content-Type: application/json');
      console.log('');
      console.log('Payload (Array of items):', payload);
      console.log('');
      console.log('Payload (Formatted JSON):', JSON.stringify(payload, null, 2));
      console.log('');
      console.log(`Total items in payload: ${payload.length}`);
      if (payload.length > 0) {
        console.log('Sample item structure:', payload[0]);
      }
      console.log('=== END API REQUEST PAYLOAD DEBUG ===');
      console.log('');

      const response = await fetch(buildApiUrl(getApiEndpoint('SUBMIT_REVIEWED_DATA')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `Failed to submit reviewed data (${response.status} ${response.statusText})`;
        try {
          const errorText = await response.text();
          console.error('API Error Response (raw text):', errorText);
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              console.error('API Error Response (parsed JSON):', errorData);
              
              if (errorData.detail && Array.isArray(errorData.detail)) {
                // Handle Pydantic/FastAPI validation error format
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

      const data = await response.json();
      
      // Enhanced console logging of API response
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Request URL:', buildApiUrl(getApiEndpoint('SUBMIT_REVIEWED_DATA')));
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('');
      console.log('Response Data (Full):', data);
      console.log('');
      console.log('Response Data (Formatted):', JSON.stringify(data, null, 2));
      console.log('');
      
      // Check for nested path: identified_action_items.action_items.action_items
      let actionItemsArray: any[] = [];
      if (data.identified_action_items?.action_items?.action_items && Array.isArray(data.identified_action_items.action_items.action_items)) {
        actionItemsArray = data.identified_action_items.action_items.action_items;
        console.log(`Action Items Count: ${actionItemsArray.length}`);
        console.log('Action Items (from identified_action_items.action_items.action_items):');
        actionItemsArray.forEach((item: any, index: number) => {
          console.log(`  [${index + 1}]`, item);
        });
      } else if (data.action_items && Array.isArray(data.action_items)) {
        actionItemsArray = data.action_items;
        console.log(`Action Items Count: ${actionItemsArray.length}`);
        console.log('Action Items (from action_items):');
        actionItemsArray.forEach((item: any, index: number) => {
          console.log(`  [${index + 1}]`, item);
        });
      } else if (data.actionItems && Array.isArray(data.actionItems)) {
        actionItemsArray = data.actionItems;
        console.log(`Action Items Count (camelCase): ${actionItemsArray.length}`);
        console.log('Action Items (camelCase):');
        actionItemsArray.forEach((item: any, index: number) => {
          console.log(`  [${index + 1}]`, item);
        });
      } else {
        console.log('No action_items found in expected paths');
        console.log('Available keys in response:', Object.keys(data));
        if (data.identified_action_items) {
          console.log('identified_action_items keys:', Object.keys(data.identified_action_items));
          if (data.identified_action_items.action_items) {
            console.log('identified_action_items.action_items keys:', Object.keys(data.identified_action_items.action_items));
          }
        }
      }
      console.log('=== END API RESPONSE DEBUG ===');
      console.log('');

      // Parse the API response and map to ActionItem format
      // API response structure:
      // { identified_action_items: { action_items: { action_items: [{ id, description, owner: { name, email }, due_date, due_date_calculated, ... }, ...] } } }
      // Fallback to: { action_items: [...] } or { actionItems: [...] }
      const actionItems: ActionItem[] = actionItemsArray.map((item: any, index: number) => {
        // Map owner info to assignedTo and assigneeName
        const owner = item.owner || {};
        const ownerName = owner.name || 'Not specified';
        const ownerEmail = owner.email || '';
        
        // Use email as assignedTo if available, otherwise use id or empty string
        const assignedTo = ownerEmail || item.id || index.toString();
        
        // Use due_date_calculated (ISO format) if available, otherwise use due_date
        const dueDate = item.due_date_calculated || item.due_date || '';
        
        return {
          id: item.id || index.toString(),
          content: item.description || item.content || '',
          assignedTo: assignedTo,
          assigneeName: ownerName === 'Not specified' ? 'Unassigned' : ownerName,
          dueDate: dueDate || undefined,
        };
      });

      // Update meetingData with action items from API response
      // Also store the full API response so we can reconstruct it later with user changes
      setMeetingData({
        ...meetingData,
        actionItems,
        lastApiResponse: data, // Store the full response structure
      });

      // Navigate to the next screen (AssignmentScreen)
      onNext();
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error while submitting reviewed data');
      console.error('Error submitting reviewed data:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredItems = () => {
    // Only show items that have a rawTranscriptLine starting with time pattern
    const timePatternItems = meetingData.classifiedItems.filter(item => 
      item.rawTranscriptLine && 
      /^\*\*\[\d{2}:\d{2}:\d{2}\]/.test(item.rawTranscriptLine)
    );
    
    if (activeTab === 'all') {
      // Show all items except noise in the "All" tab
      return timePatternItems.filter(item => item.type !== 'noise');
    } else if (activeTab === 'noise') {
      // Show only noise items in the "Noise" tab
      return timePatternItems.filter(item => item.type === 'noise');
    } else {
      // Show items of the specific type (excluding noise)
      return timePatternItems.filter(item => item.type === activeTab);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discussion':
        return <MessageSquare className="w-4 h-4" />;
      case 'question':
        return <HelpCircle className="w-4 h-4" />;
      case 'action':
        return <CheckSquare className="w-4 h-4" />;
      case 'noise':
        return <VolumeX className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discussion':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'question':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'action':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'noise':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCounts = () => {
    // Get all time-pattern items
    const timePatternItems = meetingData.classifiedItems.filter(item => 
      item.rawTranscriptLine && 
      /^\*\*\[\d{2}:\d{2}:\d{2}\]/.test(item.rawTranscriptLine)
    );
    
    // Count main categories (excluding noise)
    const discussions = timePatternItems.filter(item => item.type === 'discussion').length;
    const questions = timePatternItems.filter(item => item.type === 'question').length;
    const actions = timePatternItems.filter(item => item.type === 'action').length;
    
    // Count noise items separately
    const noise = timePatternItems.filter(item => item.type === 'noise').length;
    
    return { discussions, questions, actions, noise };
  };

  const counts = getCounts();

  // Check if there are any time-pattern items at all (including noise)
  const allTimePatternItems = meetingData.classifiedItems.filter(item => 
    item.rawTranscriptLine && 
    /^\*\*\[\d{2}:\d{2}:\d{2}\]/.test(item.rawTranscriptLine)
  );
  
  // If there are no time-pattern items at all, show an empty state
  if (!allTimePatternItems || allTimePatternItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <h3 className="text-lg font-medium">No time-stamped items found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Only items with time stamps (e.g., **[00:00:00]) are displayed in the review tabs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl mb-2">Review & Classify Content</h2>
        <p className="text-muted-foreground">
          Review the AI-generated classification and make corrections if needed. You can edit content and change classifications.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Discussions</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{counts.discussions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Questions</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{counts.questions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <span className="font-medium">Actions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{counts.actions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full justify-between">
          <TabsTrigger value="all" className="flex-1">All ({allTimePatternItems.length})</TabsTrigger>
          <TabsTrigger value="discussion" className="flex-1">Discussions ({counts.discussions})</TabsTrigger>
          <TabsTrigger value="question" className="flex-1">Questions ({counts.questions})</TabsTrigger>
          <TabsTrigger value="action" className="flex-1">Actions ({counts.actions})</TabsTrigger>
          <TabsTrigger value="noise" className="flex-1">Noise ({counts.noise})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {getFilteredItems().map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header with type and speaker */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getTypeColor(item.type)} flex items-center gap-1`}>
                          {getTypeIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </Badge>
                        {item.speaker && (
                          <span className="text-sm text-muted-foreground">
                            by {item.speaker}
                          </span>
                        )}
                        {/* Review Status */}
                        {item.needsReview && (
                          <Badge variant="destructive" className="text-xs">
                            Needs Review
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={item.type}
                          onValueChange={(value: 'discussion' | 'question' | 'action' | 'noise') =>
                            handleTypeChange(item.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discussion">Discussion</SelectItem>
                            <SelectItem value="question">Question</SelectItem>
                            <SelectItem value="action">Action</SelectItem>
                            <SelectItem value="noise">Noise</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                              className="h-8"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-8"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="h-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      {editingId === item.id ? (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Edit the content..."
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{item.content}</p>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-2">
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Raw Transcript Line */}
                      {item.rawTranscriptLine && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <span className="font-medium">Raw transcript:</span> {item.rawTranscriptLine}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {getFilteredItems().length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No {activeTab === 'all' ? 'items' : activeTab + 's'} found.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
          onClick={handleContinueToActionAssignment}
          disabled={!canGoNext || meetingData.classifiedItems.length === 0 || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Continue to Action Assignment'
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