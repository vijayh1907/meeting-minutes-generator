import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { CheckSquare, Calendar, User, AlertCircle } from 'lucide-react';
import { MeetingData, ActionItem } from '../App';

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
          onClick={onNext}
          disabled={!canGoNext || !allAssigned}
        >
          Generate Email Draft
          {!allAssigned && (
            <span className="text-xs ml-2">(All actions must be assigned)</span>
          )}
        </Button>
      </div>
    </div>
  );
}