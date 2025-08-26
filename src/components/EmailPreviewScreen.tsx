import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Mail, Copy, Edit, Eye, FileText, Calendar, Users, CheckSquare } from 'lucide-react';
import { MeetingData } from '../App';
import { toast } from 'sonner@2.0.3';

interface EmailPreviewScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function EmailPreviewScreen({
  meetingData,
  setMeetingData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: EmailPreviewScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Meeting Minutes - ${meetingData.meetingTitle}`);
  const [emailBody, setEmailBody] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  React.useEffect(() => {
    generateEmailBody();
  }, [meetingData]);

  const generateEmailBody = () => {
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
    <div className="space-y-6">
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

        <Button variant="outline" onClick={handleCopyToClipboard}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Email
        </Button>
      </div>
    </div>
  );
}