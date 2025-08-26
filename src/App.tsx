import React, { useState } from 'react';
import { Dashboard, HistoricalMeeting } from './components/Dashboard';
import { MeetingDetailsScreen } from './components/MeetingDetailsScreen';
import { UploadScreen } from './components/UploadScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { AssignmentScreen } from './components/AssignmentScreen';
import { EmailPreviewScreen } from './components/EmailPreviewScreen';
import { Button } from './components/ui/button';
import { ChevronLeft, ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export type Participant = {
  id: string;
  name: string;
  email: string;
};

export type ClassifiedItem = {
  id: string;
  content: string;
  type: 'discussion' | 'question' | 'action';
  speaker?: string;
};

export type ActionItem = {
  id: string;
  content: string;
  assignedTo: string;
  assigneeName: string;
  dueDate?: string;
};

export type MeetingData = {
  transcriptFile: File | null;
  participants: Participant[];
  classifiedItems: ClassifiedItem[];
  actionItems: ActionItem[];
  meetingTitle: string;
  meetingDate: string;
  attachments: File[];
};

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'meeting' | 'meeting-details'>('dashboard');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMeeting, setSelectedMeeting] = useState<HistoricalMeeting | null>(null);
  const [meetingData, setMeetingData] = useState<MeetingData>({
    transcriptFile: null,
    participants: [],
    classifiedItems: [],
    actionItems: [],
    meetingTitle: '',
    meetingDate: new Date().toISOString().split('T')[0],
    attachments: []
  });

  const steps = [
    { title: 'Upload & Select', component: UploadScreen },
    { title: 'Review & Classify', component: ReviewScreen },
    { title: 'Assign Actions', component: AssignmentScreen },
    { title: 'Email Preview', component: EmailPreviewScreen }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleStartNewMeeting = () => {
    // Reset meeting data and navigate to upload screen
    setMeetingData({
      transcriptFile: null,
      participants: [],
      classifiedItems: [],
      actionItems: [],
      meetingTitle: '',
      meetingDate: new Date().toISOString().split('T')[0],
      attachments: []
    });
    setCurrentStep(0);
    setCurrentView('meeting');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentStep(0);
    setSelectedMeeting(null);
  };

  const handleViewMeeting = (meeting: HistoricalMeeting) => {
    setSelectedMeeting(meeting);
    setCurrentView('meeting-details');
  };

  // Render meeting details view
  if (currentView === 'meeting-details' && selectedMeeting) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-medium">MeetingAI</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Meeting Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting details content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <MeetingDetailsScreen 
              meeting={selectedMeeting} 
              onBack={handleBackToDashboard}
            />
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  // Render dashboard view
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-medium">MeetingAI</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <Dashboard 
              onStartNewMeeting={handleStartNewMeeting} 
              onViewMeeting={handleViewMeeting}
            />
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  // Render meeting creation flow
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with navigation */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-2xl font-medium">MeetingAI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleStepClick(index)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStep
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm ${
                    index <= currentStep
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <CurrentStepComponent
            meetingData={meetingData}
            setMeetingData={setMeetingData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoNext={currentStep < steps.length - 1}
            canGoPrevious={currentStep > 0}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}