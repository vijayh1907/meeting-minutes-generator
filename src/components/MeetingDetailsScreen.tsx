import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Calendar, 
  Users, 
  FileText, 
  Download, 
  Mail, 
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  CircleDot,
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  CheckSquare,
  Bell
} from 'lucide-react';
import { HistoricalMeeting, ActionItemFromAPI } from './Dashboard';

export interface ActionItemWithProgress {
  id: string;
  content: string;
  assignedTo: string;
  assigneeName: string;
  startDate: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'overdue' | 'upcoming';
  completedDate?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  lastNudged?: string;
}

interface MeetingDetailsScreenProps {
  meeting: HistoricalMeeting;
  onBack: () => void;
}

// Mock action items with detailed progress tracking and recent dates (within 3 weeks)
const mockActionItems: ActionItemWithProgress[] = [
  {
    id: '1',
    content: 'Finalize Q1 budget allocation for marketing department and present to executive team',
    assignedTo: '1',
    assigneeName: 'John Smith',
    startDate: '2025-01-15',
    dueDate: '2025-01-29',
    status: 'completed',
    completedDate: '2025-01-28',
    priority: 'high',
    tags: ['Budget', 'Marketing']
  },
  {
    id: '2',
    content: 'Research and compile competitor analysis report for product positioning strategy',
    assignedTo: '2',
    assigneeName: 'Sarah Johnson',
    startDate: '2025-01-20',
    dueDate: '2025-02-03',
    status: 'in-progress',
    priority: 'medium',
    tags: ['Research', 'Competitive Analysis']
  },
  {
    id: '3',
    content: 'Set up automated testing pipeline for the new feature release',
    assignedTo: '3',
    assigneeName: 'Mike Chen',
    startDate: '2025-01-18',
    dueDate: '2025-01-28',
    status: 'overdue',
    priority: 'high',
    tags: ['Development', 'Testing']
  },
  {
    id: '4',
    content: 'Design mockups for the mobile app dashboard redesign project',
    assignedTo: '4',
    assigneeName: 'Emily Davis',
    startDate: '2025-02-01',
    dueDate: '2025-02-12',
    status: 'upcoming',
    priority: 'medium',
    tags: ['Design', 'Mobile']
  },
  {
    id: '5',
    content: 'Conduct user interviews for feature validation and usability testing',
    assignedTo: '2',
    assigneeName: 'Sarah Johnson',
    startDate: '2025-01-25',
    dueDate: '2025-02-05',
    status: 'in-progress',
    priority: 'high',
    tags: ['User Research', 'Testing']
  },
  {
    id: '6',
    content: 'Update documentation for API endpoints and create developer guide',
    assignedTo: '3',
    assigneeName: 'Mike Chen',
    startDate: '2025-01-12',
    dueDate: '2025-01-26',
    status: 'completed',
    completedDate: '2025-01-25',
    priority: 'low',
    tags: ['Documentation', 'API']
  },
  {
    id: '7',
    content: 'Plan and schedule team training sessions for new project management tools',
    assignedTo: '1',
    assigneeName: 'John Smith',
    startDate: '2025-01-22',
    dueDate: '2025-02-08',
    status: 'in-progress',
    priority: 'medium',
    tags: ['Training', 'Team Development']
  },
  {
    id: '8',
    content: 'Review and approve content calendar for social media marketing campaigns',
    assignedTo: '4',
    assigneeName: 'Emily Davis',
    startDate: '2025-01-30',
    dueDate: '2025-02-11',
    status: 'in-progress',
    priority: 'low',
    tags: ['Marketing', 'Content']
  }
];

// Mock raw transcript data
const mockTranscript = `Meeting Transcript - Q1 Strategic Planning Session
Date: January 25, 2025
Time: 2:30 PM - 4:15 PM
Participants: John Smith, Sarah Johnson, Mike Chen, Emily Davis

[14:30] John Smith: Good afternoon everyone. Let's start with our Q1 strategic planning session. I'd like to begin by reviewing our current progress and discussing our priorities for the upcoming quarter.

[14:32] Sarah Johnson: Thanks John. I've prepared a comprehensive analysis of our market position. Our user acquisition has increased by 34% compared to last quarter, which is excellent progress.

[14:35] Mike Chen: That's great news Sarah. From a technical perspective, we've successfully deployed three major feature updates, and our system stability has improved significantly.

[14:38] Emily Davis: The design team has been working closely with product to ensure our user experience remains top-notch. We've received very positive feedback from our recent usability studies.

[14:42] John Smith: Excellent work everyone. Now, let's discuss our action items for Q4. Sarah, can you take the lead on the competitive analysis research?

[14:45] Sarah Johnson: Absolutely. I'll need about two weeks to compile a comprehensive report. I'll also conduct user interviews to validate our feature priorities.

[14:48] Mike Chen: I can handle the technical aspects. We need to set up automated testing for our new features and update our API documentation.

[14:52] Emily Davis: I'll focus on the mobile app redesign. The mockups should be ready by early February, and I can also review the marketing content calendar.

[14:55] John Smith: Perfect. I'll finalize the budget allocation and plan the team training sessions for our new project management tools.

[Transcript continues for additional 1 hour and 50 minutes...]`;

