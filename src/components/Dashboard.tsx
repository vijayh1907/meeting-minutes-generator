import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Plus, 
  Calendar, 
  Users, 
  MessageSquare, 
  CheckSquare, 
  HelpCircle,
  FileText,
  Filter,
  Download,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Participant, ActionItem } from '../App';

export interface HistoricalMeeting {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  participants: Participant[];
  discussionCount: number;
  questionCount: number;
  actionCount: number;
  fileName: string;
  fileSize: string;
  createdAt: string;
  lastModified: string;
  emailSent: boolean;
}

interface DashboardProps {
  onStartNewMeeting: () => void;
  onViewMeeting: (meeting: HistoricalMeeting) => void;
}

// Mock historical meeting data with recent dates
const mockMeetings: HistoricalMeeting[] = [
  {
    id: '1',
    title: 'Weekly Team Standup',
    date: '2025-01-27',
    status: 'completed',
    participants: [
      { id: '1', name: 'John Smith', email: 'john.smith@company.com' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      { id: '8', name: 'Jennifer Garcia', email: 'jennifer.garcia@company.com' },
    ],
    discussionCount: 8,
    questionCount: 3,
    actionCount: 6,
    fileName: 'weekly_standup_jan27.txt',
    fileSize: '1.1 MB',
    createdAt: '2025-01-27T09:15:00Z',
    lastModified: '2025-01-27T09:45:00Z',
    emailSent: true,
  },
  {
    id: '2',
    title: 'Q1 Budget Planning Session',
    date: '2025-01-25',
    status: 'completed',
    participants: [
      { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com' },
      { id: '5', name: 'Robert Wilson', email: 'robert.wilson@company.com' },
      { id: '6', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
      { id: '7', name: 'David Brown', email: 'david.brown@company.com' },
    ],
    discussionCount: 15,
    questionCount: 12,
    actionCount: 18,
    fileName: 'q1_budget_planning.txt',
    fileSize: '2.8 MB',
    createdAt: '2025-01-25T14:30:00Z',
    lastModified: '2025-01-25T16:15:00Z',
    emailSent: true,
  },
  {
    id: '3',
    title: 'Product Demo Review',
    date: '2025-01-24',
    status: 'processing',
    participants: [
      { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      { id: '4', name: 'Emily Davis', email: 'emily.davis@company.com' },
      { id: '9', name: 'Alex Thompson', email: 'alex.thompson@company.com' },
    ],
    discussionCount: 0,
    questionCount: 0,
    actionCount: 0,
    fileName: 'product_demo_review.txt',
    fileSize: '1.6 MB',
    createdAt: '2025-01-24T15:00:00Z',
    lastModified: '2025-01-24T15:00:00Z',
    emailSent: false,
  },
  {
    id: '4',
    title: 'Client Strategy Workshop',
    date: '2025-01-22',
    status: 'completed',
    participants: [
      { id: '1', name: 'John Smith', email: 'john.smith@company.com' },
      { id: '4', name: 'Emily Davis', email: 'emily.davis@company.com' },
      { id: '10', name: 'Maria Rodriguez', email: 'maria.rodriguez@company.com' },
      { id: '11', name: 'Kevin Park', email: 'kevin.park@company.com' },
    ],
    discussionCount: 22,
    questionCount: 16,
    actionCount: 14,
    fileName: 'client_strategy_workshop.txt',
    fileSize: '3.2 MB',
    createdAt: '2025-01-22T10:00:00Z',
    lastModified: '2025-01-22T12:30:00Z',
    emailSent: true,
  },
  {
    id: '5',
    title: 'Sprint Retrospective',
    date: '2025-01-20',
    status: 'completed',
    participants: [
      { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com' },
      { id: '8', name: 'Jennifer Garcia', email: 'jennifer.garcia@company.com' },
    ],
    discussionCount: 9,
    questionCount: 7,
    actionCount: 11,
    fileName: 'sprint_retrospective_jan20.txt',
    fileSize: '1.9 MB',
    createdAt: '2025-01-20T16:00:00Z',
    lastModified: '2025-01-20T17:15:00Z',
    emailSent: true,
  },
  {
    id: '6',
    title: 'Marketing Campaign Kickoff',
    date: '2025-01-18',
    status: 'failed',
    participants: [
      { id: '6', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
      { id: '7', name: 'David Brown', email: 'david.brown@company.com' },
      { id: '9', name: 'Alex Thompson', email: 'alex.thompson@company.com' },
    ],
    discussionCount: 0,
    questionCount: 0,
    actionCount: 0,
    fileName: 'marketing_kickoff_jan18.txt',
    fileSize: '2.1 MB',
    createdAt: '2025-01-18T11:00:00Z',
    lastModified: '2025-01-18T11:03:00Z',
    emailSent: false,
  },
  {
    id: '7',
    title: 'Architecture Review Meeting',
    date: '2025-01-15',
    status: 'completed',
    participants: [
      { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com' },
      { id: '5', name: 'Robert Wilson', email: 'robert.wilson@company.com' },
      { id: '12', name: 'Priya Patel', email: 'priya.patel@company.com' },
    ],
    discussionCount: 13,
    questionCount: 8,
    actionCount: 9,
    fileName: 'architecture_review_jan15.txt',
    fileSize: '2.4 MB',
    createdAt: '2025-01-15T14:00:00Z',
    lastModified: '2025-01-15T15:30:00Z',
    emailSent: true,
  },
  {
    id: '8',
    title: 'Quarterly Business Review Draft',
    date: '2025-01-12',
    status: 'draft',
    participants: [
      { id: '1', name: 'John Smith', email: 'john.smith@company.com' },
      { id: '5', name: 'Robert Wilson', email: 'robert.wilson@company.com' },
      { id: '6', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
      { id: '10', name: 'Maria Rodriguez', email: 'maria.rodriguez@company.com' },
    ],
    discussionCount: 18,
    questionCount: 11,
    actionCount: 13,
    fileName: 'quarterly_review_draft.txt',
    fileSize: '3.5 MB',
    createdAt: '2025-01-12T13:00:00Z',
    lastModified: '2025-01-12T14:45:00Z',
    emailSent: false,
  },
];

export function Dashboard({ onStartNewMeeting, onViewMeeting }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'draft':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMeetings = mockMeetings
    .filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           meeting.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStats = () => {
    const total = mockMeetings.length;
    const completed = mockMeetings.filter(m => m.status === 'completed').length;
    const processing = mockMeetings.filter(m => m.status === 'processing').length;
    const totalActions = mockMeetings.reduce((sum, m) => sum + m.actionCount, 0);
    
    return { total, completed, processing, totalActions };
  };

  const stats = getStats();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">My Meetings Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and review all your meeting transcripts and generated minutes
          </p>
        </div>
        <Button onClick={onStartNewMeeting} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Meeting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-xl font-semibold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
                <p className="text-xl font-semibold">{stats.totalActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings, participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
                <SelectItem value="status">Sort by Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meeting List */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">{meeting.title}</h3>
                    {getStatusBadge(meeting.status)}
                    {meeting.emailSent && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Mail className="w-3 h-3 mr-1" />
                        Email Sent
                      </Badge>
                    )}
                  </div>

                  {/* Meeting Info */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(meeting.date)} at {formatTime(meeting.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants.length} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{meeting.fileName} ({meeting.fileSize})</span>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Participants:</span>
                    <div className="flex flex-wrap gap-1">
                      {meeting.participants.slice(0, 3).map((participant) => (
                        <Badge key={participant.id} variant="secondary" className="text-xs">
                          {participant.name}
                        </Badge>
                      ))}
                      {meeting.participants.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{meeting.participants.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {meeting.status === 'completed' && (
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-blue-600">
                        <MessageSquare className="w-4 h-4" />
                        <span>{meeting.discussionCount} discussions</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <HelpCircle className="w-4 h-4" />
                        <span>{meeting.questionCount} questions</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckSquare className="w-4 h-4" />
                        <span>{meeting.actionCount} actions</span>
                      </div>
                    </div>
                  )}

                  {meeting.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">AI is processing the transcript...</span>
                    </div>
                  )}

                  {meeting.status === 'failed' && (
                    <div className="text-sm text-red-600">
                      Processing failed. Please try uploading the transcript again.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {meeting.status === 'completed' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewMeeting(meeting)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </>
                  )}
                  {meeting.status === 'draft' && (
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Continue
                    </Button>
                  )}
                  {meeting.status === 'failed' && (
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMeetings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No meetings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by uploading your first meeting transcript'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={onStartNewMeeting}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Meeting
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}