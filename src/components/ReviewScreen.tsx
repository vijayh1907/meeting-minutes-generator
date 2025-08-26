import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageSquare, HelpCircle, CheckSquare, Edit, Save, X } from 'lucide-react';
import { MeetingData, ClassifiedItem } from '../App';

interface ReviewScreenProps {
  meetingData: MeetingData;
  setMeetingData: (data: MeetingData) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

// Mock AI-generated classified content
const mockClassifiedItems: ClassifiedItem[] = [
  {
    id: '1',
    content: 'The team discussed the current quarterly results which show a 15% increase in customer acquisition compared to last quarter.',
    type: 'discussion',
    speaker: 'John Smith'
  },
  {
    id: '2',
    content: 'We need to finalize the budget allocation for the upcoming marketing campaign by next Friday.',
    type: 'action',
    speaker: 'Sarah Johnson'
  },
  {
    id: '3',
    content: 'What is the expected timeline for the new product launch?',
    type: 'question',
    speaker: 'Mike Chen'
  },
  {
    id: '4',
    content: 'The development team provided updates on the current sprint progress, indicating that 80% of planned features are complete.',
    type: 'discussion',
    speaker: 'Emily Davis'
  },
  {
    id: '5',
    content: 'How will we handle the resource allocation for the Q2 project?',
    type: 'question',
    speaker: 'Robert Wilson'
  },
  {
    id: '6',
    content: 'Schedule a follow-up meeting with the client to discuss project requirements in detail.',
    type: 'action',
    speaker: 'Lisa Anderson'
  },
  {
    id: '7',
    content: 'The sales team reported that the new pricing strategy has resulted in a 23% improvement in conversion rates.',
    type: 'discussion',
    speaker: 'David Brown'
  },
  {
    id: '8',
    content: 'Prepare the quarterly performance report and distribute to all stakeholders before the board meeting.',
    type: 'action',
    speaker: 'Jennifer Garcia'
  }
];

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
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Simulate AI processing
    if (meetingData.classifiedItems.length === 0) {
      setProcessing(true);
      const timer = setTimeout(() => {
        setMeetingData({
          ...meetingData,
          classifiedItems: mockClassifiedItems,
        });
        setProcessing(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setProcessing(false);
    }
  }, []);

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

  const handleTypeChange = (itemId: string, newType: 'discussion' | 'question' | 'action') => {
    setMeetingData({
      ...meetingData,
      classifiedItems: meetingData.classifiedItems.map(item =>
        item.id === itemId ? { ...item, type: newType } : item
      ),
    });
  };

  const getFilteredItems = () => {
    if (activeTab === 'all') return meetingData.classifiedItems;
    return meetingData.classifiedItems.filter(item => item.type === activeTab);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discussion':
        return <MessageSquare className="w-4 h-4" />;
      case 'question':
        return <HelpCircle className="w-4 h-4" />;
      case 'action':
        return <CheckSquare className="w-4 h-4" />;
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
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCounts = () => {
    const discussions = meetingData.classifiedItems.filter(item => item.type === 'discussion').length;
    const questions = meetingData.classifiedItems.filter(item => item.type === 'question').length;
    const actions = meetingData.classifiedItems.filter(item => item.type === 'action').length;
    return { discussions, questions, actions };
  };

  const counts = getCounts();

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <h3 className="text-lg font-medium">Processing Transcript...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Our AI is analyzing your meeting transcript and classifying content into discussions, questions, and actions. This may take a few moments.
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({meetingData.classifiedItems.length})</TabsTrigger>
          <TabsTrigger value="discussion">Discussions ({counts.discussions})</TabsTrigger>
          <TabsTrigger value="question">Questions ({counts.questions})</TabsTrigger>
          <TabsTrigger value="action">Actions ({counts.actions})</TabsTrigger>
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
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={item.type}
                          onValueChange={(value: 'discussion' | 'question' | 'action') =>
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
          onClick={onNext}
          disabled={!canGoNext || meetingData.classifiedItems.length === 0}
        >
          Continue to Action Assignment
        </Button>
      </div>
    </div>
  );
}