export function MeetingDetailsScreen({ meeting, onBack }: MeetingDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Convert API action items to component format
  const parseFlexibleDate = (dateStr: string): string => {
    // Supports formats like '04-11-2025' (DD-MM-YYYY format from backend) and ISO
    if (!dateStr) return '';
    // Already ISO-like (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Try to extract date from formats like "Tuesday, (04-11-2025)" or just "04-11-2025"
    const dateMatch = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch; // Format: DD-MM-YYYY from backend
      // Parse as DD-MM-YYYY since backend sends dates in this format
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateStr;
  };

  const convertActionItems = (apiActionItems: ActionItemFromAPI[]): ActionItemWithProgress[] => {
    return apiActionItems.map((item) => {
      // Parse due_date_calculated to get dates
      let startDate = new Date(meeting.date).toISOString().split('T')[0]; // Use meeting date as start
      let dueDate = parseFlexibleDate(item.due_date_calculated || item.due_date || '');
      
      // Determine status based on due date and current date
      let status: 'completed' | 'in-progress' | 'overdue' | 'upcoming' = 'upcoming';
      if (item.status === 'pending') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate) {
          const due = new Date(dueDate);
          due.setHours(0, 0, 0, 0);
          if (today > due) {
            status = 'overdue';
          } else if (today.getTime() === due.getTime()) {
            status = 'in-progress';
          } else {
            status = 'upcoming';
          }
        } else {
          status = 'upcoming';
        }
      } else if (item.status === 'completed') {
        status = 'completed';
      } else {
        status = 'in-progress';
      }
      
      return {
        id: item.id,
        content: item.description,
        assignedTo: item.owner.email || item.id,
        assigneeName: item.owner.name || 'Unassigned',
        startDate: startDate,
        dueDate: dueDate || startDate,
        status: status,
        priority: (item.priority || 'medium') as 'high' | 'medium' | 'low',
        tags: item.tags || [],
      };
    });
  };
  
  // Use API action items if available, otherwise use mock data
  const initialActionItems = meeting.action_items && meeting.action_items.length > 0
    ? convertActionItems(meeting.action_items)
    : mockActionItems;
  
  const [actionItems, setActionItems] = useState<ActionItemWithProgress[]>(initialActionItems);
  
  // Update action items when meeting data changes
  React.useEffect(() => {
    const updated = meeting.action_items && meeting.action_items.length > 0
      ? convertActionItems(meeting.action_items)
      : mockActionItems;
    setActionItems(updated);
  }, [meeting.action_items]);
  
  // Get raw transcript from reviewed_classification_data
  const getRawTranscript = () => {
    if (meeting.reviewed_classification_data && meeting.reviewed_classification_data.length > 0) {
      return meeting.reviewed_classification_data
        .map(item => item.raw_transcript_line)
        .join('\n');
    }
    return mockTranscript;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateTimeProgress = (startDate: string, dueDate: string, status: string) => {
    const start = new Date(startDate);
    const due = new Date(dueDate);
    const now = new Date();
    
    if (status === 'completed') return 100;
    if (status === 'upcoming') return 0;
    
    // For in-progress and overdue items
    const totalDuration = due.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    
    return Math.round(progress);
  };

  const getDaysRemaining = (dueDate: string, status: string) => {
    if (status === 'completed') return 0;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDaysFromStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CircleDot className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'upcoming':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getProgressColor = (status: string, progress: number) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'overdue') return 'bg-red-500';
    if (progress > 75) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const handleNudge = (actionId: string, assigneeName: string) => {
    const currentTime = new Date().toISOString();
    
    setActionItems(prevItems => 
      prevItems.map(item => 
        item.id === actionId 
          ? { ...item, lastNudged: currentTime }
          : item
      )
    );
    
    toast.success(`Nudge sent to ${assigneeName}!`);
  };

  const formatNudgeDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <h2 className="text-2xl">{meeting.title}</h2>
            <p className="text-muted-foreground">
              {formatDate(meeting.date)} • {meeting.participants.length} participants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status === 'completed' && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Completed
            </Badge>
          )}
          {meeting.emailSent && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Mail className="w-3 h-3 mr-1" />
              Email Sent
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
          <TabsTrigger value="transcript">Raw Transcript</TabsTrigger>
          <TabsTrigger value="minutes">Meeting Minutes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Meeting Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Discussions</p>
                    <p className="text-2xl font-semibold">{meeting.discussionCount || 0}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Key topics and strategic conversations covered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="text-2xl font-semibold">{meeting.questionCount || 0}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Questions raised and clarifications needed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Action Items</p>
                    <p className="text-2xl font-semibold">{meeting.actionCount || actionItems.length}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Assigned tasks and deliverables
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meeting.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar>
                      <AvatarFallback>
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Original File:</span>
                  <span className="font-medium">{meeting.fileName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">File Size:</span>
                  <span className="font-medium">{meeting.fileSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uploaded:</span>
                  <span className="font-medium">{formatDate(meeting.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Modified:</span>
                  <span className="font-medium">{formatDate(meeting.lastModified)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          {/* Action Items Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">
                    {actionItems.filter(item => item.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-blue-600">
                    {actionItems.filter(item => item.status === 'in-progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">
                    {actionItems.filter(item => item.status === 'overdue').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-600">
                    {actionItems.filter(item => item.status === 'upcoming').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items List */}
          <div className="space-y-4">
            {actionItems.map((action) => {
              const timeProgress = calculateTimeProgress(action.startDate, action.dueDate, action.status);
              const daysRemaining = getDaysRemaining(action.dueDate, action.status);
              const daysFromStart = getDaysFromStart(action.startDate);
              
              return (
                <Card key={action.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(action.status)}
                            {getPriorityBadge(action.priority)}
                          </div>
                          <p className="font-medium leading-relaxed">{action.content}</p>
                        </div>
                        {/* Nudge button for non-completed items */}
                        {action.status !== 'completed' && (
                          <div className="flex flex-col items-end gap-2">
                            {action.lastNudged && (
                              <p className="text-xs text-red-500">
                                Last nudged on {formatNudgeDate(action.lastNudged)}
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNudge(action.id, action.assigneeName)}
                              className="flex items-center gap-2"
                            >
                              <Bell className="w-4 h-4" />
                              Nudge
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Assignee and Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {action.assigneeName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{action.assigneeName}</p>
                            <p className="text-muted-foreground">Assignee</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-medium">{formatDate(action.startDate)} - {formatDate(action.dueDate)}</p>
                          <p className="text-muted-foreground">Timeline</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">
                            {action.status === 'completed' 
                              ? `Completed ${formatDate(action.completedDate!)}`
                              : action.status === 'overdue'
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : action.status === 'upcoming'
                              ? daysRemaining > 0 
                                ? `Starts in ${daysRemaining} days`
                                : `Starts today`
                              : daysRemaining > 0
                              ? `${daysRemaining} days remaining`
                              : daysRemaining === 0
                              ? `Due today`
                              : `${Math.abs(daysRemaining)} days overdue`
                            }
                          </p>
                          <p className="text-muted-foreground">Status</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Time Progress</span>
                          <span className="font-medium">{timeProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(action.status, timeProgress)}`}
                            style={{ width: `${timeProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {action.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Raw Transcript
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {getRawTranscript()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Meeting Minutes
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {meeting.MoM_content ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
                    {meeting.MoM_content}
                  </pre>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <h3>Meeting Summary</h3>
                  <p>
                    The Q1 Strategic Planning Session was conducted to review current progress and establish priorities for the upcoming quarter. 
                    The team discussed user acquisition improvements, technical achievements, design progress, and outlined key action items for the next phase.
                  </p>

                  <h3>Key Discussions</h3>
                  <ul>
                    <li>User acquisition increased by 42% compared to last quarter</li>
                    <li>Five major feature updates successfully deployed</li>
                    <li>System stability improvements implemented with 99.8% uptime</li>
                    <li>Positive feedback received from recent usability studies</li>
                    <li>Q1 budget allocation strategy finalized</li>
                    <li>Team development and training initiatives planned for new tools</li>
                  </ul>

                  <h3>Action Items Assigned</h3>
                  <ul>
                    {actionItems.map((action) => (
                      <li key={action.id}>
                        <strong>{action.assigneeName}:</strong> {action.content}
                      </li>
                    ))}
                  </ul>

                  <h3>Next Steps</h3>
                  <p>
                    All action items have been assigned with specific timelines. The team will reconvene in two weeks to review progress 
                    and address any blockers. Regular check-ins will be scheduled for ongoing projects.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}